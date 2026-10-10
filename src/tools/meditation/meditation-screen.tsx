"use client";

import { useEffect, useState } from "react";
import { clampConfig, DEFAULT_CONFIG, parseStoredConfig, type MeditationConfig } from "@/lib/meditation-timer";
import { MeditationSetup } from "./meditation-setup";
import { MeditationOverlay } from "./meditation-overlay";
import { useMeditationTimer } from "./use-meditation-timer";

const STORAGE_KEY = "tools.meditace.config.v1";

/** Root client component: config in localStorage + switching between setup/overlay. */
export function MeditationScreen() {
  // SSR-safe constant as initial state — localStorage is read only in the effect,
  // otherwise the first client render would diverge from the server HTML.
  const [config, setConfig] = useState<MeditationConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const stored = parseStoredConfig(localStorage.getItem(STORAGE_KEY));
      if (stored) setConfig(stored);
    } catch {}
  }, []);

  function updateConfig(next: MeditationConfig) {
    const clamped = clampConfig(next);
    setConfig(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
    } catch {}
  }

  const timer = useMeditationTimer(config);

  if (timer.status !== "idle") {
    return <MeditationOverlay timer={timer} config={config} />;
  }

  return <MeditationSetup config={config} onChange={updateConfig} onStart={timer.start} />;
}
