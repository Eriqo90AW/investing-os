import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import type { TradeRecord, TradeReview } from "./investing-types";

const STORAGE_KEY = "ios-trades";
const STORAGE_VERSION = 1;

const SEED_TRADES: TradeRecord[] = [
  {
    id: "trade-eth-1",
    setupId: "setup-eth",
    symbol: "ETH",
    universe: "crypto",
    direction: "long",
    currency: "USD",
    strategy: "Momentum continuation",
    status: "closed",
    initialRiskAmount: 380,
    plannedStop: 3590,
    fills: [
      { id: "fill-eth-e1", side: "entry", executedAt: "2026-09-11T02:15:00.000Z", price: 3780, quantity: 2, fee: 7.56, feeCurrency: "USD" },
      { id: "fill-eth-x1", side: "exit", executedAt: "2026-09-15T05:30:00.000Z", price: 4100, quantity: 1, fee: 4.1, feeCurrency: "USD" },
      { id: "fill-eth-x2", side: "exit", executedAt: "2026-09-17T04:10:00.000Z", price: 4180, quantity: 1, fee: 4.18, feeCurrency: "USD" },
    ],
    exitReason: "Target reached after a partial exit.",
    notes: "Held the second half while relative strength stayed intact.",
    review: {
      reviewedAt: "2026-09-17T09:00:00.000Z",
      followedThesis: true,
      respectedRisk: true,
      worked: "The planned entry and partial exit reduced pressure.",
      failed: "The first exit was slightly early.",
      lesson: "Keep the second target tied to the setup, not the intraday noise.",
    },
    createdAt: "2026-09-11T02:10:00.000Z",
    updatedAt: "2026-09-17T09:00:00.000Z",
  },
  {
    id: "trade-xau-1",
    setupId: "setup-xau",
    symbol: "XAU",
    universe: "us",
    direction: "long",
    currency: "USD",
    strategy: "Macro reversal",
    status: "closed",
    initialRiskAmount: 470,
    plannedStop: 3598,
    fills: [
      { id: "fill-xau-e1", side: "entry", executedAt: "2026-09-09T13:00:00.000Z", price: 3645, quantity: 10, fee: 10, feeCurrency: "USD" },
      { id: "fill-xau-x1", side: "exit", executedAt: "2026-09-10T14:20:00.000Z", price: 3598, quantity: 10, fee: 10, feeCurrency: "USD" },
    ],
    exitReason: "Stop reached.",
    notes: "Real yields did not roll over after the print.",
    createdAt: "2026-09-09T12:50:00.000Z",
    updatedAt: "2026-09-10T14:20:00.000Z",
  },
];

const [tradesSignal, setTradesSignal] = createSignal<TradeRecord[]>(SEED_TRADES);
let hydrated = false;

export const trades = tradesSignal;

export function initTradesStore(): void {
  onMount(() => {
    let needsMigration = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        needsMigration = Array.isArray(parsed);
        const items = Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
            ? (parsed as { items: unknown[] }).items
            : [];
        setTradesSignal(items.filter(isTrade));
      }
    } catch {
      /* corrupted or blocked storage keeps the deterministic fixtures */
    }
    hydrated = true;
    if (needsMigration) persist();
    onCleanup(() => { hydrated = false; });
  });
}

function isTrade(value: unknown): value is TradeRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.symbol === "string" && Array.isArray(item.fills);
}

function persist(): void {
  if (isServer) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items: tradesSignal() }));
  } catch {
    /* session state remains available when storage is full or blocked */
  }
}

export function addTrade(trade: TradeRecord): void {
  setTradesSignal(current => [trade, ...current]);
  persist();
}

export function updateTrade(id: string, patch: Partial<Omit<TradeRecord, "id">>): void {
  setTradesSignal(current => current.map(trade => trade.id === id
    ? { ...trade, ...patch, id, updatedAt: new Date().toISOString() }
    : trade));
  persist();
}

export function reviewTrade(id: string, review: TradeReview): void {
  updateTrade(id, { review });
}

export function getTrade(id: string): TradeRecord | undefined {
  return tradesSignal().find(trade => trade.id === id);
}

export function newTradeId(symbol: string): string {
  return `trade-${symbol.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`;
}

export function replaceTrades(items: TradeRecord[]): void {
  setTradesSignal(items);
  persist();
}

export function resetDemoTrades(): void {
  setTradesSignal(SEED_TRADES);
  persist();
}
