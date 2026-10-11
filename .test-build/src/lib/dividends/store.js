import { isServer } from "solid-js/web";
import { createSignal } from "solid-js";
import { defaultInputs } from "./assumptions.js";
import { demoEvents } from "./events.js";
const STORAGE_KEY = "ios-dividends-v1";
const [store, setStore] = createSignal(emptyStore());
export const dividendStore = store;
export const dividendWorkspace = () => store()[store().mode];
function workspace(demo) { return { events: demo ? demoEvents() : [], inputs: defaultInputs(demo), selected: { "ex-date": null, recovery: null } }; }
function emptyStore() { return { version: 1, mode: "demo", demo: workspace(true), manual: workspace(false) }; }
export function initDividendStore() {
    if (isServer)
        return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const value = JSON.parse(raw);
            if (isStore(value))
                setStore(value);
        }
    }
    catch { /* Keep usable defaults when local storage is unavailable or corrupt. */ }
}
function persist(value) { setStore(value); try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
catch { /* In-memory workspace remains usable. */ } }
function isStore(value) {
    if (!value || typeof value !== "object")
        return false;
    const item = value;
    return item.version === 1 && (item.mode === "demo" || item.mode === "manual") && !!item.demo && !!item.manual && Array.isArray(item.demo.events) && Array.isArray(item.manual.events);
}
export function setDividendMode(mode) { persist({ ...store(), mode }); }
export function updateDividendWorkspace(patch, mode = store().mode) { persist({ ...store(), [mode]: { ...store()[mode], ...patch } }); }
export function saveDividendEvent(event) {
    const current = dividendWorkspace();
    const exists = current.events.some(item => item.id === event.id);
    updateDividendWorkspace({ events: exists ? current.events.map(item => item.id === event.id ? event : item) : [...current.events, event] });
}
export function deleteDividendEvent(id) { const current = dividendWorkspace(); updateDividendWorkspace({ events: current.events.filter(event => event.id !== id), selected: { "ex-date": (current.selected["ex-date"] ?? []).filter(item => item.eventId !== id), recovery: (current.selected.recovery ?? []).filter(item => item.eventId !== id) } }); }
export function setSelectedChain(strategy, chain) { const current = dividendWorkspace(); updateDividendWorkspace({ selected: { ...current.selected, [strategy]: chain } }); }
export function resetDividendDemo() { persist({ ...store(), demo: workspace(true) }); }
export function restoreDividendData(value) { if (!isStore(value))
    return false; persist(value); return true; }
