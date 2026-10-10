"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildSegments, viewAt, type Segment, type TimerConfig, type TimerView } from "@/lib/interval-timer";
import { useTimerAudio } from "@/components/use-timer-audio";
import { useWakeLock } from "@/components/use-wake-lock";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

const TICK_MS = 100;
const COUNTDOWN_FROM = 5;
const MIN_SECONDS_FOR_COUNTDOWN = 3;

/**
 * Drift-free runtime logic of the interval timer.
 *
 * Principle: state is never decremented. A ref holds the ABSOLUTE deadline
 * (performance.now() in ms) of the end of the current segment; the remaining
 * time is always `deadline - now`. Drift therefore does not accumulate, and
 * returning from the background (where timers are throttled) fixes itself —
 * the tick simply notices more time has passed and a while loop skips the
 * segments that elapsed in the meantime.
 *
 * Segments are snapshotted into segmentsRef only in start() — a later change of
 * `config` (cannot happen during a run since setup is hidden, but just in case)
 * does not break the running session.
 */
export function useIntervalTimer(config: TimerConfig) {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const segmentsRef = useRef<Segment[]>([]);
  const indexRef = useRef(0);
  const deadlineRef = useRef(0);
  const pausedRemainingRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBeepSecondRef = useRef<number | null>(null);
  const statusRef = useRef<TimerStatus>("idle");
  statusRef.current = status;

  const audio = useTimerAudio();
  const wakeLock = useWakeLock();

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const maybeBeep = useCallback(
    (secondsLeft: number, segmentSeconds: number) => {
      // Short segment: a countdown would sound confusing (a single beep right
      // next to the gong) — play only the gong at the transition.
      if (segmentSeconds < MIN_SECONDS_FOR_COUNTDOWN) return;
      // The second the user currently "sees" on the display (matches what
      // ProgressRing shows via formatMmSs(Math.ceil(...))).
      const displayed = Math.ceil(secondsLeft - 0.0001);
      if (displayed > COUNTDOWN_FROM || displayed <= 0) return;
      if (lastBeepSecondRef.current === displayed) return; // already beeped
      lastBeepSecondRef.current = displayed;
      audio.beep();
    },
    [audio],
  );

  const finish = useCallback(() => {
    stopInterval();
    wakeLock.release();
    audio.finishChime();
    setStatus("finished");
  }, [stopInterval, wakeLock, audio]);

  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    if (statusRef.current !== "running") return;
    const now = performance.now();
    let index = indexRef.current;
    let msLeft = deadlineRef.current - now;
    let catchUp = 0;

    // The background throttles timers — after returning, several segments may be missing at once.
    while (msLeft <= 0 && index < segmentsRef.current.length - 1) {
      index += 1;
      // The deadline derives from the PREVIOUS deadline, not from `now` — the leftover
      // overshoot is shortened from the next segment, so the total workout time
      // stays exact even after hundreds of segments.
      deadlineRef.current += segmentsRef.current[index].seconds * 1000;
      msLeft = deadlineRef.current - now;
      catchUp += 1;
      lastBeepSecondRef.current = null;
    }

    if (msLeft <= 0) {
      finish();
      return;
    }

    // Gong only for a transition that happened NOW — not a barrage of gongs from
    // the past after a long stay in the background.
    if (catchUp === 1) audio.gong();

    const seg = segmentsRef.current[index];
    maybeBeep(msLeft / 1000, seg.seconds);
    indexRef.current = index;
    setSegmentIndex(index);
    setRemaining(msLeft / 1000);
  };

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = setInterval(() => tickRef.current(), TICK_MS);
  }, [stopInterval]);

  const start = useCallback(() => {
    const segs = buildSegments(config);
    if (segs.length === 0) return; // edge case: empty workout (series/rounds = 0 never happens thanks to LIMITS, extra safeguard)
    segmentsRef.current = segs;
    indexRef.current = 0;
    deadlineRef.current = performance.now() + segs[0].seconds * 1000;
    lastBeepSecondRef.current = null;
    setSegmentIndex(0);
    setRemaining(segs[0].seconds);
    setStatus("running");
    audio.prime(); // AudioContext is created here — inside the user gesture
    audio.gong(); // confirms to the user that sound works, right from the start
    wakeLock.acquire();
    startInterval();
  }, [config, audio, wakeLock, startInterval]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    pausedRemainingRef.current = Math.max(0, deadlineRef.current - performance.now());
    stopInterval();
    wakeLock.release();
    audio.suspend();
    setStatus("paused");
  }, [stopInterval, wakeLock, audio]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    deadlineRef.current = performance.now() + pausedRemainingRef.current;
    // lastBeepSecondRef is INTENTIONALLY not reset — after resuming, the beep
    // must not repeat on the same second at which it was paused.
    audio.resume();
    wakeLock.acquire();
    setStatus("running");
    startInterval();
  }, [audio, wakeLock, startInterval]);

  const skip = useCallback(() => {
    const segs = segmentsRef.current;
    const next = indexRef.current + 1;
    if (next >= segs.length) {
      finish();
      return;
    }
    indexRef.current = next;
    lastBeepSecondRef.current = null;
    const nextRemainingMs = segs[next].seconds * 1000;
    if (statusRef.current === "paused") {
      pausedRemainingRef.current = nextRemainingMs;
    } else {
      deadlineRef.current = performance.now() + nextRemainingMs;
    }
    setSegmentIndex(next);
    setRemaining(segs[next].seconds);
    audio.gong();
  }, [finish, audio]);

  const reset = useCallback(() => {
    stopInterval();
    wakeLock.release();
    audio.close();
    segmentsRef.current = [];
    indexRef.current = 0;
    setSegmentIndex(0);
    setRemaining(0);
    setStatus("idle");
  }, [stopInterval, wakeLock, audio]);

  // Return from the background: force an immediate tick so the UI does not wait up to
  // 100 ms, and restore the wake lock / audio context lost when leaving the page.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (statusRef.current === "running") {
        tickRef.current();
        audio.resume();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on leaving the page / unmount.
  useEffect(() => {
    return () => {
      stopInterval();
      wakeLock.release();
      audio.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const segments = segmentsRef.current;
  const view: TimerView = viewAt(segments, config, segmentIndex, remaining);
  const totalRemaining = segments
    .slice(segmentIndex + 1)
    .reduce((sum, s) => sum + s.seconds, 0) + remaining;

  return {
    status,
    segments,
    segmentIndex,
    remaining,
    view,
    totalRemaining,
    audio,
    wakeLock,
    start,
    pause,
    resume,
    reset,
    skip,
  };
}

export type UseIntervalTimer = ReturnType<typeof useIntervalTimer>;
