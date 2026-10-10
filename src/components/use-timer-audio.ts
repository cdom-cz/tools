"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type KeepAlive = { osc: OscillatorNode; gain: GainNode };

/**
 * Timer sound signalling (Web Audio API, no audio files).
 *
 * KEY RULE: the AudioContext is created only in `prime()`, called from a
 * synchronous user gesture (click on "Start") — otherwise iOS/Safari leaves
 * the context in the "suspended" state forever and no sound is played.
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
    // iOS suspends the AudioContext after a while of silence; an inaudible constant
    // tone (below the audibility threshold, gain ~0) keeps the audio graph alive,
    // otherwise the first beep after a longer pause is silent or delayed.
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
        if (!Ctor) return; // feature detection — Web Audio unavailable
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
   * Plays a single tone with a short attack/release envelope — without a ramp the
   * amplitude jump at the tone edge would click. Schedules on ctx.currentTime (Web Audio
   * has its own precise clock, independent of the JS event loop).
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
      // Target 0.0001, not 0 — consistent with the exponential ramp, which the
      // spec forbids for a true zero.
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

  /** Short countdown beep — the last seconds of a segment. */
  const beep = useCallback(() => tone(880, 120, 0.22), [tone]);

  /** Gong at an interval transition — lower, longer, a two-tone for a fuller sound. */
  const gong = useCallback(() => {
    tone(440, 520, 0.28);
    tone(523.25, 480, 0.14);
  }, [tone]);

  /** Three-tone chime at the end of the whole workout. */
  const finishChime = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    tone(523.25, 260, 0.26);
    setTimeout(() => tone(659.25, 260, 0.26), 220);
    setTimeout(() => tone(783.99, 420, 0.26), 440);
  }, [tone]);

  /**
   * A single partial of the bowl: fast attack and exponential decay. Unlike
   * `tone` it has no flat "sustain" part — the bowl sound just decays after the strike.
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
   * Soft gong in the style of a Tibetan bowl: a low fundamental (two slightly detuned
   * sines give a slow "wobble") + inharmonic partials with a shorter
   * decay. Rings out for ~5 s.
   */
  const bowl = useCallback(() => {
    partial(196, 0.12, 5.5);
    partial(197.6, 0.1, 5);
    partial(196 * 2.76, 0.05, 3.5);
    partial(196 * 5.4, 0.02, 2);
  }, [partial]);

  /** Triple gong at the end of the whole meditation. */
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
