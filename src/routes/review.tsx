import { Title, Meta } from "@solidjs/meta";
import { For, createMemo, createSignal } from "solid-js";
import { BarChart3 } from "lucide-solid";
import { AppNavbar } from "~/components/navigation/AppNavbar";
import { MarketPulseStrip } from "~/components/navigation/MarketPulseStrip";
import { dashboardData } from "~/lib/dashboard-data";
import type { Direction } from "~/lib/investing-types";
import { resultForTrade, summarizeTrades } from "~/lib/trade-analytics";
import { initAccent } from "~/lib/accent";
import { initPalette } from "~/lib/palette";
import { initTheme } from "~/lib/theme";
import { initTradesStore, trades } from "~/lib/trades-store";

export default function ReviewPage() {
  initTheme(); initPalette(); initAccent(); initTradesStore();
  const [universe, setUniverse] = createSignal<"all" | "us" | "crypto" | "ihsg">("all");
  const [direction, setDirection] = createSignal<"all" | Direction>("all");
  const [reviewed, setReviewed] = createSignal<"all" | "reviewed" | "needed">("all");
  const [strategy, setStrategy] = createSignal("all");
  const strategies = createMemo(() => [...new Set(trades().map(trade => trade.strategy))].sort());
  const filtered = createMemo(() => trades().filter(trade => {
    if (universe() !== "all" && trade.universe !== universe()) return false;
    if (direction() !== "all" && trade.direction !== direction()) return false;
    if (strategy() !== "all" && trade.strategy !== strategy()) return false;
    if (reviewed() === "reviewed" && !trade.review) return false;
    if (reviewed() === "needed" && (trade.review || trade.status !== "closed")) return false;
    return true;
  }));
  const summary = createMemo(() => summarizeTrades(filtered()));
  const processCompletion = createMemo(() => trades().length ? trades().filter(trade => trade.setupId && trade.review).length / trades().length * 100 : 0);
  const byStrategy = createMemo(() => strategies().map(name => ({ name, summary: summarizeTrades(filtered().filter(trade => trade.strategy === name)) })).filter(group => group.summary.sampleSize > 0));
  const byMarket = createMemo(() => (["us", "crypto", "ihsg"] as const).map(name => ({ name, summary: summarizeTrades(filtered().filter(trade => trade.universe === name)) })).filter(group => group.summary.sampleSize > 0));
  const byDirection = createMemo(() => (["long", "short"] as const).map(name => ({ name, summary: summarizeTrades(filtered().filter(trade => trade.direction === name)) })).filter(group => group.summary.sampleSize > 0));
  const byHoldingPeriod = createMemo(() => [
    { name: "Intraday", test: (hours: number) => hours <= 24 },
    { name: "Swing, 1 to 7 days", test: (hours: number) => hours > 24 && hours <= 168 },
    { name: "Position, over 7 days", test: (hours: number) => hours > 168 },
  ].map(bucket => ({ name: bucket.name, summary: summarizeTrades(filtered().filter(trade => { const hours = resultForTrade(trade).holdingHours; return hours !== null && bucket.test(hours); })) })).filter(group => group.summary.sampleSize > 0));

  return <><Title>Investing OS | Review</Title><Meta name="description" content="Review trade results by strategy, market, direction and initial risk." /><AppNavbar /><MarketPulseStrip markets={dashboardData.markets} /><main class="mx-auto max-w-[1440px] px-200 pb-800"><section class="pt-500"><div class="flex items-center gap-100 text-50 font-700 uppercase tracking-[.08em] text-accent"><BarChart3 size={13} /> Recorded results</div><h1 class="mt-150 text-800 font-700">Review and analytics</h1><p class="mt-100 max-w-[70ch] text-100 text-muted">Results come from journal fills and fees. Cross-market comparison uses initial risk, or R, rather than mixing USD and IDR.</p></section>
    <section class="mt-300 rounded-200 border border-line bg-surface-1 p-200"><div class="grid gap-100 sm:grid-cols-2 lg:grid-cols-4"><Filter label="Market" value={universe()} onChange={setUniverse} options={["all", "us", "crypto", "ihsg"]} /><Filter label="Direction" value={direction()} onChange={setDirection} options={["all", "long", "short"]} /><Filter label="Review" value={reviewed()} onChange={setReviewed} options={["all", "reviewed", "needed"]} /><Filter label="Strategy" value={strategy()} onChange={setStrategy} options={["all", ...strategies()]} /></div></section>
    <dl class="mt-200 grid grid-cols-2 gap-150 lg:grid-cols-7"><Kpi label="Process completion" value={`${processCompletion().toFixed(1)}%`} /><Kpi label="Sample" value={`${summary().sampleSize}`} /><Kpi label="Win rate" value={summary().winRate === null ? "-" : `${summary().winRate!.toFixed(1)}%`} /><Kpi label="Total" value={`${signed(summary().totalR)}R`} /><Kpi label="Expectancy" value={summary().expectancyR === null ? "-" : `${signed(summary().expectancyR!)}R`} /><Kpi label="Avg win / loss" value={`${summary().averageWinR?.toFixed(2) ?? "-"} / ${summary().averageLossR?.toFixed(2) ?? "-"}R`} /><Kpi label="Max drawdown" value={`${summary().maxDrawdownR.toFixed(2)}R`} /></dl>
    <div class="mt-200 grid gap-200 xl:grid-cols-[1.2fr_.8fr]"><section class="rounded-200 border border-line bg-surface-1 overflow-hidden"><div class="border-b border-line px-250 py-200"><h2 class="text-200 font-700">Closed trades</h2><p class="mt-50 text-75 text-muted">Every row includes the sample's actual execution result.</p></div><div class="overflow-x-auto"><table class="w-full text-left text-75"><thead class="bg-surface-2 text-caption"><tr><th class="px-200 py-100">Trade</th><th>Strategy</th><th>Holding</th><th>P&L</th><th>R</th><th>Review</th></tr></thead><tbody class="divide-y divide-line"><For each={filtered().filter(trade => trade.status === "closed")} fallback={<tr><td colSpan="6" class="p-300 text-center text-muted">No closed trades match these filters.</td></tr>}>{trade => { const result = resultForTrade(trade); return <tr><td class="px-200 py-150 font-700">{trade.symbol}</td><td>{trade.strategy}</td><td>{result.holdingHours === null ? "-" : `${Math.round(result.holdingHours)}h`}</td><td classList={{ "text-pos": result.realizedPnl > 0, "text-neg": result.realizedPnl <= 0 }}>{result.realizedPnl.toLocaleString()}</td><td class="font-700">{result.realizedR === null ? "-" : `${signed(result.realizedR)}R`}</td><td>{trade.review ? "Complete" : "Needed"}</td></tr>; }}</For></tbody></table></div></section>
      <section class="rounded-200 border border-line bg-surface-1 p-250"><h2 class="text-200 font-700">Breakdowns</h2><p class="mt-50 text-75 text-muted">Small samples stay visible instead of implying confidence.</p><Breakdown title="Strategy" groups={byStrategy()} /><Breakdown title="Market" groups={byMarket()} /><Breakdown title="Direction" groups={byDirection()} /><Breakdown title="Holding period" groups={byHoldingPeriod()} /></section></div>
  </main></>;
}

function signed(value: number): string { return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`; }
function Kpi(props: { label: string; value: string }) { return <div class="rounded-200 border border-line bg-surface-1 p-200"><dt class="text-75 text-muted">{props.label}</dt><dd class="mt-100 text-300 font-700 tabular-nums">{props.value}</dd></div>; }
function Filter<T extends string>(props: { label: string; value: T; options: T[]; onChange: (value: T) => void }) { return <label class="text-75 font-600 text-muted"><span class="mb-50 block">{props.label}</span><select class="h-10 w-full rounded-100 border border-line bg-surface-2 px-100 text-ink" value={props.value} onChange={event => props.onChange(event.currentTarget.value as T)}><For each={props.options}>{option => <option value={option}>{option}</option>}</For></select></label>; }
function Breakdown(props: { title: string; groups: Array<{ name: string; summary: ReturnType<typeof summarizeTrades> }> }) { return <div class="mt-200"><h3 class="text-50 font-700 uppercase tracking-[.06em] text-caption">{props.title}</h3><div class="mt-100 space-y-100"><For each={props.groups} fallback={<p class="text-75 text-muted">No samples.</p>}>{group => <div class="rounded-100 bg-surface-2 p-150"><div class="flex items-center justify-between gap-100"><b class="capitalize">{group.name}</b><span class="text-50 text-caption">n={group.summary.sampleSize}</span></div><div class="mt-100 flex items-center justify-between text-75"><span>{group.summary.winRate?.toFixed(1) ?? "-"}% wins</span><span class="font-700">{signed(group.summary.totalR)}R</span></div></div>}</For></div></div>; }
