"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Meta, Store, StoreStatus } from "@/lib/types";
import { formatDate, formatPrice, humanize, statusTone, toNumber } from "@/lib/format";
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

const statuses: (StoreStatus | "")[] = ["", "PENDING", "ACTIVE", "SUSPENDED", "REJECTED"];

export default function AdminStoresPage() {
  return (
    <RequireAuth guard="admin">
      <AdminStoresView />
    </RequireAuth>
  );
}

const AdminStoresView = () => {
  const [stores, setStores] = useState<Store[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [acting, setActing] = useState<Store | null>(null);
  const [nextStatus, setNextStatus] = useState<StoreStatus>("ACTIVE");
  const [commission, setCommission] = useState("10");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStores(null);

    try {
      const res = await api.get<Store[]>("/store/admin/all", {
        query: {
          page,
          limit: 10,
          status: status || undefined,
          searchTerm: term || undefined,
        },
      });
      setStores(res.data);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load stores.");
      setStores([]);
    }
  }, [page, status, term]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAction = (store: Store, preset: StoreStatus) => {
    setActing(store);
    setNextStatus(preset);
    setCommission(String(toNumber(store.commission_rate) || 10));
    setReason("");
    setError(null);
  };

  const applyStatus = async () => {
    if (!acting) return;

    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      await api.patch(`/store/admin/status/${acting.id}`, {
        status: nextStatus,
        ...(nextStatus === "REJECTED" ? { rejection_reason: reason.trim() } : {}),
        ...(nextStatus === "ACTIVE" ? { commission_rate: Number(commission) } : {}),
      });

      setNotice(`${acting.name} is now ${humanize(nextStatus).toLowerCase()}.`);
      setActing(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this store.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Stores"
        description={meta ? `${meta.total} store${meta.total === 1 ? "" : "s"}` : undefined}
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
              placeholder="Search name or email"
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

      {stores === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : stores.length === 0 ? (
        <EmptyState title="No stores found" description="Try a different filter or search." />
      ) : (
        <>
          <div className="space-y-4">
            {stores.map((store) => (
              <Card key={store.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-200 text-sm font-semibold uppercase text-slate-600">
                      {store.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        store.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{store.name}</p>
                      <p className="text-xs text-slate-500">
                        {store.owner?.name} · {store.owner?.email}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Applied {formatDate(store.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Badge className={statusTone(store.status || "PENDING")}>
                    {humanize(store.status)}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
                  <Figure label="Products" value={toNumber(store.total_products).toString()} />
                  <Figure label="Commission" value={`${toNumber(store.commission_rate)}%`} />
                  <Figure label="Total sales" value={formatPrice(store.total_sales, "USD")} />
                  <Figure
                    label="Location"
                    value={[store.city, store.country].filter(Boolean).join(", ") || "—"}
                  />
                </div>

                {store.rejection_reason && (
                  <p className="mt-3 text-xs text-red-600">
                    Rejected: {store.rejection_reason}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {store.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => openAction(store, "ACTIVE")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(store, "REJECTED")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {store.status === "ACTIVE" && (
                    <>
                      <Link
                        href={`/stores/${store.slug}`}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        View storefront
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(store, "ACTIVE")}
                      >
                        Change commission
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => openAction(store, "SUSPENDED")}
                      >
                        Suspend
                      </Button>
                    </>
                  )}
                  {(store.status === "SUSPENDED" || store.status === "REJECTED") && (
                    <Button size="sm" onClick={() => openAction(store, "ACTIVE")}>
                      Reinstate
                    </Button>
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
            <h2 className="text-base font-semibold text-slate-900">{acting.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Currently {humanize(acting.status).toLowerCase()}.
            </p>

            <div className="mt-4 space-y-4">
              {error && <Alert>{error}</Alert>}

              <Field label="New status" required>
                <Select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value as StoreStatus)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
              </Field>

              {nextStatus === "ACTIVE" && (
                <Field
                  label="Commission rate (%)"
                  required
                  hint="The platform's cut of every sale from this store"
                >
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={commission}
                    onChange={(event) => setCommission(event.target.value)}
                  />
                </Field>
              )}

              {nextStatus === "REJECTED" && (
                <Field label="Rejection reason" required>
                  <Textarea
                    value={reason}
                    maxLength={500}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Tell the vendor what needs fixing"
                    className="min-h-20"
                  />
                </Field>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={applyStatus}
                  loading={saving}
                  disabled={nextStatus === "REJECTED" && !reason.trim()}
                >
                  Confirm
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

const Figure = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm text-slate-700">{value}</p>
  </div>
);
