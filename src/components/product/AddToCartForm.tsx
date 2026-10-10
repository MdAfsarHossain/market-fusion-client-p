"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Product, RentalAvailability, ServiceSlots } from "@/lib/types";
import { formatPrice, toDateInput, toNumber } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { Alert, Button, Field, Input, Select, Spinner, cn } from "@/components/ui";

// Units billed between two dates, mirroring the server's rental maths so the
// buyer sees the same number before they commit.
const rentalUnitsBetween = (unit: string, start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const ms = endDate.getTime() - startDate.getTime();

  if (!Number.isFinite(ms) || ms <= 0) return 0;

  const hours = ms / 3_600_000;
  const days = hours / 24;

  switch (unit) {
    case "HOUR":
      return Math.ceil(hours);
    case "WEEK":
      return Math.ceil(days / 7);
    case "MONTH":
      return Math.ceil(days / 30);
    default:
      return Math.ceil(days);
  }
};

export const AddToCartForm = ({ product }: { product: Product }) => {
  const router = useRouter();
  const { user, ready } = useAuth();
  const { refresh } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(
    product.variants?.find((variant) => variant.is_active)?.id ?? "",
  );
  // A service is booked by choosing an offered slot, not by typing a time: the
  // vendor's opening hours, buffer and existing diary decide what is offered.
  const [bookingDate, setBookingDate] = useState(
    toDateInput(new Date(Date.now() + 2 * 86_400_000)),
  );
  const [bookingStart, setBookingStart] = useState("");
  const [slots, setSlots] = useState<ServiceSlots | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Rental availability is a per-window question, so it is asked of the server
  const [availability, setAvailability] = useState<RentalAvailability | null>(null);
  const [checkingWindow, setCheckingWindow] = useState(false);
  const [rentalStart, setRentalStart] = useState(
    toDateInput(new Date(Date.now() + 86_400_000)),
  );
  const [rentalEnd, setRentalEnd] = useState(
    toDateInput(new Date(Date.now() + 4 * 86_400_000)),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeVariants = product.variants?.filter((variant) => variant.is_active) ?? [];
  const selectedVariant = activeVariants.find((variant) => variant.id === variantId);

  const availableStock =
    product.type === "PHYSICAL"
      ? (selectedVariant ? selectedVariant.stock : (product.stock ?? 0))
      : Infinity;

  const isSingleUnit = product.type === "DIGITAL" || product.type === "SERVICE";
  const outOfStock = product.type === "PHYSICAL" && availableStock <= 0;

  // Ask the server which slots are genuinely free on the chosen day
  const loadSlots = useCallback(async () => {
    if (product.type !== "SERVICE") return;

    setLoadingSlots(true);
    setBookingStart("");

    try {
      const res = await api.get<ServiceSlots>(`/service/slots/${product.id}`, {
        query: { date: bookingDate },
      });
      setSlots(res.data);
      const firstFree = res.data.slots.find((slot) => slot.available);
      if (firstFree) setBookingStart(firstFree.start);
    } catch {
      setSlots(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [product.type, product.id, bookingDate]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  // Availability depends on the window, not a flat count, so re-check on change
  const checkWindow = useCallback(async () => {
    if (product.type !== "RENTAL" || !rentalStart || !rentalEnd) return;
    if (new Date(rentalEnd) <= new Date(rentalStart)) return;

    setCheckingWindow(true);

    try {
      const res = await api.get<RentalAvailability>(
        `/rental/availability/${product.id}`,
        {
          query: {
            start: new Date(rentalStart).toISOString(),
            end: new Date(rentalEnd).toISOString(),
          },
        },
      );
      setAvailability(res.data);
    } catch {
      setAvailability(null);
    } finally {
      setCheckingWindow(false);
    }
  }, [product.type, product.id, rentalStart, rentalEnd]);

  useEffect(() => {
    void checkWindow();
  }, [checkWindow]);

  const rentalUnits = useMemo(() => {
    if (product.type !== "RENTAL" || !product.rental) return 0;
    return rentalUnitsBetween(product.rental.rental_unit, rentalStart, rentalEnd);
  }, [product.type, product.rental, rentalStart, rentalEnd]);

  const lineTotal = useMemo(() => {
    if (product.type === "RENTAL" && product.rental) {
      const rent = toNumber(product.rental.price_per_unit) * rentalUnits;
      const deposit = toNumber(product.rental.security_deposit);
      return (rent + deposit) * quantity;
    }

    const unit = selectedVariant
      ? toNumber(selectedVariant.price)
      : toNumber(product.base_price);

    return unit * (isSingleUnit ? 1 : quantity);
  }, [product, rentalUnits, quantity, selectedVariant, isSingleUnit]);

  // Client-side guard rails; the server re-validates all of this anyway
  const validationError = useMemo(() => {
    if (product.has_variants && activeVariants.length > 0 && !variantId) {
      return "Please choose an option.";
    }

    if (product.type === "RENTAL" && product.rental) {
      if (rentalUnits <= 0) return "The end date must be after the start date.";
      if (rentalUnits < product.rental.min_units) {
        return `Minimum rental is ${product.rental.min_units} ${product.rental.rental_unit.toLowerCase()}(s).`;
      }
      if (product.rental.max_units && rentalUnits > product.rental.max_units) {
        return `Maximum rental is ${product.rental.max_units} ${product.rental.rental_unit.toLowerCase()}(s).`;
      }
      if (quantity > product.rental.available_quantity) {
        return `Only ${product.rental.available_quantity} unit(s) available.`;
      }
    }

    if (product.type === "SERVICE") {
      if (!bookingStart) {
        return slots && slots.slots.length === 0
          ? slots.has_opening_hours
            ? "The vendor is closed that day. Try another date."
            : "This service has no opening hours set yet."
          : "Please pick a time slot.";
      }

      if (new Date(bookingStart).getTime() <= Date.now()) {
        return "Please pick a booking time in the future.";
      }
    }

    if (product.type === "RENTAL" && availability) {
      if (availability.available <= 0) {
        return "This is already booked out for those dates.";
      }

      if (quantity > availability.available) {
        return `Only ${availability.available} unit(s) free for those dates.`;
      }
    }

    if (product.type === "PHYSICAL" && quantity > availableStock) {
      return `Only ${availableStock} item(s) left in stock.`;
    }

    return null;
  }, [
    product,
    activeVariants.length,
    variantId,
    rentalUnits,
    quantity,
    bookingStart,
    slots,
    availability,
    availableStock,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/cart/add", {
        product_id: product.id,
        ...(variantId ? { variant_id: variantId } : {}),
        ...(isSingleUnit ? {} : { quantity }),
        ...(product.type === "SERVICE"
          ? { booking_start: new Date(bookingStart).toISOString() }
          : {}),
        ...(product.type === "RENTAL"
          ? {
              rental_start: new Date(rentalStart).toISOString(),
              rental_end: new Date(rentalEnd).toISOString(),
            }
          : {}),
      });

      await refresh();
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not add this item to your cart.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      {activeVariants.length > 0 && (
        <Field label="Option" required>
          <Select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            <option value="">Choose an option</option>
            {activeVariants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
                {variant.name} — {formatPrice(variant.price, product.currency)}
                {variant.stock <= 0 ? " (out of stock)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {product.type === "SERVICE" && (
        <>
          <Field label="Day" required>
            <Input
              type="date"
              value={bookingDate}
              min={toDateInput(new Date())}
              onChange={(event) => setBookingDate(event.target.value)}
            />
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Time <span className="text-red-500">*</span>
            </p>

            {loadingSlots ? (
              <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                <Spinner className="h-4 w-4 text-brand-600" />
                Checking availability…
              </div>
            ) : !slots || slots.slots.length === 0 ? (
              <p className="py-2 text-sm text-slate-500">
                {slots && !slots.has_opening_hours
                  ? "This vendor has not published any opening hours yet."
                  : "Closed that day. Try another date."}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {slots.slots.map((slot) => {
                    const chosen = slot.start === bookingStart;

                    return (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setBookingStart(slot.start)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset transition-colors",
                          !slot.available
                            ? "cursor-not-allowed bg-slate-50 text-slate-300 ring-slate-200 line-through"
                            : chosen
                              ? "bg-brand-600 text-white ring-brand-600"
                              : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
                        )}
                        aria-pressed={chosen}
                      >
                        {new Date(slot.start).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  {slots.duration_minutes} minute appointment
                  {slots.daily_cap_reached && " · fully booked for the day"}
                </p>
              </>
            )}
          </div>
        </>
      )}

      {product.type === "RENTAL" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" required>
              <Input
                type="date"
                value={rentalStart}
                min={toDateInput(new Date())}
                onChange={(event) => setRentalStart(event.target.value)}
              />
            </Field>
            <Field label="Until" required>
              <Input
                type="date"
                value={rentalEnd}
                min={rentalStart}
                onChange={(event) => setRentalEnd(event.target.value)}
              />
            </Field>
          </div>
          {rentalUnits > 0 && product.rental && (
            <p className="text-xs text-slate-500">
              {rentalUnits} {product.rental.rental_unit.toLowerCase()}(s) ×{" "}
              {formatPrice(product.rental.price_per_unit, product.currency)}
            </p>
          )}

          {/* Availability is per window, so say plainly what is free for these dates */}
          {checkingWindow ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Spinner className="h-3.5 w-3.5 text-brand-600" />
              Checking those dates…
            </p>
          ) : availability ? (
            <p
              className={cn(
                "rounded-lg px-3 py-2 text-xs ring-1 ring-inset",
                availability.available <= 0
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-200",
              )}
            >
              {availability.available <= 0
                ? "Already booked out for those dates."
                : `${availability.available} of ${availability.total_quantity} free for those dates.`}
            </p>
          ) : null}
        </>
      )}

      {!isSingleUnit && (
        <Field label="Quantity">
          <div className="flex w-36 items-center rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="h-10 w-10 text-lg text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => value + 1)}
              className="h-10 w-10 text-lg text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
              disabled={quantity >= availableStock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </Field>
      )}

      {isSingleUnit && (
        <p className="text-xs text-slate-500">
          {product.type === "DIGITAL"
            ? "Digital products are sold as a single licence."
            : "One booking per checkout."}
        </p>
      )}

      <div className="flex items-baseline justify-between border-t border-slate-100 pt-4">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-xl font-semibold text-slate-900">
          {formatPrice(lineTotal, product.currency)}
        </span>
      </div>

      {error && <Alert>{error}</Alert>}
      {success && (
        <Alert tone="success">
          Added to your cart.{" "}
          <a href="/cart" className="font-medium underline">
            View cart
          </a>
        </Alert>
      )}

      <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={outOfStock || !ready}>
        {outOfStock ? "Out of stock" : user ? "Add to cart" : "Log in to buy"}
      </Button>
    </form>
  );
};
