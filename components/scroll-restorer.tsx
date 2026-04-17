"use client";

import { useEffect } from "react";

const STORAGE_PREFIX = "scroll:";

function getHistoryKey(): string {
  const state = window.history.state as { key?: string } | null;
  if (state?.key) return state.key;
  return window.location.pathname + window.location.search;
}

export function ScrollRestorer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    let saveTimer: number | null = null;
    function saveScroll() {
      if (saveTimer !== null) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        try {
          sessionStorage.setItem(
            STORAGE_PREFIX + getHistoryKey(),
            String(window.scrollY)
          );
        } catch {
          // storage unavailable — ignore
        }
      }, 100);
    }

    function restoreScroll() {
      try {
        const raw = sessionStorage.getItem(STORAGE_PREFIX + getHistoryKey());
        const y = raw === null ? 0 : Number(raw);
        if (!Number.isFinite(y)) return;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => window.scrollTo(0, y));
        });
      } catch {
        // ignore
      }
    }

    restoreScroll();
    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("popstate", restoreScroll);

    return () => {
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("popstate", restoreScroll);
      if (saveTimer !== null) window.clearTimeout(saveTimer);
    };
  }, []);

  return null;
}
