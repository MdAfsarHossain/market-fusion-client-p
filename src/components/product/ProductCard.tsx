import Link from "next/link";
import type { ProductSummary } from "@/lib/types";
import { formatPrice, productTypeLabel, toNumber } from "@/lib/format";
import { Badge } from "@/components/ui";

const typeTone: Record<string, string> = {
  PHYSICAL: "bg-slate-900/85 text-white ring-slate-900/10",
  DIGITAL: "bg-violet-600/90 text-white ring-violet-600/10",
  SERVICE: "bg-teal-600/90 text-white ring-teal-600/10",
  RENTAL: "bg-amber-500/90 text-white ring-amber-500/10",
};

export const ProductCard = ({ product }: { product: ProductSummary }) => {
  const price = toNumber(product.base_price);
  const compareAt = toNumber(product.compare_at_price);
  const hasDiscount = compareAt > price;
  const isOutOfStock = product.type === "PHYSICAL" && product.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {product.thumbnail ? (
          // Vendor images come from many hosts, so a plain img keeps this robust
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" />
            </svg>
          </div>
        )}

        <div className="absolute left-2 top-2">
          <Badge className={typeTone[product.type]}>{productTypeLabel[product.type]}</Badge>
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.store && (
          <p className="mb-1 truncate text-xs font-medium text-slate-500">
            {product.store.name}
          </p>
        )}

        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 group-hover:text-brand-700">
          {product.title}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-base font-semibold text-slate-900">
              {formatPrice(price, product.currency)}
              {product.type === "RENTAL" && (
                <span className="ml-1 text-xs font-normal text-slate-500">/ unit</span>
              )}
            </p>
            {hasDiscount && (
              <p className="text-xs text-slate-400 line-through">
                {formatPrice(compareAt, product.currency)}
              </p>
            )}
          </div>

          {toNumber(product.rating) > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
              </svg>
              {toNumber(product.rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="aspect-[4/3] animate-pulse bg-slate-200" />
    <div className="space-y-2 p-4">
      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
    </div>
  </div>
);
