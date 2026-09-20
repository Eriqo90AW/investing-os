import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";

export type ThemeMode = "light" | "system" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ios-theme";

const DEFAULT_THEME: ThemeMode = "light";

const [mode, setModeSignal] = createSignal<ThemeMode>(DEFAULT_THEME);
const [resolved, setResolved] = createSignal<ResolvedTheme>("light");

function prefersDark(): boolean {
  if (isServer || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(m: ThemeMode): ResolvedTheme {
  if (m === "dark") return "dark";
  if (m === "light") return "light";
  return prefersDark() ? "dark" : "light";
}

/** Writes the three-state stamp the token sheet reads. */
function stamp(m: ThemeMode): void {
  if (isServer) return;
  const root = document.documentElement;
  root.classList.remove("NIGHT", "DAY");
  if (m === "dark") {
    root.setAttribute("data-theme", "dark");
    root.classList.add("NIGHT");
  } else if (m === "light") {
    root.setAttribute("data-theme", "light");
    root.classList.add("DAY");
  } else {
    root.removeAttribute("data-theme");
  }
  setResolved(resolve(m));
}

export function setMode(m: ThemeMode): void {
  setModeSignal(m);
  stamp(m);
  try {
    localStorage.setItem(STORAGE_KEY, m);
  } catch {
    /* private window, blocked storage — the stamp still applied */
  }
}

/**
 * Call once from the page root. Restores the stored mode, falling back to the
 * light theme, and keeps `resolved` in step with the OS setting while the
 * viewer is on "system".
 */
export function initTheme(): void {
  onMount(() => {
    let stored: ThemeMode = DEFAULT_THEME;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {
      /* fall through to the light default */
    }
    setModeSignal(stored);
    stamp(stored);

    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode() === "system") setResolved(prefersDark() ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    onCleanup(() => mq.removeEventListener("change", onChange));
  });
}

export { mode, resolved };
