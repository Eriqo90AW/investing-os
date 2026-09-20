import { createSignal, onMount } from "solid-js";
import { isServer } from "solid-js/web";

/**
 * Palette is the second axis of the theme, orthogonal to light/dark. Light and
 * dark answer "which ground am I on"; palette answers "which set of values
 * does that ground use". Both stamp the same `<html>` element and both are
 * read by the same `--c-*` lookups, so every component follows either one
 * without knowing that either exists.
 *
 * Adding a palette is one stylesheet plus one row here. If it needs a
 * component change, the palette is wrong — or the component is.
 */
export type PaletteId = "base" | "rustic" | "midnight";

/** A colour the palette was designed *from*, before any ramp was built. */
export interface SourceSwatch {
  name: string;
  hex: string;
  role: string;
}

export interface PaletteMeta {
  id: PaletteId;
  label: string;
  /** One line for the spec page — what this palette is for. */
  note: string;
  /** The source colours, and what each one ended up doing. */
  source: SourceSwatch[];
  /** The one thing that had to be reasoned about rather than transcribed. */
  tension: string;
}

export const PALETTES: PaletteMeta[] = [
  {
    id: "base",
    label: "Lime",
    note: "Electric lime on warm near-neutrals, with darker lime steps wherever the accent is used as text.",
    source: [
      { name: "electric lime", hex: "#99e50b", role: "the shared accent, all styles" },
      { name: "warm white", hex: "#fefdfc", role: "page ground" },
      { name: "warm ink", hex: "#19130f", role: "body text" },
    ],
    tension:
      "The source lime is too bright for text on light surfaces, so the shared brand ramp keeps lime for fills and uses darker lime for text.",
  },
  {
    id: "rustic",
    label: "Rustic",
    note: "Spicy paprika on floral white, dust grey and carbon black. Warmer grounds, softer ink, the same contrast contract.",
    source: [
      { name: "floral white", hex: "#fffcf2", role: "cards, dark-mode ink" },
      { name: "dust grey", hex: "#ccc5b9", role: "dark-mode secondary text" },
      { name: "charcoal brown", hex: "#403d39", role: "dark surface-2, chart grid" },
      { name: "carbon black", hex: "#252422", role: "light ink, dark page ground" },
      { name: "spicy paprika", hex: "#eb5e28", role: "sequential chart ramp" },
    ],
    tension:
      "Paprika is 3.4:1 under white, so it never carries text or receives buttons. It lives on as --c-color-paprika: chart magnitude fills only.",
  },
  {
    id: "midnight",
    label: "Midnight",
    note: "Indigo ink depths over platinum neutrals. The lime accent is shared with every style, so the blues stay unambiguously data.",
    source: [
      { name: "indigo ink", hex: "#4329d6", role: "dark ground stack" },
      { name: "cornflower blue", hex: "#042dfb", role: "chart slot 2" },
      { name: "periwinkle", hex: "#0320fc", role: "sequential ramp" },
      { name: "platinum", hex: "#636f9c", role: "light neutral ramp" },
      { name: "princeton orange", hex: "#ff8800", role: "retired accent (now shared lime)" },
    ],
    tension:
      "Princeton orange is 2.4:1 under white, so it could never be an ink — and with the accent now shared across styles, princeton steps out and the affordance is lime in every style.",
  },
];

const STORAGE_KEY = "ios-palette";

function isPaletteId(v: string | null): v is PaletteId {
  return PALETTES.some(p => p.id === v);
}

const DEFAULT_PALETTE: PaletteId = "rustic";

const [palette, setPaletteSignal] = createSignal<PaletteId>(DEFAULT_PALETTE);

/** "base" is the bare `:root`, so it is stamped by *removing* the attribute. */
function stamp(p: PaletteId): void {
  if (isServer) return;
  const root = document.documentElement;
  if (p === "base") root.removeAttribute("data-palette");
  else root.setAttribute("data-palette", p);
}

export function setPalette(p: PaletteId): void {
  setPaletteSignal(p);
  stamp(p);
  try {
    localStorage.setItem(STORAGE_KEY, p);
  } catch {
    /* private window, blocked storage — the stamp still applied */
  }
}

/** Call once from the page root, alongside initTheme(). */
export function initPalette(): void {
  onMount(() => {
    let stored: PaletteId = DEFAULT_PALETTE;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (isPaletteId(raw)) stored = raw;
    } catch {
      /* fall through to the Rustic default */
    }
    setPaletteSignal(stored);
    stamp(stored);
  });
}

export { palette };
