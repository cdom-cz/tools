"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/i18n/format";
import { useToolMessages } from "@/i18n/provider";
import { formatMmSs, PHASE_STROKE_CLASS, PHASE_TEXT_CLASS, type Phase } from "@/lib/interval-timer";

const R = 108;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Circular SVG progress ring of the time remaining in the current interval.
 * Smoothness without an animation library: the tick runs every 100 ms and a CSS
 * transition on stroke-dashoffset interpolates between ticks in the compositor,
 * effectively at 60 fps. `ease-linear` is required — the default `ease` would
 * slow down at the end of every 100ms window and visibly "stutter".
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
  const m = useToolMessages("timer").ring;
  const progress = segmentSeconds > 0 ? Math.max(0, Math.min(1, remaining / segmentSeconds)) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  // On a segment transition the offset jumps back to a full circle — without this
  // guard the transition would animate a whole backward rotation (glitch). We
  // disable the transition for a frame, let the new value render, then re-enable it.
  const [animate, setAnimate] = useState(true);
  const frameRef = useRef(0);
  useEffect(() => {
    setAnimate(false);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => setAnimate(true));
    });
    return () => cancelAnimationFrame(frameRef.current);
  }, [segmentIndex]);

  // Displayed second: the user expects 30 to appear right at the start
  // and 0 only at the end — hence ceil, consistent with the beeping in use-interval-timer.
  const displaySeconds = Math.ceil(remaining - 0.0001);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(78vw,20rem)]">
      <svg
        viewBox="0 0 240 240"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={fmt(m.aria, { label, time: formatMmSs(displaySeconds) })}
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
