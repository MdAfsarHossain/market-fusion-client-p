import Link from "next/link";
import type { Meta } from "@/lib/types";
import { cn } from "@/components/ui";

// Server-rendered pagination: every page is a real, shareable URL
export const Pagination = ({
  meta,
  basePath,
  searchParams,
}: {
  meta: Meta;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) => {
  if (meta.totalPage <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();

    Object.entries(searchParams || {}).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });

    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  // Show a compact window around the current page
  const pages: number[] = [];
  const start = Math.max(1, meta.page - 2);
  const end = Math.min(meta.totalPage, start + 4);

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors";

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {meta.hasPrevPage ? (
        <Link href={hrefFor(meta.page - 1)} className={cn(linkClass, "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>
          Previous
        </Link>
      ) : (
        <span className={cn(linkClass, "border-slate-200 bg-slate-50 text-slate-400")}>Previous</span>
      )}

      {pages.map((page) =>
        page === meta.page ? (
          <span
            key={page}
            aria-current="page"
            className={cn(linkClass, "border-brand-600 bg-brand-600 text-white")}
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={hrefFor(page)}
            className={cn(linkClass, "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}
          >
            {page}
          </Link>
        ),
      )}

      {meta.hasNextPage ? (
        <Link href={hrefFor(meta.page + 1)} className={cn(linkClass, "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>
          Next
        </Link>
      ) : (
        <span className={cn(linkClass, "border-slate-200 bg-slate-50 text-slate-400")}>Next</span>
      )}
    </nav>
  );
};
