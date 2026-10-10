"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Prevents the display from sleeping while the timer runs (Screen Wake Lock API).
 *
 * The browser releases the lock itself when leaving the page (hiding the tab, locking
 * the phone) and never restores it — hence re-acquire on visibilitychange
 * while the lock is "wanted" (wantedRef survives the loss of the sentinel).
 *
 * Requires a secure context (HTTPS) — works on localhost, not on http://IP from
 * a phone. If the API is missing (Safari <16.4, older Firefox), `supported` is
 * false and acquire/release calls are no-ops.
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
        // NotAllowedError etc. (low battery, page not visible) — silently.
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
