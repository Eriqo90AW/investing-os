/**
 * Derives a complete, contrast-valid accent from a single arbitrary colour.
 *
 * This is the same job `accents.css` used to do by hand for six named hues,
 * done in OKLCH at runtime so any colour works. The rules it enforces are the
 * ones that were already written down — they did not get softer because the
 * colour is now the viewer's choice:
 *
 *   - the brand ramp is 8 steps at one hue, monotonic in lightness
 *   - step 500 is the accent as INK on the lightest ground, >= 4.5:1
 *   - step 400 is the accent as INK on the darkest ground, >= 4.5:1
 *   - `on-accent` is whichever of the two label inks clears 4.5:1 on the fill
 *   - chart slot 1 is a MARK, not text: >= 3:1, and inside the dataviz
 *     lightness band for its surface
 *   - an accent whose hue is already a chart slot displaces that slot
 *
 * Both floors are measured against the worst ground any palette offers, not a
 * convenient one, so a derived accent is valid under every palette.
 */

/* ---------- sRGB <-> OKLab ------------------------------------------------ */

export interface Oklch {
  l: number;
  c: number;
  /** degrees, 0-360 */
  h: number;
}

type Rgb = [number, number, number];

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map(c => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function rgbToHex(rgb: Rgb): string {
  const part = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${part(rgb[0])}${part(rgb[1])}${part(rgb[2])}`;
}

function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinearRgb(L: number, a: number, bb: number): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex);
  const [L, a, bb] = linearRgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
  const c = Math.hypot(a, bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

function inGamut(rgb: Rgb): boolean {
  return rgb.every(v => v >= -0.0001 && v <= 1.0001);
}

/**
 * OKLCH -> sRGB, reducing chroma until the colour fits. Clipping channels
 * instead would shift the hue, which is the one thing a ramp cannot afford.
 */
function oklchToLinearRgb(o: Oklch): Rgb {
  const rad = (o.h * Math.PI) / 180;
  const at = (c: number) => oklabToLinearRgb(o.l, c * Math.cos(rad), c * Math.sin(rad));

  let rgb = at(o.c);
  if (inGamut(rgb)) return rgb;

  let lo = 0;
  let hi = o.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(at(mid))) lo = mid;
    else hi = mid;
  }
  rgb = at(lo);
  return [
    Math.min(1, Math.max(0, rgb[0])),
    Math.min(1, Math.max(0, rgb[1])),
    Math.min(1, Math.max(0, rgb[2])),
  ];
}

function oklchToHex(o: Oklch): string {
  const lin = oklchToLinearRgb(o);
  return rgbToHex([linearToSrgb(lin[0]), linearToSrgb(lin[1]), linearToSrgb(lin[2])]);
}

/* ---------- WCAG ---------------------------------------------------------- */

/** Relative luminance, from the linear-light values the OKLCH round-trip gives. */
function luminanceOf(o: Oklch): number {
  const [r, g, b] = oklchToLinearRgb(o);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function luminanceOfHex(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrast(lumA: number, lumB: number): number {
  const hi = Math.max(lumA, lumB);
  const lo = Math.min(lumA, lumB);
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- the grounds every accent is measured against ------------------ */

/**
 * Not "white" and "black" — the worst real ground any shipped palette offers.
 * An accent that clears these clears every palette.
 */
const WORST_LIGHT_GROUND = luminanceOfHex("#eff1f5"); /* Midnight surface-2   */
const WORST_DARK_GROUND = luminanceOfHex("#2f2d2a"); /* Rustic surface-1     */
const LIGHTEST_SURFACE = luminanceOfHex("#ffffff");

/** The two inks a fill or a mark can carry. Palettes re-point these; the
 *  decision of *which* one is a fact about the colour, so it is made here. */
const LABEL_INK = luminanceOfHex("#14161f");
const LABEL_ON_DARK = luminanceOfHex("#fffcf2");

const TEXT_AA = 4.5;
/** A mark is not text; WCAG non-text contrast is 3:1. */
const MARK_MIN = 3;

/**
 * Walks lightness at fixed hue until the contrast floor is met, then stops.
 * `dir` -1 searches downward (darker, for ink on a light ground), +1 upward.
 * Returns the last lightness tried if nothing passes, which only happens for
 * colours no lightness can save — the caller clamps.
 */
function solveL(
  base: Oklch,
  from: number,
  dir: -1 | 1,
  against: number,
  ratio: number,
): number {
  for (let i = 0; i <= 100; i++) {
    const l = from + dir * i * 0.01;
    if (l < 0.02 || l > 0.99) break;
    if (contrast(luminanceOf({ ...base, l }), against) >= ratio) return l;
  }
  return dir === -1 ? 0.1 : 0.95;
}

/* ---------- chart slots this accent might collide with -------------------- */

const SLOT_HUES: { slot: 2 | 3 | 4; hue: number }[] = [
  { slot: 2, hue: hexToOklch("#3861fb").h },
  { slot: 3, hue: hexToOklch("#0f91a8").h },
  { slot: 4, hue: hexToOklch("#8a3ffc").h },
];

/** Below this, two categorical hues stop being separable under CVD. */
const HUE_COLLISION = 30;

/**
 * Green and red are reserved for price direction. An accent sitting on one of
 * those hues is not *broken* — every floor still passes — but it makes a link
 * look like a gain, so the picker says so and lets the viewer decide. The
 * threshold is deliberately tighter than HUE_COLLISION: the shipped burnt
 * orange sits 15 degrees off negative and must not trip it.
 */
const DIRECTION_HUES: { name: "positive" | "negative"; hue: number }[] = [
  { name: "positive", hue: hexToOklch("#16c784").h },
  { name: "negative", hue: hexToOklch("#ea3943").h },
];
const DIRECTION_COLLISION = 12;

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function directionConflict(o: Oklch): "positive" | "negative" | undefined {
  if (o.c < 0.04) return undefined; // too grey to read as either
  return DIRECTION_HUES.find(d => hueDistance(o.h, d.hue) < DIRECTION_COLLISION)?.name;
}

function displacedSlot(hue: number): 2 | 3 | 4 | undefined {
  let best: { slot: 2 | 3 | 4; d: number } | undefined;
  for (const s of SLOT_HUES) {
    const d = hueDistance(hue, s.hue);
    if (d < HUE_COLLISION && (!best || d < best.d)) best = { slot: s.slot, d };
  }
  return best?.slot;
}

/* ---------- the derived accent -------------------------------------------- */

export interface DerivedAccent {
  /** --c-color-brand-100 … -800, in order. */
  ramp: string[];
  fill: string;
  fillHover: string;
  onAccent: string;
  /** True when the fill takes dark ink — the "Princeton inversion". */
  inverted: boolean;
  /** Chart slot 1, which is a mark and so has its own floor. */
  markLight: string;
  markDark: string;
  onMarkLight: "ink" | "on-dark";
  onMarkDark: "ink" | "on-dark";
  displaces?: 2 | 3 | 4;
  /** Set when the hue reads as price direction. A warning, not a rejection. */
  reserved?: "positive" | "negative";
  /** Measured, not promised — the spec page prints these. */
  ratios: {
    inkLight: number;
    inkDark: number;
    onAccent: number;
    markLight: number;
    markDark: number;
  };
  /** True when the picked colour itself survived as the fill. */
  keptAsFill: boolean;
}

/** Relative chroma per step. Pale at the top, fullest around the ink steps. */
const CHROMA_PROFILE = [0.14, 0.38, 0.58, 0.95, 1, 0.94, 0.84, 0.5];

export function deriveAccent(hex: string): DerivedAccent {
  const base = hexToOklch(hex);
  /* A washed-out pick gets nudged up so the ramp reads as a hue at all. A
     genuinely neutral one is left alone: below this threshold the hue angle is
     rounding noise, and amplifying it invents a colour the viewer never chose. */
  const c0 = base.c < 0.015 ? base.c : Math.max(base.c, 0.04);
  const at = (l: number, i: number): Oklch => ({
    l,
    c: c0 * (CHROMA_PROFILE[i] ?? 1),
    h: base.h,
  });

  /* Ink steps are solved, not chosen: 400 is the lowest lightness that still
     clears 4.5:1 on the darkest dark surface, 500 the highest that clears it
     on the lightest light one. */
  const l400 = solveL({ ...base, c: c0 * 0.95 }, 0.5, 1, WORST_DARK_GROUND, TEXT_AA);
  const l500 = Math.min(
    solveL({ ...base, c: c0 }, 0.75, -1, WORST_LIGHT_GROUND, TEXT_AA),
    l400 - 0.08,
  );

  /* The rest hang off those two, forced monotonic so the ramp never folds. */
  const l300 = Math.max(0.835, l400 + 0.07);
  const l200 = Math.max(0.905, l300 + 0.05);
  const l100 = Math.min(0.985, Math.max(0.968, l200 + 0.04));
  const l600 = Math.min(0.44, l500 - 0.07);
  const l700 = Math.min(0.375, l600 - 0.05);
  const l800 = Math.min(0.245, l700 - 0.08);

  const ls = [l100, l200, l300, l400, l500, l600, l700, l800];
  const ramp = ls.map((l, i) => oklchToHex(at(l, i)));

  /* --- the fill ---------------------------------------------------------
     Try the colour the viewer actually picked first. If either label ink
     clears 4.5:1 on it, it survives intact — that is how a bright orange
     stays bright instead of being darkened into a link colour. Only when
     neither ink works does it fall back to the solved 500 step. */
  const pickedLum = luminanceOf(base);
  const pickedOnDark = contrast(pickedLum, LABEL_INK);
  const pickedOnLight = contrast(pickedLum, LABEL_ON_DARK);
  const keptAsFill = Math.max(pickedOnDark, pickedOnLight) >= TEXT_AA;

  const fillOklch = keptAsFill ? base : at(l500, 4);
  const fillLum = luminanceOf(fillOklch);
  const onDarkRatio = contrast(fillLum, LABEL_INK);
  const onLightRatio = contrast(fillLum, LABEL_ON_DARK);
  const inverted = onDarkRatio > onLightRatio;

  /* Hover moves away from the ink on it, so the pair can only get safer. */
  const hoverL = inverted
    ? Math.min(0.97, fillOklch.l + 0.08)
    : Math.max(0.12, fillOklch.l - 0.08);

  /* --- chart slot 1 ------------------------------------------------------
     A mark, not text. 3:1 is the floor, and the dark-surface band tops out
     at L 0.67 — a mark brighter than that blooms against a dark ground even
     though it would be perfectly good as a label. */
  const lMarkLight = Math.min(
    0.62,
    solveL({ ...base, c: c0 }, 0.7, -1, LIGHTEST_SURFACE, MARK_MIN),
  );
  const lMarkDark = Math.min(
    0.67,
    Math.max(lMarkLight, solveL({ ...base, c: c0 }, 0.45, 1, WORST_DARK_GROUND, MARK_MIN)),
  );
  const markLightOklch = { l: lMarkLight, c: c0, h: base.h };
  const markDarkOklch = { l: lMarkDark, c: c0, h: base.h };
  const markLightLum = luminanceOf(markLightOklch);
  const markDarkLum = luminanceOf(markDarkOklch);

  return {
    ramp,
    fill: oklchToHex(fillOklch),
    fillHover: oklchToHex({ ...fillOklch, l: hoverL }),
    onAccent: inverted ? "var(--c-chart-label-ink)" : "var(--c-chart-label-on-dark)",
    inverted,
    markLight: oklchToHex(markLightOklch),
    markDark: oklchToHex(markDarkOklch),
    onMarkLight: contrast(markLightLum, LABEL_INK) >= TEXT_AA ? "ink" : "on-dark",
    onMarkDark: contrast(markDarkLum, LABEL_INK) >= TEXT_AA ? "ink" : "on-dark",
    displaces: displacedSlot(base.h),
    reserved: directionConflict(base),
    keptAsFill,
    ratios: {
      inkLight: contrast(luminanceOf(at(l500, 4)), WORST_LIGHT_GROUND),
      inkDark: contrast(luminanceOf(at(l400, 3)), WORST_DARK_GROUND),
      onAccent: Math.max(onDarkRatio, onLightRatio),
      markLight: contrast(markLightLum, LIGHTEST_SURFACE),
      markDark: contrast(markDarkLum, WORST_DARK_GROUND),
    },
  };
}

/** "235 94 40" — for the area gradient, which needs channels, not a colour. */
export function hexToRgbChannels(hex: string): string {
  return hexToRgb(hex)
    .map(v => Math.round(v * 255))
    .join(" ");
}
