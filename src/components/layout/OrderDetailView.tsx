"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Order } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  humanize,
  productTypeLabel,
  statusTone,
  toNumber,
} from "@/lib/format";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  Textarea,
} from "@/components/ui";
import { StartConversationButton } from "@/components/chat/StartConversationButton";

export const OrderDetailView = ({
  orderId,
  justPlaced,
}: {
  orderId: string;
  justPlaced: boolean;
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<Order>(`/order/my-orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError("Could not load this order.");
      }
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startPayment = async () => {
    setError(null);
    setPaying(true);

    try {
      const res = await api.post<{ checkout_url: string | null }>(
        `/payment/create-session/${orderId}`,
      );

      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }

      setError("The payment provider did not return a checkout link.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not start the payment.",
      );
    } finally {
      setPaying(false);
    }
  };

  const cancelOrder = async () => {
    setError(null);
    setCancelling(true);

    try {
      await api.patch(`/order/cancel/${orderId}`, {
        ...(cancelReason.trim() ? { reason: cancelReason.trim() } : {}),
      });
      setShowCancel(false);
      setCancelReason("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  if (notFound) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Order not found"
          description="This order does not exist, or it belongs to another account."
          action={<ButtonLink href="/orders">Back to my orders</ButtonLink>}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-600" />
      </div>
    );
  }

  const isUnpaid = order.payment_status === "PENDING" || order.payment_status === "FAILED";
  const canPay = isUnpaid && order.status !== "CANCELLED";
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);

  return (
    <div className="container-page py-10">
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M16 10H5M9 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All orders
      </Link>

      <PageHeader
        title={order.order_number}
        description={`Placed ${formatDateTime(order.placed_at || order.createdAt)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusTone(order.status)}>{humanize(order.status)}</Badge>
            <Badge className={statusTone(order.payment_status)}>
              {humanize(order.payment_status)}
            </Badge>
          </div>
        }
      />

      {justPlaced && isUnpaid && (
        <div className="mb-6">
          <Alert tone="success">
            Your order is placed. Complete the payment to let the vendors start working on it.
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* One card per vendor: each moves through fulfilment on its own */}
          {order.sub_orders.map((subOrder) => (
            <Card key={subOrder.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                <div>
                  <Link
                    href={`/stores/${subOrder.store.slug}`}
                    className="text-sm font-medium text-slate-900 hover:text-brand-600"
                  >
                    {subOrder.store.name}
                  </Link>
                  <p className="font-mono text-xs text-slate-500">{subOrder.sub_order_number}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusTone(subOrder.status)}>{humanize(subOrder.status)}</Badge>
                  <StartConversationButton
                    storeId={subOrder.store.id}
                    storeName={subOrder.store.name}
                    orderId={order.id}
                    // The thread header cannot show an order number, so without
                    // this subject an order thread and the general one would be
                    // indistinguishable in the buyer's inbox.
                    subject={`Order ${order.order_number}`}
                    label="Message vendor"
                    size="sm"
                  />
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {subOrder.items.map((item) => (
                  <li key={item.id} className="flex gap-4 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {item.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <span className="text-sm font-medium text-slate-900">{item.title}</span>
                        <Badge>{productTypeLabel[item.type]}</Badge>
                      </div>
                      {item.variant_name && (
                        <p className="mt-0.5 text-xs text-slate-500">{item.variant_name}</p>
                      )}
                      {item.rental_start && item.rental_end && (
                        <p className="mt-1 text-xs text-slate-500">
                          Rental: {formatDate(item.rental_start)} → {formatDate(item.rental_end)}
                          {item.rental_units ? ` (${item.rental_units} unit(s))` : ""}
                        </p>
                      )}
                      {item.booking_start && (
                        <p className="mt-1 text-xs text-slate-500">
                          Booked for {formatDateTime(item.booking_start)}
                        </p>
                      )}
                      {toNumber(item.security_deposit) > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          Includes {formatPrice(item.security_deposit, order.currency)} refundable
                          deposit
                        </p>
                      )}
                      <p className="mt-2 text-sm text-slate-600">
                        {item.quantity} × {formatPrice(item.unit_price, order.currency)}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-slate-900">
                      {formatPrice(item.line_total, order.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 text-sm">
                {toNumber(subOrder.discount_total) > 0 && (
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-emerald-700">Discount applied here</span>
                    <span className="font-medium text-emerald-700">
                      − {formatPrice(subOrder.discount_total, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Vendor subtotal</span>
                  <span className="font-medium text-slate-900">
                    {formatPrice(subOrder.grand_total, order.currency)}
                  </span>
                </div>
              </div>

              {subOrder.cancellation_reason && (
                <div className="border-t border-slate-100 px-4 py-3 text-xs text-red-600">
                  Cancelled: {subOrder.cancellation_reason}
                </div>
              )}
              {subOrder.vendor_note && (
                <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                  Vendor note: {subOrder.vendor_note}
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="font-medium text-slate-900">
                  {formatPrice(order.subtotal, order.currency)}
                </dd>
              </div>
              {toNumber(order.discount_total) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-emerald-700">
                    Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </dt>
                  <dd className="font-medium text-emerald-700">
                    − {formatPrice(order.discount_total, order.currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-600">Shipping</dt>
                <dd className="font-medium text-slate-900">
                  {formatPrice(order.shipping_total, order.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Tax</dt>
                <dd className="font-medium text-slate-900">
                  {formatPrice(order.tax_total, order.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2.5 text-base">
                <dt className="font-semibold text-slate-900">Total</dt>
                <dd className="font-semibold text-slate-900">
                  {formatPrice(order.grand_total, order.currency)}
                </dd>
              </div>
            </dl>

            {canPay && (
              <Button size="lg" className="mt-5 w-full" onClick={startPayment} loading={paying}>
                Pay {formatPrice(order.grand_total, order.currency)}
              </Button>
            )}

            {order.payment?.status === "PAID" && (
              <div className="mt-5 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 ring-1 ring-emerald-200">
                Paid {order.payment.method ? `by ${order.payment.method}` : ""} on{" "}
                {formatDate(order.payment.paid_at)}
              </div>
            )}

            {canCancel && (
              <>
                {showCancel ? (
                  <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-3">
                    <Textarea
                      value={cancelReason}
                      maxLength={500}
                      onChange={(event) => setCancelReason(event.target.value)}
                      placeholder="Why are you cancelling? (optional)"
                      className="min-h-16"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={cancelOrder}
                        loading={cancelling}
                      >
                        Confirm cancel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowCancel(false)}>
                        Keep order
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-red-600 hover:bg-red-50"
                    onClick={() => setShowCancel(true)}
                  >
                    Cancel order
                  </Button>
                )}
              </>
            )}
          </Card>

          {order.shipping_address && (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">Delivery address</h2>
              <div className="mt-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{order.shipping_address.full_name}</p>
                <p className="mt-1">
                  {[
                    order.shipping_address.address_line1,
                    order.shipping_address.address_line2,
                    order.shipping_address.city,
                    order.shipping_address.state,
                    order.shipping_address.postal_code,
                    order.shipping_address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1">{order.shipping_address.phone}</p>
              </div>
            </Card>
          )}

          {order.customer_note && (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">Your note</h2>
              <p className="mt-2 text-sm text-slate-600">{order.customer_note}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
