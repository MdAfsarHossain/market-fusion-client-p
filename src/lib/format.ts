import type { OrderStatus, PaymentStatus, ProductType } from "./types";

// Postgres NUMERIC arrives as a string, so every price goes through here
export const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPrice = (
  value: string | number | null | undefined,
  currency = "USD",
) => {
  const amount = toNumber(value);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const productTypeLabel: Record<ProductType, string> = {
  PHYSICAL: "Physical",
  DIGITAL: "Digital",
  SERVICE: "Service",
  RENTAL: "Rental",
};

// Tailwind classes per status, kept in one place so badges never drift
export const statusTone = (
  status: OrderStatus | PaymentStatus | string,
): string => {
  switch (status) {
    case "PAID":
    case "COMPLETED":
    case "DELIVERED":
    case "ACTIVE":
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "SHIPPED":
    case "PROCESSING":
    case "CONFIRMED":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "PENDING":
    case "DRAFT":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CANCELLED":
    case "FAILED":
    case "REJECTED":
    case "EXPIRED":
    case "SUSPENDED":
      return "bg-red-50 text-red-700 ring-red-200";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
    case "ARCHIVED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
};

export const humanize = (value?: string | null) => {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Date only value for <input type="date"> and <input type="datetime-local">
export const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

export const toDateTimeInput = (date: Date) => date.toISOString().slice(0, 16);
