import { A } from "@solidjs/router";
import { For, createMemo } from "solid-js";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-solid";
import { setups } from "~/lib/setups-store";
import { trades } from "~/lib/trades-store";
import { summarizeTrades } from "~/lib/trade-analytics";

interface AttentionItem { id: string; title: string; detail: string; href: string; }

export function AttentionQueue() {
  const items = createMemo<AttentionItem[]>(() => {
    const next: AttentionItem[] = [];
    for (const trade of trades()) {
      if (trade.status === "closed" && !trade.review) next.push({ id: `review-${trade.id}`, title: `${trade.symbol} trade needs a review`, detail: "The trade is closed, but the decision review is incomplete.", href: `/journal?trade=${trade.id}` });
    }
    for (const setup of setups()) {
      if (!setup.thesis.trim() || !setup.entry.trim() || !setup.stopLoss.trim() || !setup.target.trim()) next.push({ id: `incomplete-${setup.id}`, title: `${setup.symbol} plan is incomplete`, detail: "Add the thesis, entry, stop, and target before promotion.", href: `/setup/${setup.id}` });
      if (setup.status === "active" && !trades().some(trade => trade.setupId === setup.id)) next.push({ id: `active-${setup.id}`, title: `${setup.symbol} is active without a journal`, detail: "Record the entry so execution can be compared with the setup.", href: `/journal?setup=${setup.id}` });
      if (setup.catalystAt) {
        const hours = (Date.parse(setup.catalystAt) - Date.now()) / 3_600_000;
      if (hours >= 0 && hours <= 72) next.push({ id: `catalyst-${setup.id}`, title: `${setup.symbol} catalyst is approaching`, detail: new Date(setup.catalystAt).toLocaleString(), href: `/setup/${setup.id}` });
      }
    }
    return next.slice(0, 8);
  });
  const summary = createMemo(() => summarizeTrades(trades()));

  return <div class="mt-300 grid gap-200 xl:grid-cols-[1.35fr_.65fr]"><section class="rounded-200 border border-line bg-surface-1 overflow-hidden"><div class="flex items-start justify-between gap-150 border-b border-line px-250 py-200"><div><div class="flex items-center gap-100"><AlertCircle size={17} class="text-accent" /><h2 class="text-300 font-700">Needs attention</h2></div><p class="mt-50 text-75 text-muted">Work that blocks a complete setup-to-review record.</p></div><span class="rounded-10 bg-reminder-bg px-100 py-[3px] text-50 font-700 text-reminder">{items().length} items</span></div><div class="divide-y divide-line"><For each={items()} fallback={<div class="flex items-center gap-100 px-250 py-300 text-75 text-muted"><CheckCircle2 size={16} class="text-pos" /> Nothing needs attention.</div>}>{item => <A href={item.href} class="flex items-center gap-150 px-250 py-150 hover:bg-surface-2"><div class="min-w-0 flex-1"><p class="font-700">{item.title}</p><p class="mt-50 text-75 text-muted">{item.detail}</p></div><ArrowRight size={14} class="shrink-0 text-caption" /></A>}</For></div></section><section class="rounded-200 border border-line bg-surface-1 p-250"><h2 class="text-200 font-700">Recorded performance</h2><p class="mt-50 text-75 text-muted">Closed trades measured in initial risk.</p><div class="mt-250 text-800 font-700 tabular-nums">{summary().totalR >= 0 ? "+" : ""}{summary().totalR.toFixed(2)}R</div><dl class="mt-200 grid grid-cols-2 gap-100"><Mini label="Sample" value={`${summary().sampleSize}`} /><Mini label="Win rate" value={summary().winRate === null ? "-" : `${summary().winRate!.toFixed(1)}%`} /><Mini label="Expectancy" value={summary().expectancyR === null ? "-" : `${summary().expectancyR!.toFixed(2)}R`} /><Mini label="Drawdown" value={`${summary().maxDrawdownR.toFixed(2)}R`} /></dl><A href="/review" class="mt-250 inline-flex items-center gap-100 text-75 font-700 text-accent">Open review <ArrowRight size={14} /></A></section></div>;
}

function Mini(props: { label: string; value: string }) { return <div class="rounded-100 bg-surface-2 p-100"><dt class="text-50 text-caption">{props.label}</dt><dd class="mt-50 font-700 tabular-nums">{props.value}</dd></div>; }
