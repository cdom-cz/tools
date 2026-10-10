"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Zamezí uspání displeje během běhu timeru (Screen Wake Lock API).
 *
 * Prohlížeč lock sám uvolní při odchodu ze stránky (skrytí tabu, zamknutí
 * telefonu) a sám ho nikdy nevrátí — proto re-acquire na visibilitychange,
 * dokud je lock "chtěný" (wantedRef přežije ztrátu sentinelu).
 *
 * Vyžaduje secure context (HTTPS) — na localhost funguje, na http://IP z
 * telefonu ne. Chybí-li API (Safari <16.4, starší Firefox), `supported` je
 * false a volání acquire/release jsou no-op.
 */
export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const wantedRef = useRef(false);
  const [active, setActive] = useState(false);

  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  const acquire = useCallback(() => {
    wantedRef.current = true;
    if (!supported || sentinelRef.current) return;
    void (async () => {
      try {
        const s = await navigator.wakeLock.request("screen");
        sentinelRef.current = s;
        setActive(true);
        s.addEventListener("release", () => {
          sentinelRef.current = null;
          setActive(false);
        });
      } catch {
        // NotAllowedError apod. (nízká baterie, stránka není viditelná) — tiše.
        setActive(false);
      }
    })();
  }, [supported]);

  const release = useCallback(() => {
    wantedRef.current = false;
    const s = sentinelRef.current;
    sentinelRef.current = null;
    setActive(false);
    if (s) void s.release().catch(() => {});
  }, []);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible" && wantedRef.current) {
        acquire();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { supported, active, acquire, release };
}
