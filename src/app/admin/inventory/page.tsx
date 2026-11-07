"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Meta } from "@/lib/types";
import { RequireAuth } from "@/components/layout/RequireAuth";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  cn,
} from "@/components/ui";

type LowStockProduct = {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  stock: number;
  low_stock_threshold: number;
  store: { id: string; name: string; slug: string };
};

export default function AdminLowStockPage() {
  return (
    <RequireAuth guard="admin">
      <AdminLowStockView />
    </RequireAuth>
  );
}

const AdminLowStockView = () => {
  const [items, setItems] = useState<LowStockProduct[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(null);

    try {
      const res = await api.get<LowStockProduct[]>("/inventory/admin/low-stock", {
        query: { page, limit: 20 },
      });
      setItems(res.data);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load low stock.");
      setItems([]);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Low stock"
        description="Published physical products at or below their vendor's alert threshold."
      />

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {items === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing is running low"
          description="Every published product is above its low stock threshold."
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Store</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Threshold</th>
                    <th className="px-4 py-3 font-medium">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {item.thumbnail && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.thumbnail}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-medium text-slate-900 hover:text-brand-600"
                          >
                            {item.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/stores/${item.store.slug}`}
                          className="text-slate-600 hover:text-brand-600"
                        >
                          {item.store.name}
                        </Link>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-lg font-semibold",
                          item.stock <= 0 ? "text-red-600" : "text-amber-600",
                        )}
                      >
                        {item.stock}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.low_stock_threshold}
                      </td>
                      <td className="px-4 py-3">
                        {item.stock <= 0 ? (
                          <Badge className="bg-red-50 text-red-700 ring-red-200">
                            Out of stock
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
                            Low
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {meta && meta.totalPage > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {meta.page} of {meta.totalPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};
