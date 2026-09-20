import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import type { Direction, InvestmentSetup, SetupStatus } from "./dashboard-data";
import { rng } from "./random";

/**
 * Single source of truth for tracked setups.
 *
 * The dashboard Alpha board, the setup workspace (`/setups`), and the
 * screener's "save as setup" hand-off all read and write this store. The
 * expanded type is the future adapter contract: a live backend can serve this
 * exact shape without touching the component tree.
 *
 * Persistence is localStorage under `ios-setups`, loaded once per page mount.
 * An absent key means "first visit — show the seed fixtures"; an explicit `[]`
 * means the user cleared the board, and stays empty.
 */

export type SetupUniverse = "us" | "crypto" | "ihsg";

export interface StoredSetup extends InvestmentSetup {
  /** Drafts may be incomplete until the user promotes them to tracked. */
  lifecycle?: "draft" | "tracked";
  /** Issuer / company name behind the ticker (the "emiten"). */
  emiten: string;
  universe: SetupUniverse;
  stopLoss: string;
  /** 14-point normalised trend for the row sparkline (0..1), seeded. */
  spark: number[];
  notes?: string;
}

export const SETUP_UNIVERSES: Array<{ id: SetupUniverse; label: string }> = [
  { id: "us", label: "US stocks" },
  { id: "crypto", label: "Cryptocurrencies" },
  { id: "ihsg", label: "IHSG (IDX)" },
];

export const SETUP_STATUSES: SetupStatus[] = ["watching", "ready", "active", "won", "lost"];

/** Badge ink/fill pair per status — shared by the dashboard and the workspace. */
export function statusClasses(status: SetupStatus): string {
  if (status === "won") return "bg-pos-bg text-pos";
  if (status === "lost") return "bg-neg-bg text-neg";
  if (status === "active") return "bg-official-bg text-official";
  if (status === "ready") return "bg-reminder-bg text-reminder";
  return "bg-noaccess-bg text-noaccess";
}

/** Direction ink — the glyph, not the color, carries the meaning (▲ / ▼). */
export function directionGlyph(direction: Direction): string {
  return direction === "long" ? "▲" : "▼";
}

// ---------------------------------------------------------------------------
// Seed fixtures — the five setups the dashboard already shipped, extended.
// ---------------------------------------------------------------------------

const SEED_RAND = rng(20260920);

function seedSpark(seed: number, rising: boolean): number[] {
  const rand = rng(seed);
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

export const SEED_SETUPS: StoredSetup[] = [
  {
    id: "setup-nvda",
    symbol: "NVDA",
    name: "Nvidia",
    emiten: "NVIDIA Corporation",
    universe: "us",
    direction: "long",
    status: "ready",
    score: 92,
    thesis: "AI capex remains firm while price reclaims the 20-day range.",
    entry: "$176.20–178.00",
    invalidation: "$169.40",
    stopLoss: "$169.40",
    target: "$196.00",
    riskReward: "2.7R",
    catalyst: "GTC product update",
    updated: "12m ago",
    spark: seedSpark(11, true),
  },
  {
    id: "setup-btc",
    symbol: "BTC",
    name: "Bitcoin",
    emiten: "Bitcoin network",
    universe: "crypto",
    direction: "long",
    status: "active",
    score: 88,
    thesis: "Spot demand is absorbing supply above the prior weekly high.",
    entry: "$106.8K",
    invalidation: "$101.9K",
    stopLoss: "$101.9K",
    target: "$121.0K",
    riskReward: "2.9R",
    catalyst: "ETF flow persistence",
    updated: "28m ago",
    spark: seedSpark(12, true),
  },
  {
    id: "setup-tsla",
    symbol: "TSLA",
    name: "Tesla",
    emiten: "Tesla, Inc.",
    universe: "us",
    direction: "short",
    status: "watching",
    score: 76,
    thesis: "Failed breakout meets a crowded options position into deliveries.",
    entry: "$428.00–432.00",
    invalidation: "$441.50",
    stopLoss: "$441.50",
    target: "$391.00",
    riskReward: "2.5R",
    catalyst: "Quarterly deliveries",
    updated: "1h ago",
    spark: seedSpark(13, false),
  },
  {
    id: "setup-bbca",
    symbol: "BBCA",
    name: "Bank Central Asia",
    emiten: "PT Bank Central Asia Tbk",
    universe: "ihsg",
    direction: "long",
    status: "ready",
    score: 81,
    thesis: "Net interest margin stabilises while the sector re-rates off the rupiah.",
    entry: "Rp 9,150–9,250",
    invalidation: "Rp 8,775",
    stopLoss: "Rp 8,775",
    target: "Rp 10,300",
    riskReward: "2.3R",
    catalyst: "Q3 earnings release",
    updated: "3h ago",
    spark: seedSpark(14, true),
  },
  {
    id: "setup-eth",
    symbol: "ETH",
    name: "Ethereum",
    emiten: "Ethereum network",
    universe: "crypto",
    direction: "long",
    status: "won",
    score: 84,
    thesis: "Relative strength improved after the staking queue normalized.",
    entry: "$3,780",
    invalidation: "$3,590",
    stopLoss: "$3,590",
    target: "$4,180",
    riskReward: "+2.1R",
    catalyst: "Network upgrade",
    updated: "Yesterday",
    spark: seedSpark(15, true),
  },
  {
    id: "setup-xau",
    symbol: "XAU",
    name: "Gold",
    emiten: "Spot gold (XAU/USD)",
    universe: "us",
    direction: "long",
    status: "lost",
    score: 69,
    thesis: "Real yields were expected to roll over after the inflation print.",
    entry: "$3,645",
    invalidation: "$3,598",
    stopLoss: "$3,598",
    target: "$3,740",
    riskReward: "-1.0R",
    catalyst: "US CPI",
    updated: "2d ago",
    spark: seedSpark(16, false),
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const STORAGE_KEY = "ios-setups";

const [setupsSignal, setSetupsSignal] = createSignal<StoredSetup[]>(SEED_SETUPS);
let hydrated = false;

function persist(): void {
  if (!hydrated) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setupsSignal()));
  } catch {
    /* private window, blocked storage — the session keeps the state */
  }
}

/** Call once from the page root (all of them — the signal is module-global). */
export function initSetupsStore(): void {
  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSetupsSignal(parsed.filter(item => isStoredSetup(item)));
        }
      }
    } catch {
      /* corrupted value — fall back to the seed fixtures */
    }
    hydrated = true;
    onCleanup(() => {
      hydrated = false;
    });
  });
}

function isStoredSetup(value: unknown): value is StoredSetup {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.symbol === "string";
}

export const setups = setupsSignal;

export function addSetup(setup: StoredSetup): void {
  setSetupsSignal(current => [setup, ...current]);
  persist();
}

export function buildDraftSetup(symbol = ""): StoredSetup {
  const clean = symbol.trim().toUpperCase();
  return {
    id: "",
    symbol: clean,
    name: clean,
    emiten: "",
    universe: clean === "BTC" || clean === "ETH" || clean === "SOL" ? "crypto" : "us",
    direction: "long",
    status: "watching",
    lifecycle: "draft",
    score: 0,
    thesis: "",
    entry: "",
    invalidation: "",
    stopLoss: "",
    target: "",
    riskReward: "",
    catalyst: "",
    updated: "Just now",
    spark: clean ? seedSpark(clean.length * 17, true) : Array.from({ length: 14 }, () => 0.5),
  };
}

export function updateSetup(id: string, patch: Partial<Omit<StoredSetup, "id">>): void {
  setSetupsSignal(current =>
    current.map(item => (item.id === id ? { ...item, ...patch, id } : item)),
  );
  persist();
}

export function removeSetup(id: string): void {
  setSetupsSignal(current => current.filter(item => item.id !== id));
  persist();
}

export function getSetup(id: string): StoredSetup | undefined {
  return setupsSignal().find(item => item.id === id);
}

export function newSetupId(symbol: string): string {
  return `setup-${symbol.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`;
}

/** Empty check against an explicitly cleared board (distinct from "absent"). */
export const boardCleared = (): boolean => hydrated && setupsSignal().length === 0;
