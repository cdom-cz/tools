"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type KeepAlive = { osc: OscillatorNode; gain: GainNode };

/**
 * Zvuková signalizace timeru (Web Audio API, žádné zvukové soubory).
 *
 * KLÍČOVÉ PRAVIDLO: AudioContext se vytváří AŽ v `prime()`, volané ze
 * synchronního user gesta (klik na "Spustit") — iOS/Safari jinak nechá
 * kontext v "suspended" stavu navždy a žádný zvuk se nepřehraje.
 */
export function useTimerAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const keepAliveRef = useRef<KeepAlive | null>(null);
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const startKeepAlive = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || keepAliveRef.current) return;
    // iOS suspenduje AudioContext po chvíli ticha; neslyšitelný trvalý tón
    // (pod prahem slyšitelnosti, gain ~0) drží audio graf živý, jinak je
    // první pípnutí po delší pauze hluché nebo zpožděné.
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.frequency.value = 20;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      keepAliveRef.current = { osc, gain };
    } catch {}
  }, []);

  const prime = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return; // feature detection — Web Audio nedostupné
        ctxRef.current = new Ctor();
        startKeepAlive();
      }
      void ctxRef.current.resume();
    } catch {}
  }, [startKeepAlive]);

  const resume = useCallback(() => {
    try {
      void ctxRef.current?.resume();
    } catch {}
  }, []);

  const suspend = useCallback(() => {
    try {
      void ctxRef.current?.suspend();
    } catch {}
  }, []);

  const close = useCallback(() => {
    try {
      keepAliveRef.current?.osc.stop();
      keepAliveRef.current?.osc.disconnect();
      keepAliveRef.current?.gain.disconnect();
    } catch {}
    keepAliveRef.current = null;
    try {
      void ctxRef.current?.close();
    } catch {}
    ctxRef.current = null;
  }, []);

  /**
   * Přehraje jeden tón s krátkou attack/release obálkou — bez rampy by skok
   * amplitudy na hraně tónu cvakl. Plánuje na ctx.currentTime (Web Audio má
   * vlastní přesné hodiny, nezávislé na JS event loopu).
   */
  const tone = useCallback((freq: number, durationMs: number, peak: number, type: OscillatorType = "sine") => {
    const ctx = ctxRef.current;
    if (!ctx || !enabledRef.current) return;
    try {
      const now = ctx.currentTime;
      const dur = durationMs / 1000;
      const attack = 0.008;
      const release = Math.min(0.12, dur * 0.5);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + attack);
      gain.gain.setValueAtTime(peak, now + Math.max(attack, dur - release));
      // Cíl 0.0001, ne 0 — konzistence s exponenciální rampou, kterou by
      // spec na skutečnou nulu zakázal.
      gain.gain.linearRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
      osc.onended = () => {
        try {
          gain.disconnect();
          osc.disconnect();
        } catch {}
      };
    } catch {}
  }, []);

  /** Krátké odpočítávací pípnutí — poslední sekundy segmentu. */
  const beep = useCallback(() => tone(880, 120, 0.22), [tone]);

  /** Gong na přechodu intervalu — nižší, delší, dvojtón pro plnější zvuk. */
  const gong = useCallback(() => {
    tone(440, 520, 0.28);
    tone(523.25, 480, 0.14);
  }, [tone]);

  /** Trojtón na konci celého tréninku. */
  const finishChime = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    tone(523.25, 260, 0.26);
    setTimeout(() => tone(659.25, 260, 0.26), 220);
    setTimeout(() => tone(783.99, 420, 0.26), 440);
  }, [tone]);

  /**
   * Jeden alikvot misky: rychlý náběh a exponenciální doznívání. Na rozdíl od
   * `tone` nemá plochou "sustain" část — zvuk misky po úderu jen doznívá.
   */
  const partial = useCallback((freq: number, peak: number, decaySec: number) => {
    const ctx = ctxRef.current;
    if (!ctx || !enabledRef.current) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.015);
      gain.gain.setTargetAtTime(0.0001, now + 0.015, decaySec / 4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decaySec + 0.5);
      osc.onended = () => {
        try {
          gain.disconnect();
          osc.disconnect();
        } catch {}
      };
    } catch {}
  }, []);

  /**
   * Jemný gong ve stylu tibetské misky: nízký základ (dvě mírně rozladěné
   * sinusovky dají pomalé "vlnění") + neharmonické alikvoty s kratším
   * doznělem. Doznívá ~5 s.
   */
  const bowl = useCallback(() => {
    partial(196, 0.12, 5.5);
    partial(197.6, 0.1, 5);
    partial(196 * 2.76, 0.05, 3.5);
    partial(196 * 5.4, 0.02, 2);
  }, [partial]);

  /** Trojitý gong na konci celé meditace. */
  const tripleBowl = useCallback(() => {
    if (!ctxRef.current) return;
    bowl();
    setTimeout(bowl, 2500);
    setTimeout(bowl, 5000);
  }, [bowl]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  useEffect(() => () => close(), [close]);

  return { prime, resume, suspend, close, beep, gong, finishChime, bowl, tripleBowl, enabled, toggle };
}

export type TimerAudio = ReturnType<typeof useTimerAudio>;
