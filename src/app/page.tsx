import Link from "next/link";
import { apiRequest } from "@/lib/api";
import type { Category, ProductSummary, StoreSummary } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink, EmptyState } from "@/components/ui";
import { StoreCard } from "@/components/layout/StoreCard";

const productTypes = [
  {
    type: "PHYSICAL",
    title: "Physical products",
    description: "Shipped to your door",
    className: "from-slate-800 to-slate-900",
  },
  {
    type: "DIGITAL",
    title: "Digital downloads",
    description: "Instant access after payment",
    className: "from-violet-600 to-violet-800",
  },
  {
    type: "SERVICE",
    title: "Services",
    description: "Book a professional",
    className: "from-teal-600 to-teal-800",
  },
  {
    type: "RENTAL",
    title: "Rentals",
    description: "Borrow it for as long as you need",
    className: "from-amber-500 to-amber-700",
  },
];

// Server rendered per request. Deliberately not statically prerendered: a build
// that runs while the API is down would otherwise bake an error page into the
// static output and serve it until the next revalidation.
const loadHomeData = async () => {
  const [products, stores, categories] = await Promise.all([
    apiRequest<ProductSummary[]>("/product/all", {
      token: null,
      query: { limit: 8, sortBy: "newest" },
      cache: "no-store",
    }).catch(() => null),
    apiRequest<StoreSummary[]>("/store/all", {
      token: null,
      query: { limit: 4 },
      cache: "no-store",
    }).catch(() => null),
    apiRequest<Category[]>("/category/tree", {
      token: null,
      revalidate: 300,
    }).catch(() => null),
  ]);

  return {
    products: products?.data ?? [],
    stores: stores?.data ?? [],
    categories: categories?.data ?? [],
    offline: products === null,
  };
};

export default async function HomePage() {
  const { products, stores, categories, offline } = await loadHomeData();

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-16 text-center sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
            Hybrid marketplace
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Goods, downloads, services and rentals — from one marketplace
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            Independent vendors sell everything from gaming laptops to photography
            sessions. One cart, one checkout, however you buy.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/products" size="lg">
              Browse products
            </ButtonLink>
            <ButtonLink href="/vendor/store/new" variant="outline" size="lg">
              Start selling
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        {offline && (
          <div className="mb-10 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
            The marketplace API is unreachable right now. Start the backend on{" "}
            <code className="font-mono">localhost:5000</code> to load live data.
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Shop by type</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productTypes.map((item) => (
              <Link
                key={item.type}
                href={`/products?type=${item.type}`}
                className={`group rounded-xl bg-gradient-to-br ${item.className} p-5 text-white transition-transform hover:-translate-y-0.5`}
              >
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-white/75">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  Browse
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {categories.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 12).map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Latest products</h2>
            <Link href="/products" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No products yet"
                description="Once vendors publish their first products they will show up here."
                action={<ButtonLink href="/vendor/store/new">Open a store</ButtonLink>}
              />
            </div>
          )}
        </section>

        {stores.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Featured stores</h2>
              <Link href="/stores" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </Link>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
