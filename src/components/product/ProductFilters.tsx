"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, ProductType } from "@/lib/types";
import { productTypeLabel } from "@/lib/format";
import { Button, Field, Input, Label, Select, cn } from "@/components/ui";

const types: ProductType[] = ["PHYSICAL", "DIGITAL", "SERVICE", "RENTAL"];

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "popular", label: "Best selling" },
  { value: "rating", label: "Top rated" },
];

export const ProductFilters = ({
  categories,
  current,
}: {
  categories: Category[];
  current: Record<string, string | undefined>;
}) => {
  const router = useRouter();
  const [search, setSearch] = useState(current.searchTerm || "");
  const [minPrice, setMinPrice] = useState(current.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(current.maxPrice || "");

  // Every filter change becomes a URL, so results stay linkable and cacheable.
  // The current params arrive as a prop from the server page, which keeps this
  // component out of the useSearchParams prerender bailout.
  const applyFilter = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();

    Object.entries(current).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page");
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  };

  const activeCount = ["type", "category", "minPrice", "maxPrice", "searchTerm"].filter(
    (key) => current[key],
  ).length;

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilter({ searchTerm: search.trim() || undefined });
        }}
      >
        <Field label="Search">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
          />
        </Field>
      </form>

      <div>
        <Label>Sort by</Label>
        <Select
          value={current.sortBy || "newest"}
          onChange={(event) => applyFilter({ sortBy: event.target.value })}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Type</Label>
        <div className="space-y-1">
          <FilterRow
            active={!current.type}
            onClick={() => applyFilter({ type: undefined })}
            label="All types"
          />
          {types.map((type) => (
            <FilterRow
              key={type}
              active={current.type === type}
              onClick={() => applyFilter({ type: current.type === type ? undefined : type })}
              label={productTypeLabel[type]}
            />
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <Label>Category</Label>
          <Select
            value={current.category || ""}
            onChange={(event) => applyFilter({ category: event.target.value || undefined })}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilter({
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
          });
        }}
      >
        <Label>Price range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
          />
          <span className="text-slate-400">–</span>
          <Input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="mt-2 w-full">
          Apply price
        </Button>
      </form>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setSearch("");
            setMinPrice("");
            setMaxPrice("");
            router.push("/products");
          }}
        >
          Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
        </Button>
      )}
    </aside>
  );
};

const FilterRow = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
      active
        ? "bg-brand-50 font-medium text-brand-700"
        : "text-slate-600 hover:bg-slate-100",
    )}
  >
    {label}
  </button>
);
