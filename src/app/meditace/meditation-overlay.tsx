"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { blocksLabel, PHASE_GLOW_CLASS, totalDuration, type MeditationConfig } from "@/lib/meditation-timer";
import { formatHuman, formatMmSs } from "@/lib/time-format";
import type { UseMeditationTimer } from "./use-meditation-timer";
import { MeditationRing } from "./meditation-ring";

const primaryButtonClass =
  "inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 text-base font-semibold text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50";

const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-body transition hover:bg-muted";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="m23 9-6 6M17 9l6 6" />
    </svg>
  );
}

/**
 * Fullscreen overlay běžící meditace. Portálováno na document.body — hlavička
 * layoutu má backdrop-blur, který vytváří containing block pro `position:
 * fixed` potomky (stejné řešení jako timer-overlay.tsx).
 */
export function MeditationOverlay({ timer, config }: { timer: UseMeditationTimer; config: MeditationConfig }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        timer.reset();
      } else if (e.key === " ") {
        e.preventDefault();
        if (timer.status === "running") timer.pause();
        else if (timer.status === "paused") timer.resume();
      } else if (e.key === "ArrowRight") {
        timer.skip();
      }
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const { view, status } = timer;
  const totalSeconds = totalDuration(timer.segments);
  const isSettling = view.phase === "prepare";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Běžící meditace"
      className="fixed inset-0 z-50 flex h-dvh flex-col bg-background"
    >
      <div className={`absolute inset-0 ${PHASE_GLOW_CLASS[view.phase]} transition-colors duration-500`} />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={timer.audio.toggle}
            aria-label={timer.audio.enabled ? "Vypnout zvuk" : "Zapnout zvuk"}
            title={timer.audio.enabled ? "Vypnout zvuk" : "Zapnout zvuk"}
            className={iconButtonClass}
          >
            {timer.audio.enabled ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>

          <span className="text-sm tabular-nums text-muted-foreground">
            Celkem zbývá {formatMmSs(Math.ceil(timer.totalRemaining - 0.0001))}
          </span>

          <button
            type="button"
            onClick={timer.reset}
            aria-label="Ukončit meditaci"
            title="Ukončit meditaci"
            className={iconButtonClass}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          {status === "finished" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="font-display text-4xl font-bold text-foreground">Hotovo</p>
              <p className="text-sm text-muted-foreground">
                {config.blocks} {blocksLabel(config.blocks)} · {formatHuman(totalSeconds)}
              </p>
            </div>
          ) : (
            <>
              <MeditationRing
                phase={view.phase}
                label={view.phaseLabel}
                remaining={view.remaining}
                segmentSeconds={view.segmentSeconds}
                segmentIndex={timer.segmentIndex}
              />
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {isSettling ? "Usaď se, brzy začne první blok" : `Blok ${view.blockNumber} / ${view.blocksTotal}`}
              </p>
            </>
          )}

          {!timer.wakeLock.supported && status !== "finished" && (
            <p className="text-xs text-muted-foreground">
              Displej se může uspat — prohlížeč nepodporuje Wake Lock.
            </p>
          )}
        </div>

        <div
          className="flex items-center gap-3 px-6 py-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {status === "finished" ? (
            <>
              <button type="button" onClick={timer.reset} className={secondaryButtonClass}>
                Zavřít
              </button>
              <button type="button" onClick={timer.start} className={primaryButtonClass}>
                Znovu
              </button>
            </>
          ) : (
            <>
              {status === "running" ? (
                <button type="button" onClick={timer.pause} className={secondaryButtonClass}>
                  Pauza
                </button>
              ) : (
                <button type="button" onClick={timer.resume} className={primaryButtonClass}>
                  Pokračovat
                </button>
              )}
              <button type="button" onClick={timer.skip} className={secondaryButtonClass}>
                {isSettling ? "Přeskočit" : "Další blok"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
