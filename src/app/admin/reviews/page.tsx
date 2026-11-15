"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Meta, Review, ReviewStatus } from "@/lib/types";
import { formatDate, humanize, statusTone } from "@/lib/format";
import { RequireAuth } from "@/components/layout/RequireAuth";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { Stars } from "@/components/ui/Stars";

const statuses: (ReviewStatus | "")[] = ["", "PUBLISHED", "PENDING", "REJECTED"];

export default function AdminReviewsPage() {
  return (
    <RequireAuth guard="admin">
      <AdminReviewsView />
    </RequireAuth>
  );
}

const AdminReviewsView = () => {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const [rejecting, setRejecting] = useState<Review | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setReviews(null);

    try {
      const res = await api.get<Review[]>("/review/admin/all", {
        query: {
          page,
          limit: 10,
          status: status || undefined,
          rating: ratingFilter || undefined,
        },
      });
      setReviews(res.data);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load reviews.");
      setReviews([]);
    }
  }, [page, status, ratingFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const setReviewStatus = async (
    review: Review,
    next: ReviewStatus,
    rejectionReason?: string,
  ) => {
    setBusyId(review.id);
    setError(null);
    setNotice(null);

    try {
      await api.patch(`/review/admin/status/${review.id}`, {
        status: next,
        ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
      });
      setNotice(
        next === "REJECTED"
          ? "Review removed. Ratings have been recalculated."
          : "Review published. Ratings have been recalculated.",
      );
      setRejecting(null);
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update that review.");
    } finally {
      setBusyId(null);
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Removing a review takes it out of the public average immediately."
        action={
          <div className="flex items-center gap-2">
            <Select
              className="w-36"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              {statuses.map((value) => (
                <option key={value || "all"} value={value}>
                  {value ? humanize(value) : "All statuses"}
                </option>
              ))}
            </Select>
            <Select
              className="w-32"
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by rating"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((star) => (
                <option key={star} value={star}>
                  {star} star{star === 1 ? "" : "s"}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {notice && (
        <div className="mb-6">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {error && !rejecting && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {reviews === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews found" description="Try a different filter." />
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {review.product?.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.product.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/products/${review.product?.slug}`}
                        className="text-sm font-medium text-slate-900 hover:text-brand-600"
                      >
                        {review.product?.title}
                      </Link>
                      <Badge className={statusTone(review.status)}>
                        {humanize(review.status)}
                      </Badge>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <Stars rating={review.rating} size="sm" />
                      <span className="text-xs text-slate-500">
                        {review.reviewer?.name} ({review.reviewer?.email}) ·{" "}
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Store: {review.store?.name}
                    </p>

                    {review.title && (
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {review.title}
                      </p>
                    )}
                    {review.comment && (
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                        {review.comment}
                      </p>
                    )}

                    {review.rejection_reason && (
                      <p className="mt-2 text-xs text-red-600">
                        Removed: {review.rejection_reason}
                      </p>
                    )}

                    {rejecting?.id === review.id ? (
                      <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-3">
                        {error && <Alert>{error}</Alert>}
                        <Field label="Why is this being removed?" required>
                          <Textarea
                            value={reason}
                            maxLength={500}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Spam, abusive language, unrelated to the product…"
                            className="min-h-20"
                          />
                        </Field>
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            loading={saving}
                            disabled={!reason.trim()}
                            onClick={() => {
                              setSaving(true);
                              void setReviewStatus(review, "REJECTED", reason.trim());
                            }}
                          >
                            Remove review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejecting(null);
                              setReason("");
                              setError(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                        {review.status !== "PUBLISHED" && (
                          <Button
                            size="sm"
                            loading={busyId === review.id}
                            onClick={() => void setReviewStatus(review, "PUBLISHED")}
                          >
                            Publish
                          </Button>
                        )}
                        {review.status !== "REJECTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejecting(review);
                              setReason("");
                              setError(null);
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {meta && meta.totalPage > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {meta.page} of {meta.totalPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};
