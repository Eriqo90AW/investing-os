/**
 * Fixtures for the composition / distribution charts.
 *
 * Unlike `market-data.ts` these are not generated — they are hand-set figures,
 * because every one of these forms is judged on whether its *shape* is right
 * (does the treemap square up, does the waterfall close on the total, do the
 * slices sum to 100), and a random walk can't guarantee that. Illustrative
 * numbers, not live ones.
 */

export interface Slice {
  label: string;
  value: number;
  /** Categorical slot 0–3, or `null` for the de-emphasised "Other" tail. */
  slot: number | null;
}

/**
 * Part-to-whole, four named holdings plus a tail. The system caps categorical
 * identity at four slots, so the fifth entry is not a fifth hue — it is the
 * absence of one, in the chromaless "other" token.
 */
export const SECTOR_MIX: Slice[] = [
  { label: "Technology", value: 38.4, slot: 0 },
  { label: "Financials", value: 24.1, slot: 1 },
  { label: "Healthcare", value: 16.2, slot: 2 },
  { label: "Energy", value: 12.7, slot: 3 },
  { label: "Other", value: 8.6, slot: null },
];

export interface ShareNode {
  label: string;
  ticker: string;
  /** Percent of the sector's total market cap. The set sums to 100. */
  share: number;
  cap: string;
  /** One-day change, percent. The treemap's second variable. */
  change: number;
}

/**
 * Market share of a sector, for the treemap. Deliberately top-heavy: one name
 * at 41% is the case the form exists to show, and it is the case a pie handles
 * worst.
 *
 * Two variables, because a treemap has two channels. Area carries `share`; hue
 * carries `change`. Colouring by `share` as well would spend the one free
 * channel restating what the tile sizes already say.
 */
export const MARKET_SHARE: ShareNode[] = [
  { label: "Nvidia", ticker: "NVDA", share: 41.2, cap: "$4.38T", change: 3.12 },
  { label: "Apple", ticker: "AAPL", share: 18.7, cap: "$1.99T", change: -0.74 },
  { label: "Microsoft", ticker: "MSFT", share: 14.3, cap: "$1.52T", change: 1.05 },
  { label: "Broadcom", ticker: "AVGO", share: 9.1, cap: "$968B", change: 4.38 },
  { label: "AMD", ticker: "AMD", share: 6.4, cap: "$681B", change: -2.91 },
  { label: "Qualcomm", ticker: "QCOM", share: 4.2, cap: "$447B", change: 0.42 },
  { label: "Arm", ticker: "ARM", share: 3.3, cap: "$351B", change: -4.16 },
  { label: "Micron", ticker: "MU", share: 2.8, cap: "$298B", change: 2.27 },
];

export interface Mover {
  label: string;
  ticker: string;
  change: number;
}

/** Ranked bars — sorted, diverging around zero, direction carried by the pair. */
export const MOVERS: Mover[] = [
  { label: "Nvidia", ticker: "NVDA", change: 8.42 },
  { label: "Broadcom", ticker: "AVGO", change: 5.18 },
  { label: "Apple", ticker: "AAPL", change: 3.07 },
  { label: "Microsoft", ticker: "MSFT", change: 1.24 },
  { label: "Qualcomm", ticker: "QCOM", change: -0.86 },
  { label: "Micron", ticker: "MU", change: -2.95 },
  { label: "Arm", ticker: "ARM", change: -4.63 },
  { label: "AMD", ticker: "AMD", change: -6.71 },
];

export interface StackRow {
  label: string;
  /** Four categorical slots plus the tail, each a percent; the row sums to 100. */
  parts: number[];
}

/** 100% stacked bars — composition drift across four quarters. */
export const ALLOCATION_BY_QUARTER: StackRow[] = [
  { label: "2025 Q4", parts: [28.0, 27.5, 19.2, 15.8, 9.5] },
  { label: "2026 Q1", parts: [31.6, 26.4, 18.1, 14.6, 9.3] },
  { label: "2026 Q2", parts: [35.2, 25.0, 17.0, 13.7, 9.1] },
  { label: "2026 Q3", parts: [38.4, 24.1, 16.2, 12.7, 8.6] },
];

export const ALLOCATION_PARTS = [
  "Technology",
  "Financials",
  "Healthcare",
  "Energy",
  "Other",
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface HeatRow {
  year: number;
  /** Monthly total return in percent; `null` for a month that hasn't closed. */
  months: (number | null)[];
}

/**
 * Month × year returns. Diverging, because the reader's question is "which way
 * and how far from zero", not "how much". 2026 is partial on purpose — an
 * unclosed month is a hole in the grid, never a zero.
 */
export const MONTHLY_RETURNS: HeatRow[] = [
  { year: 2022, months: [-5.3, -3.1, 3.6, -8.8, 0.2, -8.4, 9.1, -4.2, -9.3, 8.0, 5.4, -5.9] },
  { year: 2023, months: [6.2, -2.6, 3.5, 1.5, 0.4, 6.5, 3.1, -1.8, -4.9, -2.2, 8.9, 4.4] },
  { year: 2024, months: [1.6, 5.2, 3.1, -4.2, 4.8, 3.5, 1.1, 2.3, 2.0, -1.0, 5.7, -2.5] },
  { year: 2025, months: [2.7, -1.4, -5.8, -0.7, 6.1, 5.0, 2.2, 1.9, 3.4, 2.2, -3.0, 4.8] },
  { year: 2026, months: [4.1, 1.8, -2.2, 7.3, -1.1, 3.9, 2.6, -0.4, 5.2, null, null, null] },
];

export interface WaterfallStep {
  label: string;
  value: number;
  /** A running-total column rather than a delta — drawn from the baseline. */
  total?: boolean;
}

/**
 * Contribution to return. The bridge form: an opening total, signed deltas that
 * each start where the last one finished, and a closing total. The deltas sum
 * to the difference between the two totals, which is the whole point.
 */
export const ATTRIBUTION: WaterfallStep[] = [
  { label: "Opening NAV", value: 184.2, total: true },
  { label: "Technology", value: 22.6 },
  { label: "Financials", value: 8.1 },
  { label: "Healthcare", value: -3.4 },
  { label: "Energy", value: -6.2 },
  { label: "Fees", value: -1.9 },
  { label: "Closing NAV", value: 203.4, total: true },
];

export interface RiskPoint {
  label: string;
  ticker: string;
  /** Annualised volatility, percent. */
  risk: number;
  /** Annualised return, percent. */
  ret: number;
  slot: number | null;
}

/**
 * Risk against return. An all-pairs form, so the system's own ladder caps it at
 * three identities plus the de-emphasised field — a fourth colour here would be
 * legal on adjacent bars and is not legal on scattered dots.
 */
export const RISK_RETURN: RiskPoint[] = [
  { label: "Nvidia", ticker: "NVDA", risk: 44.2, ret: 61.3, slot: 0 },
  { label: "Apple", ticker: "AAPL", risk: 22.7, ret: 18.4, slot: 1 },
  { label: "Microsoft", ticker: "MSFT", risk: 20.1, ret: 21.9, slot: 2 },
  { label: "Broadcom", ticker: "AVGO", risk: 38.6, ret: 40.2, slot: null },
  { label: "AMD", ticker: "AMD", risk: 49.8, ret: 12.6, slot: null },
  { label: "Qualcomm", ticker: "QCOM", risk: 31.4, ret: 9.8, slot: null },
  { label: "Arm", ticker: "ARM", risk: 52.3, ret: 27.4, slot: null },
  { label: "Micron", ticker: "MU", risk: 46.1, ret: -4.2, slot: null },
  { label: "Texas Instr.", ticker: "TXN", risk: 24.9, ret: 6.1, slot: null },
  { label: "Intel", ticker: "INTC", risk: 35.2, ret: -11.7, slot: null },
  { label: "Analog Dev.", ticker: "ADI", risk: 26.3, ret: 13.5, slot: null },
  { label: "Marvell", ticker: "MRVL", risk: 47.7, ret: 19.2, slot: null },
];
