/**
 * Deterministic sample market data.
 *
 * Every series is generated from a fixed seed so the SSR pass and the client
 * hydration pass produce byte-identical numbers — a Math.random() series would
 * mismatch on hydration and flicker. These are illustrative figures for layout
 * and chart specs, not live prices.
 */

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Bar {
  time: string;
  value: number;
  color?: string;
}

export interface Point {
  time: string;
  value: number;
}

/** mulberry32 — small, fast, fully deterministic. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const END = Date.UTC(2026, 8, 19); // 2026-09-19
const DAY = 86_400_000;

function dayString(offsetFromEnd: number): string {
  const d = new Date(END - offsetFromEnd * DAY);
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

/** A geometric random walk with mild mean reversion, so it reads like a chart. */
function walk(
  bars: number,
  start: number,
  seed: number,
  drift = 0.0008,
  vol = 0.022,
): number[] {
  const rand = rng(seed);
  const out: number[] = [];
  let price = start;
  for (let i = 0; i < bars; i++) {
    const shock = (rand() + rand() + rand() - 1.5) * vol; // ~gaussian
    const pull = (start * Math.exp(drift * i) - price) / price * 0.05;
    price = Math.max(price * (1 + drift + shock + pull), start * 0.25);
    out.push(price);
  }
  return out;
}

export function candles(
  bars: number,
  start: number,
  seed: number,
  drift?: number,
  vol?: number,
): Candle[] {
  const closes = walk(bars, start, seed, drift, vol);
  const rand = rng(seed ^ 0x9e3779b9);
  return closes.map((close, i) => {
    const open = i === 0 ? start : closes[i - 1]!;
    const spread = Math.abs(close - open) + close * (0.004 + rand() * 0.012);
    const high = Math.max(open, close) + spread * rand() * 0.8;
    const low = Math.min(open, close) - spread * rand() * 0.8;
    return {
      time: dayString(bars - 1 - i),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
    };
  });
}

function round(n: number): number {
  if (n >= 1000) return Math.round(n * 100) / 100;
  if (n >= 1) return Math.round(n * 10000) / 10000;
  return Math.round(n * 1e6) / 1e6;
}

/** Volume keyed to the candle's own direction, so bars agree with the price. */
export function volumes(source: Candle[], base: number, seed: number): Bar[] {
  const rand = rng(seed);
  return source.map(c => {
    const move = Math.abs(c.close - c.open) / c.open;
    return {
      time: c.time,
      value: Math.round(base * (0.55 + rand() * 0.7 + move * 14)),
    };
  });
}

export function lineFrom(source: Candle[]): Point[] {
  return source.map(c => ({ time: c.time, value: c.close }));
}

/** Rebase a series to 100 at its first bar — the honest alternative to a second y-axis. */
export function indexed(source: Candle[]): Point[] {
  const base = source[0]?.close ?? 1;
  return source.map(c => ({ time: c.time, value: round((c.close / base) * 100) }));
}

// --------------------------------------------------------------------------
// The actual fixtures the page renders.
// --------------------------------------------------------------------------

export const BTC_CANDLES = candles(180, 68_400, 20260919, 0.0026, 0.021);
export const BTC_VOLUME = volumes(BTC_CANDLES, 34_000_000_000, 77);

export const ETH_CANDLES = candles(180, 2_640, 4242, 0.0024, 0.026);
export const SOL_CANDLES = candles(180, 148, 909, 0.0022, 0.034);
export const XRP_CANDLES = candles(180, 1.92, 5150, 0.0027, 0.03);

/** Four assets rebased to 100 — one scale, one axis, four comparable lines. */
export const COMPARISON = {
  BTC: indexed(BTC_CANDLES),
  ETH: indexed(ETH_CANDLES),
  SOL: indexed(SOL_CANDLES),
  XRP: indexed(XRP_CANDLES),
};

/** Portfolio net asset value — a single series, so no legend is needed. */
export const PORTFOLIO: Point[] = (() => {
  const base = candles(180, 184_200, 31337, 0.0019, 0.014);
  return base.map(c => ({ time: c.time, value: Math.round(c.close) }));
})();

/** Unrealised P&L against cost basis — genuinely diverging around zero. */
export const PNL: Point[] = (() => {
  const rand = rng(8675309);
  const out: Point[] = [];
  let v = -4_200;
  for (let i = 0; i < 180; i++) {
    v += (rand() + rand() - 1) * 2_400 + 118;
    out.push({ time: dayString(179 - i), value: Math.round(v) });
  }
  return out;
})();

export const PNL_BASELINE = 0;

// --------------------------------------------------------------------------
// Market table
// --------------------------------------------------------------------------

export interface MarketRow {
  rank: number;
  name: string;
  ticker: string;
  brand: string;
  price: string;
  h1: number;
  h24: number;
  d7: number;
  marketCap: string;
  volume: string;
  volumeCoin: string;
  supply: string;
  spark: number[];
}

/** 14-point 7-day closes, normalised 0..1, for the row sparklines. */
function spark(seed: number, rising: boolean): number[] {
  const rand = rng(seed);
  const raw: number[] = [];
  let v = 0.5;
  for (let i = 0; i < 14; i++) {
    v += (rand() - 0.5) * 0.22 + (rising ? 0.032 : -0.032);
    raw.push(v);
  }
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const span = max - min || 1;
  return raw.map(n => (n - min) / span);
}

export const MARKET_ROWS: MarketRow[] = [
  {
    rank: 1, name: "Bitcoin", ticker: "BTC", brand: "#F7931A",
    price: "$109,482.31", h1: 0.12, h24: 2.41, d7: -1.08,
    marketCap: "$2,183,940,112,004", volume: "$48,210,773,921", volumeCoin: "440,352 BTC",
    supply: "19,940,012 BTC", spark: spark(1, false),
  },
  {
    rank: 2, name: "Ethereum", ticker: "ETH", brand: "#627EEA",
    price: "$4,012.77", h1: 0.35, h24: 3.18, d7: 5.42,
    marketCap: "$483,210,441,290", volume: "$27,884,012,553", volumeCoin: "6,948,104 ETH",
    supply: "120,712,884 ETH", spark: spark(2, true),
  },
  {
    rank: 3, name: "Tether", ticker: "USDT", brand: "#26A17B",
    price: "$1.0001", h1: 0.01, h24: -0.02, d7: 0.0,
    marketCap: "$172,004,882,119", volume: "$92,441,002,883", volumeCoin: "92,431,760 USDT",
    supply: "171,987,004,112 USDT", spark: spark(3, true),
  },
  {
    rank: 4, name: "XRP", ticker: "XRP", brand: "#5A6A78",
    price: "$2.8734", h1: -0.41, h24: 1.92, d7: 8.77,
    marketCap: "$171,882,004,551", volume: "$6,220,884,331", volumeCoin: "2,165,041,882 XRP",
    supply: "59,818,004,229 XRP", spark: spark(4, true),
  },
  {
    rank: 5, name: "BNB", ticker: "BNB", brand: "#F3BA2F",
    price: "$944.12", h1: 0.08, h24: -0.64, d7: 2.15,
    marketCap: "$131,447,229,881", volume: "$2,884,119,002", volumeCoin: "3,055,038 BNB",
    supply: "139,221,447 BNB", spark: spark(5, true),
  },
  {
    rank: 6, name: "Solana", ticker: "SOL", brand: "#9945FF",
    price: "$221.48", h1: 0.52, h24: 4.07, d7: -3.29,
    marketCap: "$120,338,774,210", volume: "$7,004,556,120", volumeCoin: "31,626,112 SOL",
    supply: "543,322,004 SOL", spark: spark(6, false),
  },
];
