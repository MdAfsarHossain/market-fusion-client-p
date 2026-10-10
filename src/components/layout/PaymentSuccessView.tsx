"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatPrice, humanize } from "@/lib/format";
import { useCart } from "@/providers/CartProvider";
import { Alert, ButtonLink, Card, Spinner } from "@/components/ui";

type VerifiedPayment = {
  id: string;
  status: string;
  amount: string | number;
  currency: string;
  method?: string | null;
  order_id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
};

export const PaymentSuccessView = ({
  sessionId,
}: {
  sessionId?: string;
}) => {
  const { refresh } = useCart();

  const [payment, setPayment] = useState<VerifiedPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Verify on arrival rather than waiting for the webhook, so the buyer sees
  // a confirmed state immediately.
  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setError("No payment session was provided.");
        setChecking(false);
        return;
      }

      try {
        const res = await api.get<VerifiedPayment>(`/payment/verify/${sessionId}`);
        setPayment(res.data);
        await refresh();
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Could not verify your payment.",
        );
      } finally {
        setChecking(false);
      }
    };

    void verify();
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const isPaid = payment?.payment_status === "PAID";

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8 text-center">
        {checking ? (
          <>
            <Spinner className="mx-auto h-8 w-8 text-brand-600" />
            <h1 className="mt-5 text-xl font-semibold text-slate-900">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-sm text-slate-500">This only takes a moment.</p>
          </>
        ) : isPaid ? (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-semibold text-slate-900">Payment received</h1>
            <p className="mt-2 text-sm text-slate-600">
              Thank you. Order{" "}
              <span className="font-mono font-medium">{payment.order_number}</span> is confirmed and
              the vendors have been notified.
            </p>

            <dl className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Amount paid</dt>
                <dd className="font-medium text-slate-900">
                  {formatPrice(payment.amount, payment.currency)}
                </dd>
              </div>
              {payment.method && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Method</dt>
                  <dd className="font-medium text-slate-900">{humanize(payment.method)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-600">Order status</dt>
                <dd className="font-medium text-slate-900">{humanize(payment.order_status)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-2">
              <ButtonLink href={`/orders/${payment.order_id}`} size="lg">
                View order
              </ButtonLink>
              <ButtonLink href="/products" variant="ghost">
                Continue shopping
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-semibold text-slate-900">
              Payment not confirmed yet
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {error ||
                "We could not confirm the payment yet. If you completed it, the status will update shortly."}
            </p>

            {payment && (
              <div className="mt-4">
                <Alert tone="info">
                  Current status: {humanize(payment.payment_status)}
                </Alert>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <ButtonLink href={payment ? `/orders/${payment.order_id}` : "/orders"} size="lg">
                Go to my orders
              </ButtonLink>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
