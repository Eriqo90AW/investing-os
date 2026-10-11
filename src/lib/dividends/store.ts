import { isServer } from "solid-js/web";
import { createSignal } from "solid-js";
import { defaultInputs } from "./assumptions.js";
import { demoEvents } from "./events.js";
import type { ChainTrade, DividendStore, DividendWorkspace, Strategy } from "./types.js";

const STORAGE_KEY = "ios-dividends-v1";
const [store, setStore] = createSignal<DividendStore>(emptyStore());
export const dividendStore = store;
export const dividendWorkspace = () => store()[store().mode];
function workspace(demo: boolean): DividendWorkspace { return { events: demo ? demoEvents() : [], inputs: defaultInputs(demo), selected: { "ex-date": null, recovery: null } }; }
function emptyStore(): DividendStore { return { version: 1, mode: "demo", demo: workspace(true), manual: workspace(false) }; }
export function initDividendStore(): void {
  if (isServer) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (isStore(value)) setStore(value);
    }
  } catch { /* Keep usable defaults when local storage is unavailable or corrupt. */ }
}
function persist(value: DividendStore): void { setStore(value); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* In-memory workspace remains usable. */ } }
function isStore(value: unknown): value is DividendStore {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DividendStore>;
  return item.version === 1 && (item.mode === "demo" || item.mode === "manual") && !!item.demo && !!item.manual && Array.isArray(item.demo.events) && Array.isArray(item.manual.events);
}
export function setDividendMode(mode: "demo" | "manual"): void { persist({ ...store(), mode }); }
export function updateDividendWorkspace(patch: Partial<DividendWorkspace>, mode = store().mode): void { persist({ ...store(), [mode]: { ...store()[mode], ...patch } }); }
export function saveDividendEvent(event: DividendWorkspace["events"][number]): void {
  const current = dividendWorkspace();
  const exists = current.events.some(item => item.id === event.id);
  updateDividendWorkspace({ events: exists ? current.events.map(item => item.id === event.id ? event : item) : [...current.events, event] });
}
export function deleteDividendEvent(id: string): void { const current = dividendWorkspace(); updateDividendWorkspace({ events: current.events.filter(event => event.id !== id), selected: { "ex-date": (current.selected["ex-date"] ?? []).filter(item => item.eventId !== id), recovery: (current.selected.recovery ?? []).filter(item => item.eventId !== id) } }); }
export function setSelectedChain(strategy: Strategy, chain: ChainTrade[]): void { const current = dividendWorkspace(); updateDividendWorkspace({ selected: { ...current.selected, [strategy]: chain } }); }
export function resetDividendDemo(): void { persist({ ...store(), demo: workspace(true) }); }
export function restoreDividendData(value: unknown): boolean { if (!isStore(value)) return false; persist(value); return true; }


