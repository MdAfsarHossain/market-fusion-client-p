"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Meta, Product, ProductStatus } from "@/lib/types";
import {
  formatDate,
  formatPrice,
  humanize,
  productTypeLabel,
  statusTone,
} from "@/lib/format";
import { RequireAuth } from "@/components/layout/RequireAuth";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";

const statuses: (ProductStatus | "")[] = [
  "",
  "PENDING",
  "PUBLISHED",
  "DRAFT",
  "REJECTED",
  "ARCHIVED",
];

export default function AdminProductsPage() {
  return (
    <RequireAuth guard="admin">
      <AdminProductsView />
    </RequireAuth>
  );
}

const AdminProductsView = () => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  // Pending products are what an admin actually needs to act on
  const [status, setStatus] = useState<string>("PENDING");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [acting, setActing] = useState<Product | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setProducts(null);

    try {
      const res = await api.get<Product[]>("/product/admin/all", {
        query: {
          page,
          limit: 10,
          status: status || undefined,
          searchTerm: term || undefined,
        },
      });
      setProducts(res.data);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load products.");
      setProducts([]);
    }
  }, [page, status, term]);

  useEffect(() => {
    void load();
  }, [load]);

  const publish = async (product: Product) => {
    setError(null);
    setNotice(null);
    setBusyId(product.id);

    try {
      await api.patch(`/product/admin/status/${product.id}`, { status: "PUBLISHED" });
      setNotice(`"${product.title}" is now live.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not publish this product.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!acting) return;

    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      await api.patch(`/product/admin/status/${acting.id}`, {
        status: "REJECTED",
        rejection_reason: reason.trim(),
      });
      setNotice(`"${acting.title}" was rejected.`);
      setActing(null);
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject this product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={
          meta ? `${meta.total} product${meta.total === 1 ? "" : "s"} in this view` : undefined
        }
        action={
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setTerm(search.trim());
              setPage(1);
            }}
            className="flex items-center gap-2"
          >
            <Input
              className="w-44"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or store"
            />
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
                  {value ? humanize(value) : "All"}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="outline">
              Go
            </Button>
          </form>
        }
      />

      {notice && (
        <div className="mb-6">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {error && !acting && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {products === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Nothing to review"
          description={
            status === "PENDING"
              ? "No products are waiting for approval right now."
              : "No products match this filter."
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {products.map((product) => (
              <Card key={product.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {product.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{product.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {product.store?.name} · {productTypeLabel[product.type]} ·{" "}
                        {formatPrice(product.base_price, product.currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Submitted {formatDate(product.createdAt)}
                      </p>
                      {product.short_description && (
                        <p className="mt-2 max-w-xl text-sm text-slate-600">
                          {product.short_description}
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge className={statusTone(product.status || "DRAFT")}>
                    {humanize(product.status)}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  {product.status === "PUBLISHED" && (
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      View on marketplace
                    </Link>
                  )}

                  {product.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => publish(product)}
                        loading={busyId === product.id}
                      >
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActing(product);
                          setReason("");
                          setError(null);
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {product.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setActing(product);
                        setReason("");
                        setError(null);
                      }}
                    >
                      Unpublish
                    </Button>
                  )}

                  {product.status === "REJECTED" && product.rejection_reason && (
                    <p className="text-xs text-red-600">Reason: {product.rejection_reason}</p>
                  )}
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

      {acting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="w-full max-w-md p-5">
            <h2 className="text-base font-semibold text-slate-900">Reject product</h2>
            <p className="mt-1 text-sm text-slate-500">{acting.title}</p>

            <div className="mt-4 space-y-4">
              {error && <Alert>{error}</Alert>}

              <Field
                label="Reason"
                required
                hint="The vendor sees this and can fix it, then resubmit."
              >
                <Textarea
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Images are too low quality, description is missing key details…"
                  className="min-h-24"
                />
              </Field>

              <div className="flex gap-2">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={reject}
                  loading={saving}
                  disabled={!reason.trim()}
                >
                  Reject product
                </Button>
                <Button variant="outline" onClick={() => setActing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
