"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/i18n/format";
import { useToolMessages } from "@/i18n/provider";
import { formatMmSs } from "@/lib/time-format";
import { PHASE_STROKE_CLASS, PHASE_TEXT_CLASS, type MeditationPhase } from "@/lib/meditation-timer";

const R = 108;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Circular progress ring of the time remaining in the segment (same principle as
 * timer/progress-ring.tsx): a CSS transition on stroke-dashoffset
 * interpolates between ticks, and on a segment transition it is turned off for two
 * frames so the circle does not animate backward a whole rotation.
 */
export function MeditationRing({
  phase,
  label,
  remaining,
  segmentSeconds,
  segmentIndex,
}: {
  phase: MeditationPhase;
  label: string;
  remaining: number;
  segmentSeconds: number;
  segmentIndex: number;
}) {
  const m = useToolMessages("meditation").ring;
  const progress = segmentSeconds > 0 ? Math.max(0, Math.min(1, remaining / segmentSeconds)) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  const [animate, setAnimate] = useState(true);
  const frameRef = useRef(0);
  useEffect(() => {
    setAnimate(false);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => setAnimate(true));
    });
    return () => cancelAnimationFrame(frameRef.current);
  }, [segmentIndex]);

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
            (animate ? "transition-[stroke-dashoffset] duration-300 ease-linear" : "")
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
