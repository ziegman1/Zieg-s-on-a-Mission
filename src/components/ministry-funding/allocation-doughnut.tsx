"use client";

import type { AllocationSlice } from "@/lib/ministry-funding/calculations";
import { formatUsd } from "@/lib/ministry-funding/calculations";

type SliceWithColor = AllocationSlice & { color: string };

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

/** Sum of displayed slice amounts — same totals used by the legend. */
export function chartInvestmentTotal(slices: AllocationSlice[]): number {
  return slices.reduce((sum, slice) => sum + slice.amount, 0);
}

export function AllocationDoughnut({
  slices,
  title,
  centerTotalLabel,
  centerSubtitle,
}: {
  slices: SliceWithColor[];
  title: string;
  /** Formatted total shown in the doughnut hole (derived from slices). */
  centerTotalLabel?: string | null;
  /** Reporting month (or similar) under the total. */
  centerSubtitle?: string | null;
}) {
  const positive = slices.filter((s) => s.amount > 0);
  if (positive.length === 0) return null;

  // ~18% larger than the prior 220px chart for desktop presence.
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outer = 113;
  const inner = 72;

  let angle = 0;
  const arcs = positive.map((slice) => {
    const sweep = (slice.percent / 100) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    // Full circle special-case: SVG arc of 360 collapses; use two semicircles.
    if (positive.length === 1 && slice.percent >= 99.9) {
      return {
        ...slice,
        d: [arcPath(cx, cy, outer, 0, 180), arcPath(cx, cy, outer, 180, 360)].join(" "),
        full: true,
      };
    }
    return {
      ...slice,
      d: arcPath(cx, cy, outer, start, end),
      full: false,
    };
  });

  const total = chartInvestmentTotal(slices);
  const totalLabel = centerTotalLabel ?? formatUsd(total);
  const ariaLabel = [
    title,
    `Total monthly ministry investment ${totalLabel}`,
    centerSubtitle?.trim() ? `Reporting period ${centerSubtitle.trim()}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel}
        >
          {positive.length === 1 ? (
            <>
              <circle cx={cx} cy={cy} r={outer} fill={positive[0]!.color} />
              <circle cx={cx} cy={cy} r={inner} fill="var(--brand-surface, #f7f5f1)" />
            </>
          ) : (
            arcs.map((arc) => (
              <path
                key={arc.id}
                d={`${arc.d} L ${cx} ${cy} Z`}
                fill={arc.color}
                stroke="var(--brand-surface, #f7f5f1)"
                strokeWidth={2}
              />
            ))
          )}
          {positive.length > 1 ? (
            <circle cx={cx} cy={cy} r={inner} fill="var(--brand-surface, #f7f5f1)" />
          ) : null}
        </svg>

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          aria-hidden
        >
          <p className="font-serif text-[1.65rem] leading-none text-brand-ink tracking-wide tabular-nums">
            {totalLabel}
          </p>
          {centerSubtitle?.trim() ? (
            <p className="mt-1.5 max-w-[7.5rem] text-[11px] leading-snug text-brand-ink/60">
              {centerSubtitle.trim()}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="w-full max-w-md space-y-2.5 text-left">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-start gap-3 text-sm text-brand-ink/90">
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="font-medium text-brand-ink">{slice.name}</span>
              <span className="mt-0.5 block text-brand-ink/70">
                {formatUsd(slice.amount)} · {slice.percent}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
