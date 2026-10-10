import { cn } from "@/components/ui";

// Read-only star display. Half stars are rounded to the nearest whole so the
// rating never looks more precise than it is.
export const Stars = ({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  const rounded = Math.round(rating);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(sizes[size], star <= rounded ? "text-amber-400" : "text-slate-300")}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
};

// Interactive picker used when writing a review
export const StarPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
        aria-pressed={value === star}
      >
        <svg
          className={cn("h-7 w-7", star <= value ? "text-amber-400" : "text-slate-300")}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      </button>
    ))}
    {value > 0 && (
      <span className="ml-2 text-sm text-slate-600">{value} of 5</span>
    )}
  </div>
);
