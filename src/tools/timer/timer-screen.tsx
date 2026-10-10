"use client";

import { useEffect, useState } from "react";
import { clampConfig, parseStoredConfig, DEFAULT_CONFIG, type TimerConfig } from "@/lib/interval-timer";
import { TimerSetup } from "./timer-setup";
import { TimerOverlay } from "./timer-overlay";
import { useIntervalTimer } from "./use-interval-timer";

const STORAGE_KEY = "tools.timer.config.v1";

/**
 * Root client component of the timer: holds the config (persisted to
 * localStorage) and switches between setup and the running overlay.
 */
export function TimerScreen() {
  // SSR-safe constant as initial state (pattern from theme-toggle.tsx) — reading
  // localStorage in the useState initializer would make the first client render
  // diverge from the server HTML (hydration mismatch).
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const stored = parseStoredConfig(localStorage.getItem(STORAGE_KEY));
      if (stored) setConfig(stored);
    } catch {}
  }, []);

  function updateConfig(next: TimerConfig) {
    const clamped = clampConfig(next);
    setConfig(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
    } catch {}
  }

  const timer = useIntervalTimer(config);

  if (timer.status !== "idle") {
    return <TimerOverlay timer={timer} config={config} />;
  }

  return <TimerSetup config={config} onChange={updateConfig} onStart={timer.start} />;
}
