"use client";

import { useEffect, useState } from "react";
import { clampConfig, DEFAULT_CONFIG, parseStoredConfig, type MeditationConfig } from "@/lib/meditation-timer";
import { MeditationSetup } from "./meditation-setup";
import { MeditationOverlay } from "./meditation-overlay";
import { useMeditationTimer } from "./use-meditation-timer";

const STORAGE_KEY = "tools.meditace.config.v1";

/** Kořenová klientská komponenta: config v localStorage + přepínání nastavení/overlay. */
export function MeditationScreen() {
  // SSR-safe konstanta jako initial state — localStorage se čte až v efektu,
  // jinak by se první klientský render rozešel se serverovým HTML.
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
