"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { CouponPreview } from "@/lib/types";
import { formatPrice, toNumber } from "@/lib/format";
import { Alert, Button, Input } from "@/components/ui";

// Prices the code against the live cart before checkout, so the buyer sees the
// exact discount the server will apply rather than a guess.
export const CouponField = ({
  currency,
  applied,
  onApply,
  onRemove,
}: {
  currency: string;
  applied: CouponPreview | null;
  onApply: (preview: CouponPreview) => void;
  onRemove: () => void;
}) => {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = code.trim();
    if (!trimmed) return;

    setChecking(true);

    try {
      const res = await api.post<CouponPreview>("/coupon/preview", {
        code: trimmed,
      });
      onApply(res.data);
      setCode("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not apply that coupon.",
      );
    } finally {
      setChecking(false);
    }
  };

  if (applied) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-600 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                {applied.code}
              </span>
              <span className="text-xs font-medium text-emerald-700">Applied</span>
            </div>
            <p className="mt-1 truncate text-xs text-emerald-800">{applied.name}</p>
            {applied.scope === "STORE" && (
              <p className="mt-0.5 text-xs text-emerald-700">
                Applies to {formatPrice(applied.eligible_subtotal, currency)} of your cart
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-emerald-700">
              − {formatPrice(applied.discount_amount, currency)}
            </p>
            <button
              onClick={onRemove}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={apply}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Coupon code
      </label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter a code"
          className="font-mono uppercase"
          aria-label="Coupon code"
        />
        <Button type="submit" variant="outline" loading={checking} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}
    </form>
  );
};
