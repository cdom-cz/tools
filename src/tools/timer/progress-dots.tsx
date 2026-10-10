"use client";

import { fmt } from "@/i18n/format";
import { useToolMessages } from "@/i18n/provider";
import { PHASE_BG_CLASS, PHASE_BORDER_CLASS, type Phase } from "@/lib/interval-timer";

/**
 * Graphical overview of how many rounds/series are behind and ahead of us.
 * Visual language follows deep-work-blocks.tsx (h-6 w-6 rounded-full border-2),
 * but read-only — <span>, not <button>.
 */
export function ProgressDots({
  seriesTotal,
  seriesNumber,
  roundsTotal,
  roundNumber,
  phase,
}: {
  seriesTotal: number;
  seriesNumber: number;
  roundsTotal: number;
  roundNumber: number;
  phase: Phase;
}) {
  const m = useToolMessages("timer").dots;
  const fillClass = PHASE_BG_CLASS[phase];
  const borderClass = PHASE_BORDER_CLASS[phase];
  const compact = roundsTotal > 12;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium tabular-nums text-muted-foreground">
        {phase === "prepare" ? (
          m.getReady
        ) : (
          <>
            {fmt(m.progress, {
              series: seriesNumber,
              seriesTotal,
              round: roundNumber,
              roundsTotal,
            })}
          </>
        )}
      </p>

      {seriesTotal > 1 && (
        <div className="flex items-center gap-1.5" aria-label={fmt(m.seriesAria, { series: seriesNumber, seriesTotal })}>
          {Array.from({ length: seriesTotal }, (_, i) => {
            const n = i + 1;
            const done = n < seriesNumber;
            const current = n === seriesNumber;
            return (
              <span
                key={n}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (current ? `w-8 ${fillClass}` : done ? "w-4 bg-muted-foreground/50" : "w-4 bg-muted")
                }
              />
            );
          })}
        </div>
      )}

      <div
        className="flex flex-wrap items-center justify-center gap-1.5"
        aria-label={fmt(m.roundAria, { round: roundNumber, roundsTotal })}
      >
        {Array.from({ length: roundsTotal }, (_, i) => {
          const n = i + 1;
          const done = n < roundNumber || (n === roundNumber && phase !== "work" && phase !== "prepare");
          const current = n === roundNumber && !done;
          const size = compact ? "h-2 w-2" : "h-6 w-6";
          return (
            <span
              key={n}
              className={
                `${size} shrink-0 rounded-full border-2 transition ` +
                (done
                  ? `${borderClass} ${fillClass} opacity-50`
                  : current
                    ? `${borderClass} ${fillClass}`
                    : `${borderClass} bg-transparent opacity-30`)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
