import { createMemo, createSignal, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { deriveAccent, hexToRgbChannels, type DerivedAccent } from "./accent-derive";

/**
 * Third theme axis, after light/dark and palette. It answers "which hue does
 * this interface point with" — the accent is the one colour that means
 * *actionable*, so it is the one worth changing independently of the palette
 * around it.
 *
 * Unlike the other two axes this one is open: any colour, not a menu. The
 * picked colour is never used raw — `accent-derive.ts` solves a complete,
 * contrast-valid accent from it, and this module writes that to `<html>` as
 * inline custom properties. Inline beats every stylesheet, which is exactly
 * what an override that must work under any palette needs.
 *
 * `null` means "the app keeps its own accent" — the same shared lime set for
 * every style, so the accent colour persists across all three. That stamps
 * nothing, so the default costs nothing.
 */

/** Every property this module owns, so a reset can put them all back. */
const MANAGED = [
  "--c-color-brand-100",
  "--c-color-brand-200",
  "--c-color-brand-300",
  "--c-color-brand-400",
  "--c-color-brand-500",
  "--c-color-brand-600",
  "--c-color-brand-700",
  "--c-color-brand-800",
  "--c-color-accent-fill",
  "--c-color-accent-fill-hover",
  "--c-color-on-accent",
  "--c-color-text-hyperlink",
  "--c-color-official",
  "--c-accent-mark-light",
  "--c-accent-mark-dark",
  "--c-accent-mark-light-rgb",
  "--c-accent-mark-dark-rgb",
  "--c-accent-on-mark-light",
  "--c-accent-on-mark-dark",
];

const STORAGE_KEY = "ios-accent";

/** The colour the viewer picked, or null for "whatever the palette chose". */
const [accentHex, setAccentHexSignal] = createSignal<string | null>(null);

/** The solved accent. Null when the shared app accent is in charge. */
const derived = createMemo<DerivedAccent | null>(() => {
  const hex = accentHex();
  return hex ? deriveAccent(hex) : null;
});

function isHex(v: string | null): v is string {
  return !!v && /^#[0-9a-f]{6}$/i.test(v);
}

function stamp(hex: string | null): void {
  if (isServer) return;
  const root = document.documentElement;
  const s = root.style;

  if (!hex) {
    root.removeAttribute("data-accent");
    root.removeAttribute("data-accent-displaces");
    for (const p of MANAGED) s.removeProperty(p);
    return;
  }

  const d = deriveAccent(hex);
  const steps = [100, 200, 300, 400, 500, 600, 700, 800];
  d.ramp.forEach((value, i) => s.setProperty(`--c-color-brand-${steps[i]}`, value));

  s.setProperty("--c-color-accent-fill", d.fill);
  s.setProperty("--c-color-accent-fill-hover", d.fillHover);
  s.setProperty("--c-color-on-accent", d.onAccent);

  /* Both of these are theme-dependent, and both are already solved per theme
     by `--c-color-accent` — so they are pointed at it rather than duplicated. */
  s.setProperty("--c-color-text-hyperlink", "var(--c-color-accent)");
  s.setProperty("--c-color-official", "var(--c-color-accent)");

  s.setProperty("--c-accent-mark-light", d.markLight);
  s.setProperty("--c-accent-mark-dark", d.markDark);
  s.setProperty("--c-accent-mark-light-rgb", hexToRgbChannels(d.markLight));
  s.setProperty("--c-accent-mark-dark-rgb", hexToRgbChannels(d.markDark));
  s.setProperty(
    "--c-accent-on-mark-light",
    `var(--c-chart-label-${d.onMarkLight === "ink" ? "ink" : "on-dark"})`,
  );
  s.setProperty(
    "--c-accent-on-mark-dark",
    `var(--c-chart-label-${d.onMarkDark === "ink" ? "ink" : "on-dark"})`,
  );

  root.setAttribute("data-accent", "custom");
  if (d.displaces) root.setAttribute("data-accent-displaces", String(d.displaces));
  else root.removeAttribute("data-accent-displaces");
}

export function setAccentHex(hex: string | null): void {
  setAccentHexSignal(hex);
  stamp(hex);
  try {
    if (hex) localStorage.setItem(STORAGE_KEY, hex);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private window, blocked storage — the stamp still applied */
  }
}

/** Call once from the page root, alongside initTheme() and initPalette(). */
export function initAccent(): void {
  onMount(() => {
    let stored: string | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (isHex(raw)) stored = raw.toLowerCase();
    } catch {
      /* fall through to the app's own shared accent */
    }
    setAccentHexSignal(stored);
    stamp(stored);
  });
}

export { accentHex, derived };
