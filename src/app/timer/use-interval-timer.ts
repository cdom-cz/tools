"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildSegments, viewAt, type Segment, type TimerConfig, type TimerView } from "@/lib/interval-timer";
import { useTimerAudio } from "./use-timer-audio";
import { useWakeLock } from "./use-wake-lock";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

const TICK_MS = 100;
const COUNTDOWN_FROM = 5;
const MIN_SECONDS_FOR_COUNTDOWN = 3;

/**
 * Drift-free běhová logika intervalového timeru.
 *
 * Princip: stav se nikdy nedekrementuje. V refu se drží ABSOLUTNÍ deadline
 * (performance.now() v ms) konce aktuálního segmentu; zbývající čas je vždy
 * `deadline - now`. Drift se tak nekumuluje a návrat z pozadí (kde jsou
 * timery throttlované) se opraví sám — tick prostě zjistí, že uběhlo víc
 * času, a while smyčkou přeskočí segmenty, které mezitím doběhly.
 *
 * Segmenty se snapshotují do segmentsRef teprve ve start() — pozdější změna
 * `config` (nemůže za běhu nastat, setup je skrytý, ale pro jistotu) běžící
 * relaci nerozbije.
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
      // Krátký segment: odpočet by zněl zmateně (jedno pípnutí hned vedle
      // gongu) — pusť jen gong na přechodu.
      if (segmentSeconds < MIN_SECONDS_FOR_COUNTDOWN) return;
      // Sekunda, kterou uživatel právě "vidí" na displeji (shodné s tím, co
      // zobrazuje ProgressRing přes formatMmSs(Math.ceil(...))).
      const displayed = Math.ceil(secondsLeft - 0.0001);
      if (displayed > COUNTDOWN_FROM || displayed <= 0) return;
      if (lastBeepSecondRef.current === displayed) return; // už odpípnuto
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

    // Pozadí throttluje timery — po návratu může chybět víc segmentů najednou.
    while (msLeft <= 0 && index < segmentsRef.current.length - 1) {
      index += 1;
      // Deadline se odvozuje od PŘEDCHOZÍHO deadline, ne od `now` — zbytkový
      // přesah se sám zkrátí z dalšího segmentu, takže celkový čas tréninku
      // je přesný i po stovkách segmentů.
      deadlineRef.current += segmentsRef.current[index].seconds * 1000;
      msLeft = deadlineRef.current - now;
      catchUp += 1;
      lastBeepSecondRef.current = null;
    }

    if (msLeft <= 0) {
      finish();
      return;
    }

    // Gong jen při přechodu, ke kterému došlo TEĎ — ne kanonáda gongů z
    // minulosti po dlouhém pobytu na pozadí.
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
    if (segs.length === 0) return; // edge case: prázdný trénink (série/kola = 0 nikdy nenastane díky LIMITS, pojistka navíc)
    segmentsRef.current = segs;
    indexRef.current = 0;
    deadlineRef.current = performance.now() + segs[0].seconds * 1000;
    lastBeepSecondRef.current = null;
    setSegmentIndex(0);
    setRemaining(segs[0].seconds);
    setStatus("running");
    audio.prime(); // AudioContext se tvoří tady — v user gestu
    audio.gong(); // potvrzení uživateli, že zvuk funguje, i na úplném začátku
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
    // lastBeepSecondRef se ZÁMĚRNĚ nenuluje — po pokračování se nemá
    // opakovat pípnutí na téže sekundě, na které se pauznulo.
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

  // Návrat z pozadí: vynuť okamžitý tick, ať UI nečeká až 100 ms, a obnov
  // wake lock / audio context, které se při odchodu ze stránky ztratily.
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

  // Cleanup při odchodu ze stránky / unmountu.
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
