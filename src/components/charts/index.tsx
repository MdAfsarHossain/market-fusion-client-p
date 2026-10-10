"use client";

import { useMemo, useState } from "react";
import { cn } from "@/components/ui";

// ─── Palette ─────────────────────────────────────────────────────────────────
// Validated against the actual card surface (#ffffff): worst adjacent CVD
// ΔE 24.7, normal-vision ΔE 33.6, both slots clear the lightness band, the
// chroma floor and 3:1 contrast. Assigned in fixed order and never cycled.
export const SERIES = ["#2a78d6", "#eb6834"] as const;

// Chart chrome stays recessive so the data is the loudest thing on screen
const GRID = "#e1e0d9";
const BASELINE = "#c3c2b7";
const MUTED = "#898781";

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short" });

const compact = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(0);
};

// ─── Stat tile ───────────────────────────────────────────────────────────────
// A single headline number is a tile, not a one-bar chart.
export const StatTile = ({
  label,
  value,
  delta,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  emphasis?: boolean;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p
      className={cn(
        "mt-1.5 font-semibold text-slate-900",
        emphasis ? "text-3xl" : "text-2xl",
      )}
    >
      {value}
    </p>

    <div className="mt-1 flex items-center gap-2">
      {delta !== undefined && (
        // Direction is carried by an arrow and a sign, never by colour alone
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            delta > 0
              ? "text-[#006300]"
              : delta < 0
                ? "text-[#d03b3b]"
                : "text-slate-500",
          )}
        >
          <span aria-hidden="true">{delta > 0 ? "↑" : delta < 0 ? "↓" : "→"}</span>
          {delta > 0 ? "+" : ""}
          {delta}%
          <span className="sr-only">
            {delta > 0 ? "up" : delta < 0 ? "down" : "no change"} versus the previous
            period
          </span>
        </span>
      )}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  </div>
);

// ─── Line chart ──────────────────────────────────────────────────────────────
type LineSeries = { key: string; label: string; values: number[] };

// Trend over time. Ships a crosshair and tooltip by default, because an SVG
// chart in a browser is interactive whether or not you plan for it.
export const LineChart = ({
  labels,
  series,
  formatValue,
  height = 220,
}: {
  labels: string[];
  series: LineSeries[];
  formatValue: (value: number) => string;
  height?: number;
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const width = 720;
  const padding = { top: 12, right: 16, bottom: 26, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const max = useMemo(() => {
    const highest = Math.max(
      1,
      ...series.flatMap((line) => line.values.map((value) => value || 0)),
    );
    // Round the ceiling up so the top gridline is a readable number
    const magnitude = Math.pow(10, Math.floor(Math.log10(highest)));
    return Math.ceil(highest / magnitude) * magnitude;
  }, [series]);

  const xAt = (index: number) =>
    padding.left +
    (labels.length <= 1 ? plotWidth / 2 : (index / (labels.length - 1)) * plotWidth);

  const yAt = (value: number) =>
    padding.top + plotHeight - ((value || 0) / max) * plotHeight;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => max * fraction);

  // Only a few x labels, otherwise they collide
  const labelStep = Math.max(1, Math.ceil(labels.length / 7));

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={`Line chart of ${series.map((s) => s.label).join(" and ")} over time`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const relative =
              ((event.clientX - box.left) / box.width) * width - padding.left;
            const index = Math.round((relative / plotWidth) * (labels.length - 1));
            setHover(Math.min(labels.length - 1, Math.max(0, index)));
          }}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke={tick === 0 ? BASELINE : GRID}
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={yAt(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill={MUTED}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {compact(tick)}
              </text>
            </g>
          ))}

          {labels.map((label, index) =>
            index % labelStep === 0 || index === labels.length - 1 ? (
              <text
                key={label + index}
                x={xAt(index)}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill={MUTED}
              >
                {shortDate(label)}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <line
              x1={xAt(hover)}
              x2={xAt(hover)}
              y1={padding.top}
              y2={padding.top + plotHeight}
              stroke={BASELINE}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {series.map((line, seriesIndex) => {
            const colour = SERIES[seriesIndex % SERIES.length];
            const path = line.values
              .map(
                (value, index) =>
                  `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(value)}`,
              )
              .join(" ");

            return (
              <g key={line.key}>
                <path
                  d={path}
                  fill="none"
                  stroke={colour}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* A single point would otherwise draw nothing */}
                {labels.length === 1 && (
                  <circle cx={xAt(0)} cy={yAt(line.values[0])} r="4" fill={colour} />
                )}
                {hover !== null && (
                  // 2px surface ring keeps overlapping markers separable
                  <circle
                    cx={xAt(hover)}
                    cy={yAt(line.values[hover])}
                    r="5"
                    fill={colour}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
            style={{
              left: `${(xAt(hover) / width) * 100}%`,
              transform:
                hover > labels.length / 2 ? "translateX(-105%)" : "translateX(5%)",
            }}
          >
            <p className="font-medium text-slate-900">{shortDate(labels[hover])}</p>
            {series.map((line, seriesIndex) => (
              <p key={line.key} className="mt-1 flex items-center gap-1.5 text-slate-600">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: SERIES[seriesIndex % SERIES.length] }}
                  aria-hidden="true"
                />
                {line.label}:{" "}
                <span className="font-medium text-slate-900">
                  {formatValue(line.values[hover])}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Identity is never colour alone: a legend for two or more series */}
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-4">
          {series.map((line, seriesIndex) => (
            <span
              key={line.key}
              className="flex items-center gap-1.5 text-xs text-slate-600"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: SERIES[seriesIndex % SERIES.length] }}
                aria-hidden="true"
              />
              {line.label}
            </span>
          ))}
        </div>
      )}

      <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)}>
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1 pr-3 font-medium">Date</th>
              {series.map((line) => (
                <th key={line.key} className="py-1 pr-3 font-medium">
                  {line.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {labels.map((label, index) => (
              <tr key={label + index}>
                <td className="py-1 pr-3 text-slate-600">{shortDate(label)}</td>
                {series.map((line) => (
                  <td
                    key={line.key}
                    className="py-1 pr-3 text-slate-900"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatValue(line.values[index])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </div>
  );
};

// ─── Bar chart ───────────────────────────────────────────────────────────────
// Comparing magnitude across a handful of named things, so one hue rather than
// categorical: the reader is ranking, not identifying.
export const BarChart = ({
  rows,
  formatValue,
}: {
  rows: { label: string; value: number; sublabel?: string }[];
  formatValue: (value: number) => string;
}) => {
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...rows.map((row) => row.value));

  if (rows.length === 0) {
    return <p className="py-6 text-sm text-slate-500">No data for this period.</p>;
  }

  return (
    <div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="group">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-slate-700">{row.label}</span>
              <span
                className="text-sm font-medium text-slate-900"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatValue(row.value)}
              </span>
            </div>

            <div
              className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
              title={`${row.label}: ${formatValue(row.value)}`}
            >
              {/* 4px rounded data-end, anchored to the baseline */}
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${Math.max(2, (row.value / max) * 100)}%`,
                  background: SERIES[0],
                }}
              />
            </div>

            {row.sublabel && (
              <p className="mt-0.5 text-xs text-slate-400">{row.sublabel}</p>
            )}
          </div>
        ))}
      </div>

      <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)}>
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="py-1 pr-3 text-slate-600">{row.label}</td>
                <td
                  className="py-1 text-slate-900"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatValue(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </div>
  );
};

// Every chart ships a table view, so the data is reachable without reading colour
const TableToggle = ({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="mt-3">
    <button
      onClick={onToggle}
      className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
      aria-expanded={open}
    >
      {open ? "Hide data table" : "Show data table"}
    </button>
    {open && (
      <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 p-3">
        {children}
      </div>
    )}
  </div>
);

// A shared shell so every panel on a dashboard reads the same
export const ChartCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    <div className="mt-4">{children}</div>
  </div>
);
