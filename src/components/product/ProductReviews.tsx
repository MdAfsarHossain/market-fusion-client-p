import { apiRequest } from "@/lib/api";
import type { Meta, Review, ReviewSummary } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Card, EmptyState } from "@/components/ui";
import { Stars } from "@/components/ui/Stars";

// Server rendered so reviews are part of the indexable product page
export const ProductReviews = async ({ productId }: { productId: string }) => {
  const res = await apiRequest<{ summary: ReviewSummary; reviews: Review[] }>(
    `/review/product/${productId}`,
    { token: null, query: { limit: 10 }, cache: "no-store" },
  ).catch(() => null);

  const summary = res?.data.summary;
  const reviews = res?.data.reviews ?? [];
  const meta: Meta | undefined = res?.meta;

  if (!summary || summary.total === 0) {
    return (
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Reviews</h2>
        <EmptyState
          title="No reviews yet"
          description="Buyers can review this product once their order has been delivered."
        />
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Reviews ({summary.total})
      </h2>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Card className="p-5 lg:sticky lg:top-24 lg:self-start">
          <div className="text-center">
            <p className="text-4xl font-semibold text-slate-900">
              {summary.average.toFixed(1)}
            </p>
            <Stars rating={summary.average} className="mt-1 justify-center" />
            <p className="mt-1 text-sm text-slate-500">
              {summary.total} review{summary.total === 1 ? "" : "s"}
            </p>
          </div>

          {/* Star breakdown, widest bar being the most common rating */}
          <div className="mt-5 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.breakdown[String(star)] ?? 0;
              const percent = summary.total ? (count / summary.total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-slate-600">{star}</span>
                  <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
                  </svg>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold uppercase text-slate-600">
                  {review.reviewer?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.reviewer.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (review.reviewer?.name || "?").charAt(0)
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {review.reviewer?.name || "Anonymous"}
                    </span>
                    {review.is_verified_purchase && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        Verified purchase
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <Stars rating={review.rating} size="sm" />
                    <span className="text-xs text-slate-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {review.title && (
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {review.title}
                    </p>
                  )}
                  {review.comment && (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {review.comment}
                    </p>
                  )}

                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.images.map((url, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={index}
                          src={url}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}

                  {review.vendor_reply && (
                    <div className="mt-3 rounded-lg border-l-2 border-brand-300 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-700">
                        Response from the seller
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                        {review.vendor_reply}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {meta && meta.total > reviews.length && (
            <p className="text-center text-sm text-slate-500">
              Showing the {reviews.length} most recent of {meta.total} reviews.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
