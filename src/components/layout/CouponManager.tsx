"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Coupon, DiscountType, Meta } from "@/lib/types";
import { formatDate, formatPrice, toNumber } from "@/lib/format";
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

// One component serves both dashboards: a vendor sees only their store's codes,
// an admin sees every code and can create platform-wide ones.
export const CouponManager = ({ scope }: { scope: "vendor" | "admin" }) => {
  const isAdmin = scope === "admin";
  const listPath = isAdmin ? "/coupon/admin/all" : "/coupon/my-coupons";

  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emptyForm = {
    code: "",
    name: "",
    description: "",
    discount_type: "PERCENTAGE" as DiscountType,
    discount_value: "",
    max_discount_amount: "",
    min_order_amount: "0",
    usage_limit: "",
    usage_limit_per_user: "1",
    expires_at: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setCoupons(null);

    try {
      const res = await api.get<Coupon[]>(listPath, {
        query: {
          page,
          limit: 10,
          ...(isAdmin
            ? { searchTerm: term || undefined, scope: scopeFilter || undefined }
            : {}),
        },
      });
      setCoupons(res.data);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load coupons.");
      setCoupons([]);
    }
  }, [listPath, page, term, scopeFilter, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (key: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: String(toNumber(coupon.discount_value)),
      max_discount_amount: coupon.max_discount_amount
        ? String(toNumber(coupon.max_discount_amount))
        : "",
      min_order_amount: String(toNumber(coupon.min_order_amount)),
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : "",
      usage_limit_per_user: coupon.usage_limit_per_user
        ? String(coupon.usage_limit_per_user)
        : "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
    });
    setShowForm(true);
    setError(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);

    // Dates arrive from <input type="date">, so send a full ISO timestamp
    const expiresAt = form.expires_at
      ? new Date(`${form.expires_at}T23:59:59`).toISOString()
      : undefined;

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      ...(form.max_discount_amount
        ? { max_discount_amount: Number(form.max_discount_amount) }
        : {}),
      min_order_amount: Number(form.min_order_amount) || 0,
      ...(form.usage_limit ? { usage_limit: Number(form.usage_limit) } : {}),
      ...(form.usage_limit_per_user
        ? { usage_limit_per_user: Number(form.usage_limit_per_user) }
        : {}),
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    };

    try {
      if (editing) {
        await api.patch(`/coupon/update/${editing.id}`, payload);
        setNotice(`Coupon ${editing.code} updated.`);
      } else {
        await api.post("/coupon/create", {
          ...payload,
          code: form.code.trim().toUpperCase(),
        });
        setNotice(`Coupon ${form.code.trim().toUpperCase()} created.`);
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setBusyId(coupon.id);
    setError(null);

    try {
      await api.patch(`/coupon/update/${coupon.id}`, {
        is_active: !coupon.is_active,
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this coupon.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (coupon: Coupon) => {
    setBusyId(coupon.id);
    setError(null);
    setNotice(null);

    try {
      const res = await api.remove<{ deactivated: boolean; message: string }>(
        `/coupon/delete/${coupon.id}`,
      );
      setNotice(res.data?.message || "Coupon deleted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this coupon.");
    } finally {
      setBusyId(null);
    }
  };

  const describeDiscount = (coupon: Coupon) =>
    coupon.discount_type === "PERCENTAGE"
      ? `${toNumber(coupon.discount_value)}% off${
          coupon.max_discount_amount
            ? ` (max ${formatPrice(coupon.max_discount_amount)})`
            : ""
        }`
      : `${formatPrice(coupon.discount_value)} off`;

  const isExpired = (coupon: Coupon) =>
    Boolean(coupon.expires_at && new Date(coupon.expires_at) < new Date());

  const isExhausted = (coupon: Coupon) =>
    coupon.usage_limit !== null &&
    coupon.usage_limit !== undefined &&
    coupon.used_count >= coupon.usage_limit;

  return (
    <>
      <PageHeader
        title="Coupons"
        description={
          isAdmin
            ? "Platform coupons are funded by the marketplace; store coupons are funded by the vendor."
            : "Discounts you fund yourself, applied to your own products."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setTerm(search.trim());
                  setPage(1);
                }}
                className="flex items-center gap-2"
              >
                <Input
                  className="w-36"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Code or name"
                />
                <Select
                  className="w-32"
                  value={scopeFilter}
                  onChange={(event) => {
                    setScopeFilter(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by scope"
                >
                  <option value="">All scopes</option>
                  <option value="PLATFORM">Platform</option>
                  <option value="STORE">Store</option>
                </Select>
                <Button type="submit" variant="outline">
                  Go
                </Button>
              </form>
            )}
            {!showForm && <Button onClick={openCreate}>New coupon</Button>}
          </div>
        }
      />

      {notice && (
        <div className="mb-6">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {error && !showForm && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {showForm && (
        <Card className="mb-6 p-5">
          <h2 className="text-base font-semibold text-slate-900">
            {editing ? `Edit ${editing.code}` : "New coupon"}
          </h2>
          {isAdmin && !editing && (
            <p className="mt-1 text-sm text-slate-500">
              This will be a platform-wide coupon funded by the marketplace.
            </p>
          )}

          <form onSubmit={save} className="mt-5 space-y-4">
            {error && <Alert>{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Code"
                required
                hint={editing ? "A code cannot be changed once created" : "Letters, numbers, dashes"}
              >
                <Input
                  required
                  disabled={Boolean(editing)}
                  minLength={3}
                  value={form.code}
                  onChange={update("code")}
                  placeholder="SUMMER20"
                  className="font-mono uppercase"
                />
              </Field>

              <Field label="Name" required>
                <Input
                  required
                  minLength={3}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Summer sale"
                />
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={update("description")}
                className="min-h-16"
                placeholder="Shown to buyers browsing available offers"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Discount type" required>
                <Select value={form.discount_type} onChange={update("discount_type")}>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </Select>
              </Field>

              <Field
                label={form.discount_type === "PERCENTAGE" ? "Percent off" : "Amount off"}
                required
              >
                <Input
                  type="number"
                  required
                  min="0.01"
                  max={form.discount_type === "PERCENTAGE" ? "100" : undefined}
                  step="0.01"
                  value={form.discount_value}
                  onChange={update("discount_value")}
                />
              </Field>

              {form.discount_type === "PERCENTAGE" ? (
                <Field label="Max discount" hint="Caps a percentage discount">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.max_discount_amount}
                    onChange={update("max_discount_amount")}
                  />
                </Field>
              ) : (
                <Field label="Minimum order">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={update("min_order_amount")}
                  />
                </Field>
              )}
            </div>

            {form.discount_type === "PERCENTAGE" && (
              <Field label="Minimum order" hint="Leave 0 for no minimum">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_order_amount}
                  onChange={update("min_order_amount")}
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Total uses" hint="Blank for unlimited">
                <Input
                  type="number"
                  min="1"
                  value={form.usage_limit}
                  onChange={update("usage_limit")}
                />
              </Field>

              <Field label="Uses per customer" hint="Blank for unlimited">
                <Input
                  type="number"
                  min="1"
                  value={form.usage_limit_per_user}
                  onChange={update("usage_limit_per_user")}
                />
              </Field>

              <Field label="Expires on" hint="Blank never expires">
                <Input type="date" value={form.expires_at} onChange={update("expires_at")} />
              </Field>
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Create coupon"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {coupons === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : coupons.length === 0 ? (
        !showForm && (
          <EmptyState
            title="No coupons yet"
            description="Create a discount code to bring buyers back."
            action={<Button onClick={openCreate}>New coupon</Button>}
          />
        )
      ) : (
        <>
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-sm font-semibold text-white">
                        {coupon.code}
                      </span>
                      <Badge
                        className={
                          coupon.store_id
                            ? "bg-violet-50 text-violet-700 ring-violet-200"
                            : "bg-brand-50 text-brand-700 ring-brand-200"
                        }
                      >
                        {coupon.store_id ? "Store" : "Platform"}
                      </Badge>
                      {!coupon.is_active && (
                        <Badge className="bg-slate-100 text-slate-600 ring-slate-200">
                          Inactive
                        </Badge>
                      )}
                      {isExpired(coupon) && (
                        <Badge className="bg-red-50 text-red-700 ring-red-200">
                          Expired
                        </Badge>
                      )}
                      {isExhausted(coupon) && (
                        <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
                          Fully used
                        </Badge>
                      )}
                    </div>

                    <p className="mt-2 font-medium text-slate-900">{coupon.name}</p>
                    <p className="text-sm text-slate-600">{describeDiscount(coupon)}</p>
                    {isAdmin && coupon.store && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Store: {coupon.store.name}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-medium text-slate-900">
                      {coupon.used_count}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""} used
                    </p>
                    {coupon.usage_limit_per_user && (
                      <p className="text-xs text-slate-500">
                        {coupon.usage_limit_per_user} per customer
                      </p>
                    )}
                    {toNumber(coupon.min_order_amount) > 0 && (
                      <p className="text-xs text-slate-500">
                        Min {formatPrice(coupon.min_order_amount)}
                      </p>
                    )}
                    {coupon.expires_at && (
                      <p className="text-xs text-slate-500">
                        Until {formatDate(coupon.expires_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}>
                    Edit
                  </Button>
                  <button
                    onClick={() => void toggleActive(coupon)}
                    disabled={busyId === coupon.id}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    {coupon.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => void remove(coupon)}
                    disabled={busyId === coupon.id}
                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
                  >
                    Delete
                  </button>
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
