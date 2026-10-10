"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildSegments,
  viewAt,
  type MeditationConfig,
  type MeditationSegment,
  type MeditationView,
} from "@/lib/meditation-timer";
import { useTimerAudio } from "@/components/use-timer-audio";
import { useWakeLock } from "@/components/use-wake-lock";

export type MeditationStatus = "idle" | "running" | "paused" | "finished";

const TICK_MS = 250;

/**
 * Drift-free běh meditace — stejný princip jako use-interval-timer.ts:
 * v refu je ABSOLUTNÍ deadline konce aktuálního segmentu, zbývající čas je
 * vždy `deadline - now` a návrat z pozadí se opraví přeskočením segmentů,
 * které mezitím doběhly. Zvuk: jemný gong na konci každého segmentu,
 * trojitý gong na konci celé meditace, žádné odpočítávací pípání.
 */
export function useMeditationTimer(config: MeditationConfig) {
  const [status, setStatus] = useState<MeditationStatus>("idle");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const segmentsRef = useRef<MeditationSegment[]>([]);
  const indexRef = useRef(0);
  const deadlineRef = useRef(0);
  const pausedRemainingRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<MeditationStatus>("idle");
  statusRef.current = status;

  const audio = useTimerAudio();
  const wakeLock = useWakeLock();

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    stopInterval();
    wakeLock.release();
    audio.tripleBowl();
    setRemaining(0);
    setStatus("finished");
  }, [stopInterval, wakeLock, audio]);

  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    if (statusRef.current !== "running") return;
    const now = performance.now();
    let index = indexRef.current;
    let msLeft = deadlineRef.current - now;
    let catchUp = 0;

    while (msLeft <= 0 && index < segmentsRef.current.length - 1) {
      index += 1;
      // Deadline navazuje na PŘEDCHOZÍ deadline, ne na `now` — celkový čas
      // zůstává přesný i po dlouhém pobytu na pozadí.
      deadlineRef.current += segmentsRef.current[index].seconds * 1000;
      msLeft = deadlineRef.current - now;
      catchUp += 1;
    }

    if (msLeft <= 0) {
      finish();
      return;
    }

    // Gong jen při přechodu, ke kterému došlo TEĎ — ne série gongů z minulosti.
    if (catchUp === 1) audio.bowl();

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
    if (segs.length === 0) return;
    segmentsRef.current = segs;
    indexRef.current = 0;
    deadlineRef.current = performance.now() + segs[0].seconds * 1000;
    setSegmentIndex(0);
    setRemaining(segs[0].seconds);
    setStatus("running");
    audio.prime(); // AudioContext se tvoří tady — v user gestu (iOS)
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
    const nextRemainingMs = segs[next].seconds * 1000;
    if (statusRef.current === "paused") {
      pausedRemainingRef.current = nextRemainingMs;
    } else {
      deadlineRef.current = performance.now() + nextRemainingMs;
    }
    setSegmentIndex(next);
    setRemaining(segs[next].seconds);
    audio.bowl();
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

  // Návrat z pozadí: okamžitý tick + obnova audio contextu.
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

  useEffect(() => {
    return () => {
      stopInterval();
      wakeLock.release();
      audio.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const segments = segmentsRef.current;
  const view: MeditationView = viewAt(segments, config, segmentIndex, remaining);
  const totalRemaining =
    segments.slice(segmentIndex + 1).reduce((sum, s) => sum + s.seconds, 0) + remaining;

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

export type UseMeditationTimer = ReturnType<typeof useMeditationTimer>;
