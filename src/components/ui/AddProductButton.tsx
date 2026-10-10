import Link from "next/link";
import { cn } from "@/components/ui";

// The vendor's primary call to action: a gradient pill with a plus badge that
// turns on hover, a soft brand-coloured glow and a small lift.
export const AddProductButton = ({
  href = "/vendor/products/new",
  label = "Add product",
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) => (
  <Link
    href={href}
    className={cn(
      "group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full",
      "bg-gradient-to-r from-brand-600 to-brand-500 pl-2 pr-5 text-sm font-semibold text-white",
      "shadow-md shadow-brand-600/25 ring-1 ring-inset ring-white/10",
      "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-600/35",
      "active:translate-y-0 active:shadow-md",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
      className,
    )}
  >
    {/* Light sweep across the button on hover */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
    />

    <span className="relative grid h-6 w-6 place-items-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-90">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M8 3v10M3 8h10" />
      </svg>
    </span>

    <span className="relative">{label}</span>
  </Link>
);
