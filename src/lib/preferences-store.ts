import { createSignal, onMount } from "solid-js";
import type { Currency } from "./investing-types";

const STORAGE_KEY = "ios-preferences";
const [reportingCurrency, setReportingCurrencySignal] = createSignal<Currency>("USD");
const [displayTimezone, setDisplayTimezoneSignal] = createSignal("Asia/Jakarta");
const [usdIdrRate, setUsdIdrRateSignal] = createSignal(16_300);
const [fxAsOf, setFxAsOfSignal] = createSignal("2026-09-22");

export { reportingCurrency, displayTimezone, usdIdrRate, fxAsOf };

export function initPreferences(): void {
  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const value = JSON.parse(raw) as Record<string, unknown>;
      if (value.reportingCurrency === "USD" || value.reportingCurrency === "IDR") setReportingCurrencySignal(value.reportingCurrency);
      if (typeof value.displayTimezone === "string") setDisplayTimezoneSignal(value.displayTimezone);
      if (typeof value.usdIdrRate === "number") setUsdIdrRateSignal(value.usdIdrRate);
      if (typeof value.fxAsOf === "string") setFxAsOfSignal(value.fxAsOf);
    } catch { /* keep defaults */ }
  });
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ reportingCurrency: reportingCurrency(), displayTimezone: displayTimezone(), usdIdrRate: usdIdrRate(), fxAsOf: fxAsOf() })); } catch { /* session remains usable */ }
}
export function setReportingCurrency(value: Currency) { setReportingCurrencySignal(value); persist(); }
export function setDisplayTimezone(value: string) { setDisplayTimezoneSignal(value); persist(); }
export function setUsdIdrRate(value: number) { setUsdIdrRateSignal(value); persist(); }
export function setFxAsOf(value: string) { setFxAsOfSignal(value); persist(); }
