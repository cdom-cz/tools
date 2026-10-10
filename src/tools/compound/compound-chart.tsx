"use client";

import { useState } from "react";
import type { YearRow } from "@/lib/compound-interest";

const W = 640;
const H = 280;
const PAD = { top: 12, right: 12, bottom: 28, left: 52 };

/** Rounds the axis maximum up to a "nice" value (1, 2, 5 × 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}

/** Stacked bars per year: deposits (bottom) + interest (top). Tap/hover a bar to see the values. */
export function CompoundChart({
  rows,
  locale,
  labels,
}: {
  rows: YearRow[];
  locale: string;
  labels: { aria: string; contributed: string; interest: string; year: string; balance: string; currency: string };
}) {
  const [active, setActive] = useState<number | null>(null);
  const data = rows.slice(1);
  const max = niceMax(Math.max(...data.map((r) => r.balance)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.max(1, slot * 0.72);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / 10);
  const sel = active === null ? null : data[active];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        role="img"
        aria-label={labels.aria}
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {compact.format(t)}
            </text>
          </g>
        ))}
        {data.map((r, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          return (
            <g
              key={r.year}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(active === i ? null : i)}
              className="cursor-pointer"
              opacity={active === null || active === i ? 1 : 0.55}
            >
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={y(r.contributed)}
                width={barW}
                height={Math.max(0, y(0) - y(r.contributed))}
                className="fill-muted-foreground/40"
              />
              <rect
                x={x}
                y={y(r.balance)}
                width={barW}
                height={Math.max(0, y(r.contributed) - y(r.balance))}
                className="fill-primary"
              />
              {(r.year % labelEvery === 0 || r.year === 1) && (
                <text x={x + barW / 2} y={H - 10} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {r.year}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-muted-foreground/40" aria-hidden />
            {labels.contributed}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" aria-hidden />
            {labels.interest}
          </span>
        </div>
        <div className="min-h-5 tabular-nums text-foreground" aria-live="polite">
          {sel &&
            `${labels.year} ${sel.year}: ${full.format(sel.balance)} ${labels.currency} (${full.format(sel.contributed)} + ${full.format(sel.interest)})`}
        </div>
      </div>
    </div>
  );
}
