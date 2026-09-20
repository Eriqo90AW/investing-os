import { buildSpark } from "./setup-generator";
import { between, rng } from "./random";

/**
 * Quant screener fixtures for the three natively supported universes:
 * US stocks, cryptocurrencies, and Indonesian equities (IHSG).
 *
 * Everything is deterministic — hand-set identity data, seeded numeric series
 * — so the SSR pass and hydration agree and every revisit shows the same
 * screen. P/E and related fundamentals are null where they do not apply
 * (most crypto rows); the UI renders "—", never 0.
 */

export type Universe = "us" | "crypto" | "ihsg";

export interface UniverseMeta {
  id: Universe;
  label: string;
  blurb: string;
}

export const UNIVERSES: UniverseMeta[] = [
  { id: "us", label: "US stocks", blurb: "Large and mega caps, fundamentals-weighted score." },
  { id: "crypto", label: "Cryptocurrencies", blurb: "Liquid majors, momentum and flow-weighted score." },
  { id: "ihsg", label: "IHSG", blurb: "IDX constituents, liquidity and value-weighted score." },
];

export interface ScreenerRow {
  symbol: string;
  /** Issuer / network name (the emiten). */
  name: string;
  universe: Universe;
  price: string;
  chg1d: number;
  chg7d: number;
  chg1m: number;
  marketCap: string;
  volume: string;
  /** Fundamentals — null where not applicable (most crypto rows). */
  pe: number | null;
  epsGrowth: number | null;
  revenueGrowth: number | null;
  netMargin: number | null;
  debtEquity: number | null;
  /** Technicals. */
  rsi14: number;
  /** Percent vs the 50-day moving average (>0 means above). */
  sma50Pos: number;
  momentum3m: number;
  vol30d: number;
  /** Composite quant score, 0–100. */
  quantScore: number;
  tags: string[];
  spark: number[];
}

// ---------------------------------------------------------------------------
// Hand-set identity rows; numerics get a seeded, realistic-looking overlay.
// ---------------------------------------------------------------------------

interface RowSeed {
  symbol: string;
  name: string;
  universe: Universe;
  price: number;
  currency: "$" | "Rp";
  marketCap: string;
  volume: string;
  pe: number | null;
  epsGrowth: number | null;
  revenueGrowth: number | null;
  netMargin: number | null;
  debtEquity: number | null;
  vol30d: number;
  tags: string[];
}

const ROW_SEEDS: RowSeed[] = [
  // --- US stocks ----------------------------------------------------------
  { symbol: "NVDA", name: "NVIDIA Corporation", universe: "us", price: 177.4, currency: "$", marketCap: "$4.33T", volume: "$32.1B", pe: 52.1, epsGrowth: 54.2, revenueGrowth: 62.4, netMargin: 48.7, debtEquity: 0.22, vol30d: 2.9, tags: ["momentum", "quality"] },
  { symbol: "MSFT", name: "Microsoft Corporation", universe: "us", price: 512.8, currency: "$", marketCap: "$3.81T", volume: "$18.4B", pe: 33.8, epsGrowth: 12.4, revenueGrowth: 15.1, netMargin: 35.8, debtEquity: 0.38, vol30d: 1.6, tags: ["quality", "value"] },
  { symbol: "AAPL", name: "Apple Inc.", universe: "us", price: 246.3, currency: "$", marketCap: "$3.66T", volume: "$14.2B", pe: 35.6, epsGrowth: 8.4, revenueGrowth: 6.2, netMargin: 25.4, debtEquity: 1.42, vol30d: 1.4, tags: ["quality"] },
  { symbol: "AMD", name: "Advanced Micro Devices", universe: "us", price: 168.9, currency: "$", marketCap: "$274.1B", volume: "$9.8B", pe: 47.3, epsGrowth: 38.6, revenueGrowth: 24.7, netMargin: 12.1, debtEquity: 0.09, vol30d: 3.4, tags: ["momentum", "breakout"] },
  { symbol: "META", name: "Meta Platforms", universe: "us", price: 704.2, currency: "$", marketCap: "$1.78T", volume: "$11.9B", pe: 27.4, epsGrowth: 18.9, revenueGrowth: 19.2, netMargin: 29.8, debtEquity: 0.31, vol30d: 2.1, tags: ["momentum", "quality"] },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", universe: "us", price: 298.6, currency: "$", marketCap: "$835.4B", volume: "$6.8B", pe: 13.9, epsGrowth: 9.8, revenueGrowth: 7.4, netMargin: 33.1, debtEquity: 1.24, vol30d: 1.3, tags: ["value", "quality"] },
  { symbol: "XOM", name: "Exxon Mobil Corporation", universe: "us", price: 118.4, currency: "$", marketCap: "$506.2B", volume: "$4.9B", pe: 14.7, epsGrowth: -4.2, revenueGrowth: -2.8, netMargin: 10.4, debtEquity: 0.19, vol30d: 1.5, tags: ["value"] },
  { symbol: "TSLA", name: "Tesla, Inc.", universe: "us", price: 431.7, currency: "$", marketCap: "$1.38T", volume: "$21.3B", pe: 186.4, epsGrowth: 6.1, revenueGrowth: 2.4, netMargin: 8.9, debtEquity: 0.18, vol30d: 3.6, tags: ["momentum", "breakout"] },
  { symbol: "UNH", name: "UnitedHealth Group", universe: "us", price: 312.4, currency: "$", marketCap: "$289.1B", volume: "$3.2B", pe: 16.8, epsGrowth: -8.9, revenueGrowth: 6.8, netMargin: 4.2, debtEquity: 0.71, vol30d: 2.4, tags: ["value", "mean-reversion"] },
  { symbol: "COST", name: "Costco Wholesale", universe: "us", price: 921.6, currency: "$", marketCap: "$408.4B", volume: "$2.9B", pe: 51.2, epsGrowth: 11.2, revenueGrowth: 7.1, netMargin: 2.9, debtEquity: 0.33, vol30d: 1.2, tags: ["quality"] },
  { symbol: "AVGO", name: "Broadcom Inc.", universe: "us", price: 338.1, currency: "$", marketCap: "$1.59T", volume: "$8.6B", pe: 41.9, epsGrowth: 29.7, revenueGrowth: 27.4, netMargin: 29.2, debtEquity: 0.86, vol30d: 2.7, tags: ["momentum", "quality"] },
  { symbol: "PEP", name: "PepsiCo, Inc.", universe: "us", price: 146.2, currency: "$", marketCap: "$200.1B", volume: "$3.4B", pe: 22.4, epsGrowth: 1.9, revenueGrowth: 1.2, netMargin: 10.1, debtEquity: 2.06, vol30d: 1.1, tags: ["value", "mean-reversion"] },

  // --- Crypto ---------------------------------------------------------------
  { symbol: "BTC", name: "Bitcoin", universe: "crypto", price: 109482.31, currency: "$", marketCap: "$2.18T", volume: "$48.2B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 2.8, tags: ["momentum", "breakout"] },
  { symbol: "ETH", name: "Ethereum", universe: "crypto", price: 4012.77, currency: "$", marketCap: "$483.2B", volume: "$27.9B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 3.4, tags: ["momentum"] },
  { symbol: "SOL", name: "Solana", universe: "crypto", price: 221.48, currency: "$", marketCap: "$120.3B", volume: "$7.0B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 4.6, tags: ["momentum", "breakout"] },
  { symbol: "XRP", name: "XRP", universe: "crypto", price: 2.8734, currency: "$", marketCap: "$171.9B", volume: "$6.2B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 4.1, tags: ["momentum"] },
  { symbol: "BNB", name: "BNB", universe: "crypto", price: 944.12, currency: "$", marketCap: "$131.4B", volume: "$2.9B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 3.2, tags: ["quality"] },
  { symbol: "ADA", name: "Cardano", universe: "crypto", price: 0.8421, currency: "$", marketCap: "$29.8B", volume: "$1.4B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 5.0, tags: ["mean-reversion"] },
  { symbol: "LINK", name: "Chainlink", universe: "crypto", price: 24.68, currency: "$", marketCap: "$16.2B", volume: "$1.1B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 4.8, tags: ["breakout"] },
  { symbol: "DOGE", name: "Dogecoin", universe: "crypto", price: 0.2117, currency: "$", marketCap: "$31.2B", volume: "$2.4B", pe: null, epsGrowth: null, revenueGrowth: null, netMargin: null, debtEquity: null, vol30d: 5.6, tags: ["momentum"] },

  // --- IHSG -----------------------------------------------------------------
  { symbol: "BBCA", name: "Bank Central Asia", universe: "ihsg", price: 9210, currency: "Rp", marketCap: "Rp 1,142T", volume: "Rp 1.8T", pe: 22.1, epsGrowth: 8.4, revenueGrowth: 9.6, netMargin: 36.2, debtEquity: 0.41, vol30d: 1.4, tags: ["quality", "value"] },
  { symbol: "BBRI", name: "Bank Rakyat Indonesia", universe: "ihsg", price: 4180, currency: "Rp", marketCap: "Rp 634.1T", volume: "Rp 1.2T", pe: 10.8, epsGrowth: 6.2, revenueGrowth: 7.8, netMargin: 28.4, debtEquity: 0.61, vol30d: 1.7, tags: ["value"] },
  { symbol: "BMRI", name: "Bank Negara Indonesia", universe: "ihsg", price: 5425, currency: "Rp", marketCap: "Rp 322.4T", volume: "Rp 0.9T", pe: 12.4, epsGrowth: 9.1, revenueGrowth: 8.9, netMargin: 26.1, debtEquity: 0.58, vol30d: 1.8, tags: ["value"] },
  { symbol: "TLKM", name: "Telkom Indonesia", universe: "ihsg", price: 3010, currency: "Rp", marketCap: "Rp 297.6T", volume: "Rp 0.7T", pe: 14.6, epsGrowth: -2.4, revenueGrowth: 1.1, netMargin: 14.8, debtEquity: 0.49, vol30d: 1.6, tags: ["mean-reversion"] },
  { symbol: "ASII", name: "Astra International", universe: "ihsg", price: 5475, currency: "Rp", marketCap: "Rp 221.3T", volume: "Rp 0.7T", pe: 9.2, epsGrowth: 4.8, revenueGrowth: 6.4, netMargin: 9.1, debtEquity: 0.27, vol30d: 1.9, tags: ["value"] },
  { symbol: "ADRO", name: "Alamtri Resources", universe: "ihsg", price: 2450, currency: "Rp", marketCap: "Rp 76.4T", volume: "Rp 0.6T", pe: 6.8, epsGrowth: -6.1, revenueGrowth: -3.9, netMargin: 24.6, debtEquity: 0.22, vol30d: 2.3, tags: ["value"] },
  { symbol: "MEDC", name: "Medco Energi Internasional", universe: "ihsg", price: 1385, currency: "Rp", marketCap: "Rp 27.1T", volume: "Rp 0.3T", pe: 9.4, epsGrowth: 12.6, revenueGrowth: 18.4, netMargin: 17.2, debtEquity: 0.44, vol30d: 2.6, tags: ["breakout", "momentum"] },
  { symbol: "AMRT", name: "Sumber Alfaria Trijaya", universe: "ihsg", price: 2780, currency: "Rp", marketCap: "Rp 114.6T", volume: "Rp 0.4T", pe: 29.8, epsGrowth: 14.2, revenueGrowth: 12.8, netMargin: 4.6, debtEquity: 0.81, vol30d: 1.6, tags: ["quality"] },
  { symbol: "ICBP", name: "Indofood CBP Sukses Makmur", universe: "ihsg", price: 11650, currency: "Rp", marketCap: "Rp 135.9T", volume: "Rp 0.3T", pe: 26.4, epsGrowth: 9.4, revenueGrowth: 8.1, netMargin: 11.2, debtEquity: 0.52, vol30d: 1.4, tags: ["quality"] },
  { symbol: "PTBA", name: "Bukit Asam", universe: "ihsg", price: 2620, currency: "Rp", marketCap: "Rp 27.4T", volume: "Rp 0.2T", pe: 5.9, epsGrowth: -9.8, revenueGrowth: -6.4, netMargin: 31.8, debtEquity: 0.19, vol30d: 2.1, tags: ["value"] },
  { symbol: "GGRM", name: "Gudang Garam", universe: "ihsg", price: 515, currency: "Rp", marketCap: "Rp 9.7T", volume: "Rp 0.1T", pe: 61.2, epsGrowth: -18.4, revenueGrowth: -9.1, netMargin: 3.2, debtEquity: 1.16, vol30d: 2.8, tags: ["mean-reversion"] },
  { symbol: "JSMR", name: "Jasa Marga", universe: "ihsg", price: 4620, currency: "Rp", marketCap: "Rp 29.3T", volume: "Rp 0.2T", pe: 13.1, epsGrowth: 16.8, revenueGrowth: 11.2, netMargin: 18.6, debtEquity: 0.94, vol30d: 2.0, tags: ["breakout"] },
];

// ---------------------------------------------------------------------------
// Derive the deterministic technical columns and the composite quant score.
// ---------------------------------------------------------------------------

function priceLabel(seed: RowSeed, price: number): string {
  const decimals = price >= 10000 ? 0 : price >= 100 ? 2 : 4;
  const formatted = price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${seed.currency}${formatted}`;
}

export const SCREENER_ROWS: ScreenerRow[] = ROW_SEEDS.map((seed, index) => {
  const r = rng(971 + index * 7919);
  const chg1d = between(r, -3.2, 3.4);
  const chg7d = chg1d + between(r, -6.5, 7.5);
  const chg1m = chg7d + between(r, -9.0, 12.0);
  const rsi14 = Math.max(12, Math.min(88, 50 + chg1m * 2.4 + between(r, -14, 14)));
  const sma50Pos = Math.max(-14, Math.min(22, chg1m * 0.9 + between(r, -3.5, 3.5)));
  const momentum3m = chg1m + between(r, -6.0, 14.0);

  const tags = seed.tags;
  const momentumPoints = (chg1m > 5 ? 1 : 0) + (sma50Pos > 0 ? 1 : 0) + (momentum3m > 8 ? 1 : 0);
  const valuePoints =
    seed.pe !== null
      ? (seed.pe < 20 ? 1 : 0) + (seed.epsGrowth !== null && seed.epsGrowth > 8 ? 1 : 0) +
        (seed.debtEquity !== null && seed.debtEquity < 1 ? 1 : 0)
      : 0;
  const qualityPoints =
    seed.pe !== null
      ? (seed.netMargin !== null && seed.netMargin > 15 ? 1 : 0) + (seed.vol30d < 2 ? 1 : 0)
      : rsi14 > 45 && rsi14 < 72
        ? 1
        : 0;

  const quantScore = Math.max(
    8,
    Math.min(
      99,
      Math.round(34 + momentumPoints * 9 + valuePoints * 8 + qualityPoints * 7 + between(r, -6, 6)),
    ),
  );

  return {
    symbol: seed.symbol,
    name: seed.name,
    universe: seed.universe,
    price: priceLabel(seed, seed.price),
    chg1d: Math.round(chg1d * 100) / 100,
    chg7d: Math.round(chg7d * 100) / 100,
    chg1m: Math.round(chg1m * 100) / 100,
    marketCap: seed.marketCap,
    volume: seed.volume,
    pe: seed.pe === null ? null : Math.round(seed.pe * 10) / 10,
    epsGrowth: seed.epsGrowth === null ? null : Math.round(seed.epsGrowth * 10) / 10,
    revenueGrowth: seed.revenueGrowth === null ? null : Math.round(seed.revenueGrowth * 10) / 10,
    netMargin: seed.netMargin === null ? null : Math.round(seed.netMargin * 10) / 10,
    debtEquity: seed.debtEquity === null ? null : Math.round(seed.debtEquity * 100) / 100,
    rsi14: Math.round(rsi14),
    sma50Pos: Math.round(sma50Pos * 10) / 10,
    momentum3m: Math.round(momentum3m * 10) / 10,
    vol30d: Math.round(seed.vol30d * 10) / 10,
    quantScore,
    tags,
    spark: buildSpark(r),
  };
});

// ---------------------------------------------------------------------------
// Preset quant screens — named rule bundles the UI AND-combines.
// ---------------------------------------------------------------------------

export interface QuantPreset {
  id: string;
  label: string;
  description: string;
  appliesTo: Universe[];
  test: (row: ScreenerRow) => boolean;
}

export const QUANT_PRESETS: QuantPreset[] = [
  {
    id: "momentum-breakout",
    label: "Momentum breakout",
    description: "1-month change above +5%, trading above the 50-day, RSI 50–72.",
    appliesTo: ["us", "crypto", "ihsg"],
    test: row => row.chg1m > 5 && row.sma50Pos > 0 && row.rsi14 >= 50 && row.rsi14 <= 70,
  },
  {
    id: "oversold",
    label: "Oversold mean-reversion",
    description: "RSI(14) below 35 with the price under the 50-day average.",
    appliesTo: ["us", "crypto", "ihsg"],
    test: row => row.rsi14 < 35 && row.sma50Pos < 0,
  },
  {
    id: "quality-value",
    label: "Quality value",
    description: "P/E under 25, EPS still growing, leverage below 1× equity.",
    appliesTo: ["us", "ihsg"],
    test: row =>
      row.pe !== null &&
      row.pe < 25 &&
      row.epsGrowth !== null &&
      row.epsGrowth > 5 &&
      row.debtEquity !== null &&
      row.debtEquity < 1,
  },
  {
    id: "trend-crypto",
    label: "Crypto trend",
    description: "Positive 7-day and 3-month momentum on liquid majors.",
    appliesTo: ["crypto"],
    test: row => row.chg7d > 0 && row.momentum3m > 8,
  },
  {
    id: "low-vol",
    label: "Low-volatility carry",
    description: "30-day realised volatility under 1.7%.",
    appliesTo: ["us", "ihsg"],
    test: row => row.vol30d < 1.7,
  },
];

export function universeMeta(id: Universe): UniverseMeta {
  const hit = UNIVERSES.find(u => u.id === id);
  if (!hit) throw new Error(`unknown universe: ${id}`);
  return hit;
}
