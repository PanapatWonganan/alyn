"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "alyn_theme";

// In-module listeners — lets setTheme() trigger re-renders in every
// component that consumes useTheme() in the same tab.
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (private mode, etc.)
  }
  return "system";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  // Re-render when system colour scheme flips (only matters if theme is
  // "system", but cheap to always listen).
  let mql: MediaQueryList | null = null;
  const mqlHandler = () => onChange();
  if (typeof window !== "undefined") {
    mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", mqlHandler);
  }

  // Cross-tab sync via the storage event.
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", storageHandler);
  }

  return () => {
    listeners.delete(onChange);
    mql?.removeEventListener("change", mqlHandler);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", storageHandler);
    }
  };
}

function getSnapshot(): Theme {
  return readStoredTheme();
}

function getServerSnapshot(): Theme {
  return "system";
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const resolvedTheme: ResolvedTheme = resolve(theme);

  // Keep the DOM class in sync whenever the resolved theme changes. Pure
  // DOM mutation — no setState, so no cascading renders.
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applyTheme(resolve(next));
    emit();
  }, []);

  const toggleTheme = useCallback(() => {
    const current = resolve(readStoredTheme());
    const next: Theme = current === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applyTheme(resolve(next));
    emit();
  }, []);

  // useSyncExternalStore guarantees consistent reads on the client.
  // `mounted` is kept for API compatibility and simply reflects whether we
  // are past the first client render (which is always true once this hook
  // is called from a client component that has hydrated).
  const mounted = typeof window !== "undefined";

  return { theme, resolvedTheme, setTheme, toggleTheme, mounted };
}
