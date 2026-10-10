"use client";

import { useEffect, useRef, useState } from "react";
import { formatMmSs, PHASE_STROKE_CLASS, PHASE_TEXT_CLASS, type Phase } from "@/lib/interval-timer";

const R = 108;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Kruhový SVG progress ring zbývajícího času aktuálního intervalu (bod 8
 * zadání). Plynulost bez animační knihovny: tick běží po 100 ms a CSS
 * transition na stroke-dashoffset interpoluje mezi ticky v compositoru,
 * efektivně na 60 fps. `ease-linear` je nutné — výchozí `ease` by v každém
 * 100ms okně zpomalovalo na konci a viditelně by to "cukalo".
 */
export function ProgressRing({
  phase,
  label,
  remaining,
  segmentSeconds,
  segmentIndex,
}: {
  phase: Phase;
  label: string;
  remaining: number;
  segmentSeconds: number;
  segmentIndex: number;
}) {
  const progress = segmentSeconds > 0 ? Math.max(0, Math.min(1, remaining / segmentSeconds)) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  // Na přechodu segmentu offset skočí zpět na plný kruh — bez tohoto guardu
  // by transition odanimovala pozpátku celou otáčku (glitch). Transition na
  // jeden frame vypneme, necháme vykreslit novou hodnotu, pak zase zapneme.
  const [animate, setAnimate] = useState(true);
  const frameRef = useRef(0);
  useEffect(() => {
    setAnimate(false);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => setAnimate(true));
    });
    return () => cancelAnimationFrame(frameRef.current);
  }, [segmentIndex]);

  // Zobrazovaná sekunda: uživatel očekává, že se 30 objeví hned na začátku
  // a 0 až na konci — proto ceil, konzistentní s pípáním v use-interval-timer.
  const displaySeconds = Math.ceil(remaining - 0.0001);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(78vw,20rem)]">
      <svg
        viewBox="0 0 240 240"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={`${label}, zbývá ${formatMmSs(displaySeconds)}`}
      >
        <circle cx="120" cy="120" r={R} fill="none" strokeWidth="12" className="stroke-muted" />
        <circle
          cx="120"
          cy="120"
          r={R}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={
            `${PHASE_STROKE_CLASS[phase]} ` +
            (animate ? "transition-[stroke-dashoffset] duration-100 ease-linear" : "")
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className={`text-sm font-semibold uppercase tracking-wide ${PHASE_TEXT_CLASS[phase]}`}>
          {label}
        </span>
        <span className="font-display text-6xl font-bold tabular-nums text-foreground sm:text-7xl">
          {formatMmSs(displaySeconds)}
        </span>
      </div>
    </div>
  );
}
