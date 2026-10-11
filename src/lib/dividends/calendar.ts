import type { CalendarDate, CalendarYear } from "./types.js";

export const CALENDAR_SOURCE = "https://web.ksei.co.id/services/schedule-c-best-instruction";
export const TRADING_RULES_SOURCE = "https://www.idx.id/en/products-services/trading-hours-and-mechanism/";
// KSEI PENG-0002/DIR/KSEI/0126 appendix. Weekends are also closed.
// December 31's limited bond settlement services do not cover this equity planner.
export const CALENDAR_2026: CalendarYear = {
  year: 2026, source: CALENDAR_SOURCE,
  holidays: ["2026-01-01", "2026-01-16", "2026-02-16", "2026-02-17", "2026-03-18", "2026-03-19", "2026-03-20", "2026-03-23", "2026-03-24", "2026-04-03", "2026-05-01", "2026-05-14", "2026-05-15", "2026-05-27", "2026-05-28", "2026-06-01", "2026-06-16", "2026-08-17", "2026-08-25", "2026-12-24", "2026-12-25", "2026-12-31"],
};
export function isDate(value: unknown): value is CalendarDate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
export function addDays(date: CalendarDate, days: number): CalendarDate {
  if (!isDate(date)) throw new Error(`Invalid Jakarta calendar date: ${date || "blank"}.`);
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export function createCalendar(extra: CalendarYear[] = []) {
  const years = new Map<number, CalendarYear>([[2026, CALENDAR_2026]]);
  for (const entry of extra) {
    if (!Number.isInteger(entry.year) || entry.year < 1900 || entry.year > 2200 || entry.year === 2026 || years.has(entry.year) || !entry.source.trim() || entry.holidays.some(date => !isDate(date) || Number(date.slice(0, 4)) !== entry.year)) {
      throw new Error("Each additional calendar needs a unique year, valid holiday dates, and source notes. The sourced 2026 calendar is bundled.");
    }
    years.set(entry.year, entry);
  }
  const assertCovered = (date: CalendarDate) => {
    if (!isDate(date)) throw new Error(`Invalid Jakarta calendar date: ${date || "blank"}.`);
    if (!years.has(Number(date.slice(0, 4)))) throw new Error(`Calendar coverage missing for ${date.slice(0, 4)}. Add that year's exchange holidays before calculating.`);
  };
  const isSession = (date: CalendarDate) => {
    assertCovered(date);
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    return day !== 0 && day !== 6 && !years.get(Number(date.slice(0, 4)))!.holidays.includes(date);
  };
  const nextSession = (date: CalendarDate, count = 1) => {
    assertCovered(date);
    let cursor = date;
    for (let i = 0; i < count;) { cursor = addDays(cursor, 1); if (isSession(cursor)) i++; }
    return cursor;
  };
  const sessions = (start: CalendarDate, end: CalendarDate) => {
    assertCovered(start); assertCovered(end);
    const result: CalendarDate[] = [];
    for (let date = start; date <= end; date = addDays(date, 1)) if (isSession(date)) result.push(date);
    return result;
  };
  return { assertCovered, isSession, nextSession, sessions };
}
export type ExchangeCalendar = ReturnType<typeof createCalendar>;

