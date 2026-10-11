import { isDate, type ExchangeCalendar } from "./calendar.js";
import type { DividendEvent } from "./types.js";
export function validateEvent(event: DividendEvent, calendar?: ExchangeCalendar): string | undefined {
  if (!event.id || !/^[A-Z0-9.-]{1,16}$/.test(event.ticker)) return "Enter a valid ticker.";
  if (!Number.isFinite(event.purchasePrice) || event.purchasePrice <= 0 || !Number.isFinite(event.dividendPerShare) || event.dividendPerShare < 0) return "Purchase price must be positive and dividend per share cannot be negative.";
  if (![event.cumDate, event.exDate, event.recordingDate, event.paymentDate].every(isDate)) return "Enter all four valid event dates.";
  if (!(event.cumDate < event.exDate && event.exDate <= event.recordingDate && event.recordingDate <= event.paymentDate)) return "Dates must follow cum-date, ex-date, recording date, then payment date.";
  if (calendar) {
    [event.cumDate, event.exDate, event.recordingDate, event.paymentDate].forEach(calendar.assertCovered);
    if (!calendar.isSession(event.cumDate) || !calendar.isSession(event.exDate)) return "Regular-market cum-date and ex-date must be exchange sessions.";
  }
}
export function demoEvents(): DividendEvent[] {
  return [
    ["BBRI", 180, 4000, "2026-04-08", "2026-04-09", "2026-04-10", "2026-04-24"],
    ["TLKM", 160, 3000, "2026-04-14", "2026-04-15", "2026-04-16", "2026-05-05"],
    ["ASII", 220, 5000, "2026-04-22", "2026-04-23", "2026-04-24", "2026-05-12"],
    ["BMRI", 250, 5200, "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-22"],
    ["UNTR", 1200, 24000, "2026-05-18", "2026-05-19", "2026-05-20", "2026-06-05"],
    ["INDF", 300, 7000, "2026-05-29", "2026-06-02", "2026-06-03", "2026-06-19"],
  ].map(([ticker, dividend, price, cum, ex, record, pay], index) => ({
    id: `demo-${index + 1}`, ticker: String(ticker), dividendPerShare: Number(dividend), purchasePrice: Number(price),
    cumDate: String(cum), exDate: String(ex), recordingDate: String(record), paymentDate: String(pay),
    sourceNotes: "Invented sample dates, dividend and price. Not an issuer announcement.", provenance: "demo", excluded: false,
  }));
}
