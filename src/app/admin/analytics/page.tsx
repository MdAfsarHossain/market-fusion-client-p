"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  AdminAnalyticsOverview,
  RevenuePoint,
  SalesByType,
  TopStore,
} from "@/lib/types";
import { formatPrice, productTypeLabel, toNumber } from "@/lib/format";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Alert, Card, PageHeader, Select, Spinner } from "@/components/ui";
import { BarChart, ChartCard, LineChart, StatTile } from "@/components/charts";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

export default function AdminAnalyticsPage() {
  return (
    <RequireAuth guard="admin">
      <AdminAnalyticsView />
    </RequireAuth>
  );
}

const AdminAnalyticsView = () => {
  const [days, setDays] = useState("30");
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [series, setSeries] = useState<RevenuePoint[] | null>(null);
  const [byType, setByType] = useState<SalesByType[] | null>(null);
  const [stores, setStores] = useState<TopStore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOverview(null);
    setError(null);

    try {
      const [o, s, t, st] = await Promise.all([
        api.get<AdminAnalyticsOverview>("/analytics/admin/overview", {
          query: { days },
        }),
        api.get<{ series: RevenuePoint[] }>("/analytics/admin/revenue", {
          query: { days },
        }),
        api.get<{ types: SalesByType[] }>("/analytics/admin/sales-by-type", {
          query: { days },
        }),
        api.get<{ stores: TopStore[] }>("/analytics/admin/top-stores", {
          query: { days, limit: 8 },
        }),
      ]);

      setOverview(o.data);
      setSeries(s.data.series);
      setByType(t.data.types);
      setStores(st.data.stores);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load analytics.");
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Marketplace-wide figures, counting paid orders only."
        action={
          <Select
            className="w-44"
            value={days}
            onChange={(event) => setDays(event.target.value)}
            aria-label="Date range"
          >
            {RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </Select>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {!overview ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Platform commission"
              value={formatPrice(overview.totals.commission)}
              hint="what the marketplace keeps"
              emphasis
            />
            <StatTile
              label="Gross merchandise value"
              value={formatPrice(overview.totals.gmv)}
              hint={`${overview.totals.orders} paid order(s)`}
            />
            <StatTile
              label="Paid out to vendors"
              value={formatPrice(overview.totals.vendor_earnings)}
              hint={`across ${overview.totals.selling_stores} store(s)`}
            />
            <StatTile
              label="Average order"
              value={formatPrice(overview.totals.average_order_value)}
              hint={`${overview.totals.buyers} buyer(s)`}
            />
          </div>

          {series && series.length > 0 && (
            <ChartCard
              title="GMV and commission over time"
              description="Both in the same currency, so they share one axis."
            >
              <LineChart
                labels={series.map((point) => point.date)}
                series={[
                  {
                    key: "gmv",
                    label: "GMV",
                    values: series.map((point) => point.gmv ?? 0),
                  },
                  {
                    key: "commission",
                    label: "Commission",
                    values: series.map((point) => point.commission ?? 0),
                  },
                ]}
                formatValue={(value) => formatPrice(value)}
              />
            </ChartCard>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Revenue by product type"
              description="How the hybrid catalogue actually splits."
            >
              <BarChart
                rows={(byType ?? []).map((row) => ({
                  label: productTypeLabel[row.type] ?? row.type,
                  value: row.revenue,
                  sublabel: `${row.units} unit(s) across ${row.line_items} line(s)`,
                }))}
                formatValue={(value) => formatPrice(value)}
              />
            </ChartCard>

            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">
                Platform snapshot
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Current totals, not limited to the date range.
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-4">
                <Snapshot
                  label="Active stores"
                  value={`${overview.platform.stores_active} of ${overview.platform.stores_total}`}
                />
                <Snapshot
                  label="Stores awaiting review"
                  value={String(overview.platform.stores_pending)}
                  warn={overview.platform.stores_pending > 0}
                  href="/admin/stores"
                />
                <Snapshot
                  label="Published products"
                  value={String(overview.platform.products_published)}
                />
                <Snapshot
                  label="Products awaiting review"
                  value={String(overview.platform.products_pending)}
                  warn={overview.platform.products_pending > 0}
                  href="/admin/products"
                />
                <Snapshot
                  label="Registered users"
                  value={String(overview.platform.users_total)}
                />
                <Snapshot
                  label="Published reviews"
                  value={String(overview.platform.reviews_published)}
                />
                <Snapshot
                  label="Payouts awaiting action"
                  value={formatPrice(overview.platform.withdrawals_pending)}
                  warn={overview.platform.withdrawals_pending > 0}
                  href="/admin/withdrawals"
                />
                <Snapshot
                  label="Discounts given"
                  value={formatPrice(overview.totals.discounts)}
                />
              </dl>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Top stores</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Ranked by gross takings in this period.
            </p>

            {!stores || stores.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No paid orders in this period yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Store</th>
                      <th className="py-2 pr-3 font-medium">Rating</th>
                      <th className="py-2 pr-3 font-medium">Orders</th>
                      <th className="py-2 pr-3 font-medium">Gross</th>
                      <th className="py-2 font-medium">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stores.map((store) => (
                      <tr key={store.id}>
                        <td className="py-2 pr-3">
                          <Link
                            href={`/stores/${store.slug}`}
                            className="font-medium text-slate-900 hover:text-brand-600"
                          >
                            {store.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          {toNumber(store.rating) > 0
                            ? toNumber(store.rating).toFixed(1)
                            : "—"}
                        </td>
                        <td
                          className="py-2 pr-3 text-slate-600"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {store.orders}
                        </td>
                        <td
                          className="py-2 pr-3 text-slate-600"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatPrice(store.gross)}
                        </td>
                        <td
                          className="py-2 font-medium text-slate-900"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatPrice(store.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

const Snapshot = ({
  label,
  value,
  warn,
  href,
}: {
  label: string;
  value: string;
  warn?: boolean;
  href?: string;
}) => (
  <div>
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-0.5 font-medium">
      {href && warn ? (
        <Link href={href} className="text-amber-700 underline hover:text-amber-800">
          {value}
        </Link>
      ) : (
        <span className={warn ? "text-amber-700" : "text-slate-900"}>{value}</span>
      )}
    </dd>
  </div>
);
