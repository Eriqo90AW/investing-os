import { rng } from "./random";

/**
 * Deterministic mock history of closed-setup outcomes.
 *
 * The setups store tracks live statuses but stamps no dates, so a time-range
 * chart cannot be driven from it. This module is the stand-in: a seeded
 * two-year daily series plus an hourly breakdown of today, generated once per
 * page load. Same seed discipline as every other fixture — byte-identical on
 * the server and the client. A live adapter can replace `getOutcomeBuckets`
 * without touching the chart.
 */

export type OutcomeRange = "1D" | "7D" | "1M" | "1Y" | "All";

export const OUTCOME_RANGES: { value: OutcomeRange; label: string; full: string }[] = [
  { value: "1D", label: "1D", full: "Last day" },
  { value: "7D", label: "7D", full: "Last 7 days" },
  { value: "1M", label: "1M", full: "Last month" },
  { value: "1Y", label: "1Y", full: "Last year" },
  { value: "All", label: "All", full: "All time" },
];

export interface OutcomeBucket {
  label: string;
  wins: number;
  losses: number;
}

interface DayOutcome {
  time: number;
  wins: number;
  losses: number;
}

const DAY_MS = 86_400_000;
const HISTORY_DAYS = 730;

function midnightToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Two years of daily closes. Volume dips on weekends; the win rate drifts in
 *  slow regimes so the year views have shape instead of static. */
function buildDailyHistory(): DayOutcome[] {
  const rand = rng(20260920);
  const base = midnightToday();
  const out: DayOutcome[] = [];
  for (let ago = HISTORY_DAYS - 1; ago >= 0; ago--) {
    const time = base - ago * DAY_MS;
    const day = new Date(time).getDay();
    const weekend = day === 0 || day === 6;
    const regime = 0.62 + 0.1 * Math.sin(ago / 47) + (rand() - 0.5) * 0.08;
    const expected = (weekend ? 0.9 : 2.4) * (0.7 + rand() * 0.6);
    const closed = Math.max(0, Math.round(expected + (rand() - 0.5) * 2));
    const winP = Math.min(0.78, Math.max(0.45, regime));
    let wins = 0;
    for (let k = 0; k < closed; k++) {
      if (rand() < winP) wins += 1;
    }
    out.push({ time, wins, losses: closed - wins });
  }
  return out;
}

/** Today's closes by hour. Hours after now stay empty — the day is unfinished. */
function buildTodayHours(): DayOutcome[] {
  const rand = rng(90210);
  const base = midnightToday();
  const currentHour = new Date().getHours();
  const out: DayOutcome[] = [];
  for (let h = 0; h < 24; h++) {
    const time = base + h * 3_600_000;
    if (h > currentHour) {
      out.push({ time, wins: 0, losses: 0 });
      continue;
    }
    // Mock desk rhythm in WIB: evening US-session hours close the most.
    const session = h >= 19 && h <= 23 ? 1 : h >= 8 ? 0.45 : 0.06;
    const closed = rand() < session ? Math.floor(rand() * 3) : 0;
    let wins = 0;
    for (let k = 0; k < closed; k++) {
      if (rand() < 0.62) wins += 1;
    }
    out.push({ time, wins, losses: closed - wins });
  }
  return out;
}

const DAYS = buildDailyHistory();
const HOURS = buildTodayHours();

/** Explicit locale — the system default could differ between server and client. */
const weekday = (t: number): string =>
  new Date(t).toLocaleDateString("en-US", { weekday: "short" });
const dayNum = (t: number): string => String(new Date(t).getDate());
const monthShort = (t: number): string =>
  new Date(t).toLocaleDateString("en-US", { month: "short" });
const monthYear = (t: number): string =>
  new Date(t).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

function groupByMonth(days: DayOutcome[], label: (t: number) => string): OutcomeBucket[] {
  const groups = new Map<string, OutcomeBucket>();
  for (const d of days) {
    const dt = new Date(d.time);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.wins += d.wins;
      existing.losses += d.losses;
    } else {
      groups.set(key, { label: label(d.time), wins: d.wins, losses: d.losses });
    }
  }
  return [...groups.values()];
}

export function getOutcomeBuckets(range: OutcomeRange): OutcomeBucket[] {
  switch (range) {
    case "1D":
      return HOURS.map((h, i) => ({
        label: `${String(i).padStart(2, "0")}:00`,
        wins: h.wins,
        losses: h.losses,
      }));
    case "7D":
      return DAYS.slice(-7).map(d => ({ label: weekday(d.time), wins: d.wins, losses: d.losses }));
    case "1M":
      return DAYS.slice(-30).map(d => ({ label: dayNum(d.time), wins: d.wins, losses: d.losses }));
    case "1Y":
      return groupByMonth(DAYS.slice(-365), monthShort);
    case "All":
      return groupByMonth(DAYS, monthYear);
  }
}

export interface OutcomeSummary {
  wins: number;
  losses: number;
  closed: number;
  /** Null when nothing closed in range — no rate to quote. */
  rate: number | null;
}

export function summarizeOutcome(buckets: OutcomeBucket[]): OutcomeSummary {
  const wins = buckets.reduce((n, b) => n + b.wins, 0);
  const losses = buckets.reduce((n, b) => n + b.losses, 0);
  const closed = wins + losses;
  return { wins, losses, closed, rate: closed === 0 ? null : (wins / closed) * 100 };
}
