import Link from "next/link";
import type { StoreSummary } from "@/lib/types";
import { toNumber } from "@/lib/format";

export const StoreCard = ({ store }: { store: StoreSummary }) => (
  <Link
    href={`/stores/${store.slug}`}
    className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
  >
    <div className="relative h-24 bg-gradient-to-br from-slate-100 to-slate-200">
      {store.banner && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.banner} alt="" className="h-full w-full object-cover" loading="lazy" />
      )}
    </div>

    <div className="px-4 pb-4">
      {/* `relative` keeps the logo above the banner: the banner is positioned,
          and a positioned element paints over static content. */}
      <div className="relative -mt-6 mb-3 grid h-12 w-12 place-items-center overflow-hidden rounded-xl border-2 border-white bg-slate-200 text-sm font-semibold uppercase text-slate-600 shadow-sm">
        {store.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logo} alt={store.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          store.name.charAt(0)
        )}
      </div>

      <h3 className="truncate text-sm font-medium text-slate-900 group-hover:text-brand-700">
        {store.name}
      </h3>
      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
        {store.tagline || [store.city, store.country].filter(Boolean).join(", ") || "Independent vendor"}
      </p>

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span>{toNumber(store.total_products)} products</span>
        {toNumber(store.rating) > 0 && (
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
            </svg>
            {toNumber(store.rating).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  </Link>
);
