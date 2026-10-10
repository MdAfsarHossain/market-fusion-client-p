import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

// ─── Button ──────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) => (
  <button
    className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && <Spinner className="h-4 w-4" />}
    {children}
  </button>
);

export const ButtonLink = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) => (
  <Link
    className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    {...props}
  >
    {children}
  </Link>
);

// ─── Form fields ─────────────────────────────────────────────────────────────
export const Label = ({ className, children, ...props }: ComponentProps<"label">) => (
  <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)} {...props}>
    {children}
  </label>
);

const fieldBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50";

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input className={cn(fieldBase, className)} {...props} />
);

export const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea className={cn(fieldBase, "min-h-24 resize-y", className)} {...props} />
);

export const Select = ({ className, children, ...props }: ComponentProps<"select">) => (
  <select className={cn(fieldBase, "pr-8", className)} {...props}>
    {children}
  </select>
);

export const Field = ({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) => (
  <div>
    {/* The label wraps the control so the two are implicitly associated. This
        needs no generated ids, and it means assistive technology (and anything
        querying by label) resolves the field correctly. */}
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
    {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// ─── Feedback ────────────────────────────────────────────────────────────────
export const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin text-current", className || "h-5 w-5")}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-90"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export const Alert = ({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) => {
  const tones = {
    error: "bg-red-50 text-red-700 ring-red-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
  };

  return (
    <div className={cn("rounded-lg px-4 py-3 text-sm ring-1", tones[tone])} role="alert">
      {children}
    </div>
  );
};

export const Badge = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      className || "bg-slate-100 text-slate-700 ring-slate-200",
    )}
  >
    {children}
  </span>
);

// ─── Layout ──────────────────────────────────────────────────────────────────
export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("rounded-xl border border-slate-200 bg-white", className)}>{children}</div>
);

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
    <h3 className="text-base font-medium text-slate-900">{title}</h3>
    {description && (
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    )}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-slate-200", className)} />
);
