import { createSignal, onMount } from "solid-js";
import type { ScreenerRow } from "./screener-data";

export type ScreenField = "quantScore" | "chg1m" | "rsi14" | "sma50Pos" | "momentum3m";
export type ScreenOp = ">" | ">=" | "<" | "<=";
export interface ScreenRule { field: ScreenField; op: ScreenOp; value: number; }
export interface SavedScreen { id: string; name: string; description: string; rules: ScreenRule[]; createdAt: number; }

const STORAGE_KEY = "ios-screener-screens";
const [screensSignal, setScreensSignal] = createSignal<SavedScreen[]>([]);
let hydrated = false;

export const savedScreens = screensSignal;

export function initSavedScreensStore(): void {
  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) setScreensSignal(parsed.filter(isScreen));
      }
    } catch { /* keep an empty local list */ }
    hydrated = true;
  });
}

function isScreen(value: unknown): value is SavedScreen {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.rules);
}

function persist(): void {
  if (!hydrated) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(screensSignal())); } catch { /* session remains usable */ }
}

export function addSavedScreen(screen: SavedScreen): void {
  setScreensSignal(current => [screen, ...current]);
  persist();
}

export function matchesScreen(row: ScreenerRow, rules: ScreenRule[]): boolean {
  return rules.every(rule => {
    const value = row[rule.field];
    if (typeof value !== "number") return false;
    if (rule.op === ">") return value > rule.value;
    if (rule.op === ">=") return value >= rule.value;
    if (rule.op === "<") return value < rule.value;
    return value <= rule.value;
  });
}

export function screenFromPrompt(prompt: string): SavedScreen {
  const lower = prompt.toLowerCase();
  const rules: ScreenRule[] = lower.includes("oversold") || lower.includes("mean revert")
    ? [{ field: "rsi14", op: "<", value: 35 }, { field: "sma50Pos", op: "<", value: 0 }]
    : lower.includes("quality") || lower.includes("best")
      ? [{ field: "quantScore", op: ">=", value: 70 }, { field: "momentum3m", op: ">", value: 8 }]
      : [{ field: "chg1m", op: ">", value: 5 }, { field: "sma50Pos", op: ">", value: 0 }];
  const name = lower.includes("oversold") ? "Agent oversold reversal" : lower.includes("quality") ? "Agent quality leaders" : "Agent momentum continuation";
  return { id: `screen-${Date.now().toString(36)}`, name, description: rules.map(rule => `${rule.field} ${rule.op} ${rule.value}`).join(" and "), rules, createdAt: Date.now() };
}
