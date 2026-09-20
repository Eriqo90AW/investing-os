/**
 * Typed mirror of styles/tokens.css, used to render the spec page.
 * Hex values here are documentation; anything that actually paints reads the
 * CSS variable so it stays theme-correct.
 */

export type Hue = "orange" | "blue" | "green" | "red" | "purple" | "teal" | "beige";

export const HUES: Hue[] = ["orange", "blue", "green", "red", "purple", "teal", "beige"];
export const RAMP_STEPS = [100, 200, 300, 400, 500, 600, 700, 800] as const;

export const HUE_NOTES: Record<Hue, string> = {
  orange: "The only accent. Links, primary buttons, active tab, focus ring, chart slot 1.",
  blue: "Categorical slot 2. Never an affordance — a blue thing here is data, not a link.",
  green: "Reserved: price up. Never decoration, never a categorical series.",
  red: "Reserved: price down. Never decoration, never a categorical series.",
  purple: "Categorical slot 4. Also used for staking/derivatives surfaces.",
  teal: "Categorical slot 3.",
  beige: "Warnings, unaudited flags, and alert states.",
};

export const GRAY_STEPS = [100, 200, 300, 400, 500, 600] as const;

/**
 * The gray ramp is warm, not cool. Each step was rotated to OKLCH hue 55 at
 * its original lightness, so the neutrals picked up the accent's warmth
 * without a single contrast ratio moving. Grounds keep 85% of the original
 * chroma so the tint is actually visible; ink steps keep 45%, past which body
 * copy starts reading brown rather than black.
 */
export const GRAY_NOTE =
  "Rotated to OKLCH hue 55 at unchanged lightness — warm neutrals, identical contrast.";

/** Magnitude: one hue, light to dark. Four steps, validated as an ordinal ramp. */
export const SEQ_STEPS = [1, 2, 3, 4] as const;

/** Polarity: the reserved direction pair around a neutral midpoint. */
export const DIV_STEPS = [
  { cssVar: "--c-chart-div-neg-2", label: "strongly down" },
  { cssVar: "--c-chart-div-neg-1", label: "down" },
  { cssVar: "--c-chart-div-mid", label: "flat" },
  { cssVar: "--c-chart-div-pos-1", label: "up" },
  { cssVar: "--c-chart-div-pos-2", label: "strongly up" },
] as const;

export const GRAY_ROLES: Record<number, string> = {
  100: "zebra / subtle fill",
  200: "hairline",
  300: "disabled border",
  400: "caption text",
  500: "icon default",
  600: "secondary text",
};

export interface SemanticToken {
  name: string;
  cssVar: string;
  light: string;
  dark: string;
  role: string;
}

export const SEMANTIC_TOKENS: SemanticToken[] = [
  { name: "background-1", cssVar: "--c-color-background-1", light: "#FEFDFC", dark: "#211812", role: "page ground" },
  { name: "background-2", cssVar: "--c-color-background-2", light: "#FFFFFF", dark: "#1D1109", role: "nav, ticker" },
  { name: "surface-1", cssVar: "--c-color-surface-1", light: "#FFFFFF", dark: "#2D231D", role: "cards, chart surface" },
  { name: "surface-2", cssVar: "--c-color-surface-2", light: "#FCF9F7", dark: "#392C24", role: "inputs, row hover" },
  { name: "gray-200", cssVar: "--c-color-gray-200", light: "#F4F1EF", dark: "#41332A", role: "hairline, chart grid" },
];

export const STATUS_TOKENS: SemanticToken[] = [
  { name: "positive", cssVar: "--c-color-positive", light: "#16C784", dark: "#16C784", role: "price up" },
  { name: "negative", cssVar: "--c-color-negative", light: "#EA3943", dark: "#EA3943", role: "price down" },
  { name: "official", cssVar: "--c-color-official", light: "#C2410C", dark: "#F97316", role: "verified" },
  { name: "reminder", cssVar: "--c-color-reminder", light: "#F5B97F", dark: "#F5B97F", role: "unaudited" },
  { name: "no-access", cssVar: "--c-color-no-access", light: "#948A84", dark: "#948A84", role: "gated" },
];

export const TEXT_TOKENS: SemanticToken[] = [
  { name: "text-primary", cssVar: "--c-color-text-primary", light: "#19130F", dark: "#FFFFFF", role: "body ink" },
  { name: "text-secondary", cssVar: "--c-color-text-secondary", light: "#766B64", dark: "#AFA6A0", role: "labels, axes" },
  { name: "text-caption", cssVar: "--c-color-text-caption", light: "#B7AEA8", dark: "#736A63", role: "meta only" },
  { name: "text-hyperlink", cssVar: "--c-color-text-hyperlink", light: "#C2410C", dark: "#F97316", role: "links" },
];

export interface TypeStep {
  step: number;
  role: string;
  sample: string;
  weight: 400 | 500 | 700;
  responsive?: string;
}

export const TYPE_SCALE: TypeStep[] = [
  { step: 1000, role: "Display", sample: "$109,482.31", weight: 700, responsive: "32 → 40px" },
  { step: 800, role: "Page heading", sample: "Today's Cryptocurrency Prices", weight: 700, responsive: "25 → 32px" },
  { step: 600, role: "Sub-page heading", sample: "Trending on the market", weight: 700, responsive: "20 → 25px" },
  { step: 400, role: "Section heading", sample: "Circulating supply", weight: 700, responsive: "18 → 20px" },
  { step: 300, role: "Card title", sample: "Bitcoin dominance", weight: 700 },
  { step: 200, role: "Emphasized body", sample: "Nav links and lead paragraphs", weight: 500 },
  { step: 100, role: "Body default", sample: "Table cells, descriptions, form values", weight: 400 },
  { step: 75, role: "Meta", sample: "Chip labels, column headers, axis ticks", weight: 400 },
  { step: 50, role: "Micro", sample: "RANK BADGES, LEGENDS", weight: 400 },
];

export const SPACE_SCALE = [
  { step: 50, px: 4 },
  { step: 100, px: 8 },
  { step: 150, px: 12 },
  { step: 200, px: 16 },
  { step: 250, px: 20 },
  { step: 300, px: 24 },
  { step: 400, px: 32 },
  { step: 500, px: 40 },
  { step: 600, px: 48 },
  { step: 800, px: 64 },
] as const;

export const RADIUS_SCALE = [
  { step: 10, use: "tags", responsive: "2 → 4px" },
  { step: 50, use: "inputs", responsive: "4 → 6px" },
  { step: 100, use: "buttons", responsive: "8px" },
  { step: 200, use: "cards", responsive: "12 → 14px" },
  { step: 300, use: "modals", responsive: "16px" },
  { step: 400, use: "pills", responsive: "20px" },
] as const;

/**
 * Categorical chart slots. Validated with the six checks (lightness band,
 * chroma floor, CVD separation, normal-vision floor, contrast vs surface)
 * against #FFFFFF and #222531 — all pass. Slot 2 is blue rather than amber
 * because slot 1 now carries the orange accent, and orange↔amber collapses
 * under every CVD model. Worst adjacent pair is purple↔teal at ΔE 16.2
 * (deutan), comfortably above the ΔE 8 target.
 *
 * Assign in this fixed order. Never cycle; a fifth series folds into "Other".
 */
export interface SeriesSlot {
  slot: 1 | 2 | 3 | 4;
  cssVar: string;
  hue: string;
  light: string;
  dark: string;
}

export const SERIES_SLOTS: SeriesSlot[] = [
  { slot: 1, cssVar: "--c-chart-series-1", hue: "orange", light: "#C2410C", dark: "#EA580C" },
  { slot: 2, cssVar: "--c-chart-series-2", hue: "blue", light: "#3861FB", dark: "#6188FF" },
  { slot: 3, cssVar: "--c-chart-series-3", hue: "teal", light: "#0F91A8", dark: "#0F91A8" },
  { slot: 4, cssVar: "--c-chart-series-4", hue: "purple", light: "#8A3FFC", dark: "#8A3FFC" },
];
