import type { Direction } from "./dashboard-data";
import { between, hashString, pick, rng } from "./random";
import { candles } from "./market-data";
import type { SetupUniverse, StoredSetup } from "./setups-store";

/**
 * Mock setup generator — the "agentic" composer is deterministic for now.
 *
 * Everything is derived from a hash of the prompt, so the same prompt always
 * drafts the same setup (SSR/hydration-safe and honest about being a mock).
 * A live model adapter can replace `generateSetupFromPrompt` alone; the form
 * and the store contracts do not change.
 */

const STOPWORDS = new Set([
  "LONG", "SHORT", "STOP", "LOSS", "TARGET", "ENTRY", "SETUP", "THE", "AND",
  "FOR", "WITH", "THIS", "THAT", "WATCH", "BUY", "SELL", "ON", "AT", "OF",
  "IN", "TO", "A", "AN", "USD", "RP", "IDR", "USDT", "PERP", "ETF", "IHSG",
  "IDX", "STOCK", "STOCKS", "CRYPTO", "ASSET", "ASSETS",
]);

/** Known IHSG tickers are four letters; best-effort universe detection. */
const IHSG_TICKERS = new Set([
  "BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "ASII", "ADRO", "PTBA", "ITMG",
  "UNVR", "ICBP", "INDF", "GGRM", "HMSP", "MEDC", "PGAS", "JSMR", "EXCL",
]);

const CRYPTO_TICKERS = new Set([
  "BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "AVAX", "LINK", "DOT",
]);

export function seedForTicker(ticker: string): number {
  return hashString(`chart:${ticker.toUpperCase()}`);
}

/** Deterministic candle series for a setup's chart preview. */
export function setupCandles(ticker: string, bars = 120) {
  const seed = seedForTicker(ticker);
  const rand = rng(seed ^ 0x5f356495);
  const base = Math.round(between(rand, 12, 640) * 100) / 100;
  return candles(bars, base, seed, between(rand, -0.001, 0.003), 0.02);
}

function detectTicker(prompt: string, rand: () => number): string {
  const words = prompt.toUpperCase().match(/\b[A-Z]{2,6}\b/g) ?? [];
  const candidates = words.filter(word => !STOPWORDS.has(word));
  const named = candidates.find(word => CRYPTO_TICKERS.has(word) || IHSG_TICKERS.has(word));
  const ticker = named ?? candidates[0];
  return ticker ?? pick(rand, ["NVDA", "BTC", "BBCA", "MSFT", "TLKM", "SOL"]);
}

function detectUniverse(ticker: string, prompt: string): SetupUniverse {
  const p = prompt.toLowerCase();
  if (p.includes("ihsg") || p.includes("indonesia") || p.includes("idx") || IHSG_TICKERS.has(ticker)) {
    return "ihsg";
  }
  if (p.includes("crypto") || p.includes("coin") || CRYPTO_TICKERS.has(ticker)) return "crypto";
  return "us";
}

const LONG_THESIS = [
  "Structure shifts up as price holds above the reclaimed range; demand keeps absorbing supply.",
  "Momentum confirms the breakout while breadth improves across the peer group.",
  "Highest-conviction name in its basket; trend intact until the invalidation level breaks.",
  "Breadth and flow agree with the technical trigger; size stays normal until continuation.",
];
const SHORT_THESIS = [
  "Failed breakout into a crowded side; downside follows as late longs unwind.",
  "Relative strength rolls over while the sector digests the last leg up.",
  "Exhaustion at resistance with deteriorating flow; risk stays defined above the high.",
  "Distribution pattern completes into a known catalyst; entry favours the retest.",
];

const CATALYSTS = [
  "Earnings release",
  "Macro print",
  "Sector rotation",
  "Product update",
  "Flow persistence",
  "Regulatory event",
  "Network upgrade",
];

const NAMES: Record<SetupUniverse, Record<string, string>> = {
  us: { NVDA: "Nvidia", MSFT: "Microsoft", AAPL: "Apple", AMD: "AMD", META: "Meta" },
  crypto: { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", XRP: "XRP", BNB: "BNB" },
  ihsg: { BBCA: "Bank Central Asia", BBRI: "Bank Rakyat Indonesia", TLKM: "Telkom Indonesia", ASII: "Astra International", ADRO: "Alamtri Resources" },
};

export function nameForTicker(ticker: string): string {
  for (const universeNames of Object.values(NAMES)) {
    const hit = universeNames[ticker];
    if (hit) return hit;
  }
  return ticker;
}

function emitenFor(ticker: string, universe: SetupUniverse): string {
  if (universe === "crypto") return `${nameForTicker(ticker)} network`;
  if (universe === "ihsg") return `PT ${nameForTicker(ticker)} Tbk`;
  return `${nameForTicker(ticker)}`;
}

/** Levels quoted in the instrument's native currency. */
function levelPrefix(universe: SetupUniverse): string {
  return universe === "ihsg" ? "Rp " : "$";
}

function fmt(n: number, prefix: string): string {
  return `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildLevels(rand: () => number, direction: Direction, prefix: string) {
  const entry = Math.round(between(rand, 14, 620) * 100) / 100;
  const riskPct = between(rand, 0.035, 0.075);
  const rr = between(rand, 1.8, 3.2);
  const stopFactor = direction === "long" ? 1 - riskPct : 1 + riskPct;
  const targetFactor = direction === "long" ? 1 + riskPct * rr : 1 - riskPct * rr;
  const stopLoss = Math.round(entry * stopFactor * 100) / 100;
  const target = Math.round(entry * targetFactor * 100) / 100;
  return {
    entry: fmt(entry, prefix),
    stopLoss: fmt(stopLoss, prefix),
    invalidation: fmt(stopLoss, prefix),
    target: fmt(target, prefix),
    riskReward: `${rr.toFixed(1)}R`,
  };
}

/**
 * Draft a full setup from free text. Deterministic: same prompt, same draft.
 */
export function generateSetupFromPrompt(prompt: string): Omit<StoredSetup, "id"> {
  const seed = hashString(`prompt:${prompt.trim().toLowerCase()}`);
  const rand = rng(seed);

  const direction: Direction = /\b(short|bearish|sell|downside)\b/i.test(prompt) ? "short" : "long";
  const ticker = detectTicker(prompt, rand);
  const universe = detectUniverse(ticker, prompt);
  const levels = buildLevels(rand, direction, levelPrefix(universe));
  const spark = buildSpark(rand);

  const thesis = pick(rand, direction === "long" ? LONG_THESIS : SHORT_THESIS);

  return {
    symbol: ticker,
    name: nameForTicker(ticker),
    emiten: emitenFor(ticker, universe),
    universe,
    direction,
    status: "watching",
    score: Math.round(between(rand, 58, 94)),
    thesis,
    catalyst: pick(rand, CATALYSTS),
    updated: "Just now",
    ...levels,
    spark,
  };
}

export function buildSpark(rand: () => number): number[] {
  const rising = rand() >= 0.4;
  const out: number[] = [];
  let v = 0.5;
  for (let i = 0; i < 14; i++) {
    v += (rand() - 0.5) * 0.2 + (rising ? 0.034 : -0.034);
    out.push(v);
  }
  const min = Math.min(...out);
  const max = Math.max(...out);
  const span = max - min || 1;
  return out.map(n => (n - min) / span);
}
