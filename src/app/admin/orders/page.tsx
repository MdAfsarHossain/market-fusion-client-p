"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Meta, OrderStatus, PaymentStatus } from "@/lib/types";
import { formatDate, formatPrice, humanize, statusTone, toNumber } from "@/lib/format";
import { RequireAuth } from "@/components/layout/RequireAuth";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";

type AdminOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: string | number;
  grand_total: string | number;
  currency: string;
  placed_at?: string;
  createdAt?: string;
  total_stores: string | number;
  total_items: string | number;
  platform_commission: string | number;
  customer: { id: string; name: string; email: string; avatar?: string | null };
};

const orderStatuses = [
  "",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

const paymentStatuses = ["", "PENDING", "PAID", "FAILED", "REFUNDED"];

export default function AdminOrdersPage() {
  return (
    <RequireAuth guard="admin">
      <AdminOrdersView />
    </RequireAuth>
  );
}

const AdminOrdersView = () => {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOrders(null);

    try {
      const res = await api.get<AdminOrder[]>("/order/admin/all", {
        query: {
          page,
          limit: 10,
          status: status || undefined,
          payment_status: paymentStatus || undefined,
          searchTerm: term || undefined,
        },
      });
      setOrders(res.data);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load orders.");
      setOrders([]);
    }
  }, [page, status, paymentStatus, term]);

  useEffect(() => {
    void load();
  }, [load]);

  // Commission earned across the rows currently on screen
  const pageCommission = (orders || []).reduce(
    (sum, order) => sum + toNumber(order.platform_commission),
    0,
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description={meta ? `${meta.total} order${meta.total === 1 ? "" : "s"}` : undefined}
        action={
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setTerm(search.trim());
              setPage(1);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <Input
              className="w-40"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order no. or email"
            />
            <Select
              className="w-36"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by order status"
            >
              {orderStatuses.map((value) => (
                <option key={value || "all"} value={value}>
                  {value ? humanize(value) : "All statuses"}
                </option>
              ))}
            </Select>
            <Select
              className="w-32"
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by payment status"
            >
              {paymentStatuses.map((value) => (
                <option key={value || "all"} value={value}>
                  {value ? humanize(value) : "All payments"}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="outline">
              Go
            </Button>
          </form>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {orders === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" description="Try a different filter or search." />
      ) : (
        <>
          <Card className="mb-4 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Platform commission on this page
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatPrice(pageCommission, orders[0]?.currency || "USD")}
            </p>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Vendors</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Commission</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-xs font-medium text-slate-900 hover:text-brand-600"
                        >
                          {order.order_number}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDate(order.placed_at || order.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">{order.customer.name}</p>
                        <p className="text-xs text-slate-500">{order.customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {toNumber(order.total_stores)} store(s)
                        <p className="text-xs text-slate-400">
                          {toNumber(order.total_items)} item(s)
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatPrice(order.grand_total, order.currency)}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-700">
                        {formatPrice(order.platform_commission, order.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge className={statusTone(order.status)}>
                            {humanize(order.status)}
                          </Badge>
                          <Badge className={statusTone(order.payment_status)}>
                            {humanize(order.payment_status)}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

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
