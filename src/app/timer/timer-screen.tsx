"use client";

import { useEffect, useState } from "react";
import { clampConfig, parseStoredConfig, DEFAULT_CONFIG, type TimerConfig } from "@/lib/interval-timer";
import { TimerSetup } from "./timer-setup";
import { TimerOverlay } from "./timer-overlay";
import { useIntervalTimer } from "./use-interval-timer";

const STORAGE_KEY = "tools.timer.config.v1";

/**
 * Kořenová klientská komponenta timeru: drží config (persistovaný do
 * localStorage) a přepíná mezi nastavením a běhovým overlayem.
 */
export function TimerScreen() {
  // SSR-safe konstanta jako initial state (vzor theme-toggle.tsx) — čtení
  // localStorage v inicializátoru useState by rozešlo první klientský render
  // se serverovým HTML (hydration mismatch).
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
