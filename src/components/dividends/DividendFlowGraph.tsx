import { For, Show, createUniqueId } from "solid-js";
import type { CompletedFlowTrade, DividendFlow, FlowTrade } from "~/lib/dividends/flow";

export const flowMoney = (value: number) => `Rp${Math.round(value).toLocaleString("id-ID")}`;
export const flowPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
export const flowDate = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const WIDTH = 1240;
const LEFT = 122;
const RIGHT = 122;
const ROW = 380;
const x = (position: number) => LEFT + position * (WIDTH - LEFT - RIGHT);
const y = (index: number) => 186 + index * ROW;
const node = "cursor-pointer absolute w-[208px] rounded-100 border border-line bg-surface-1 px-150 py-100 text-left text-75 outline-none transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-accent";
const label = "block text-50 font-600 uppercase tracking-[.07em] text-muted";
const place = (position: number, top: number) => ({ left: `${x(position) - 104}px`, top: `${top}px` });

const holdingLabel = (row: CompletedFlowTrade, index: number) => {
  const buy = x(row.purchasePosition); const sale = x(row.salePosition);
  const crowded = sale - buy < 320;
  const useLeft = crowded && buy + 230 > WIDTH - 12;
  return {
    left: `${crowded ? buy + (useLeft ? -118 : 118) : (buy + sale) / 2}px`,
    top: `${y(index) - 32}px`,
    transform: useLeft ? "translateX(-100%)" : crowded ? undefined : "translateX(-50%)",
  };
};
const canFundNext = (row: CompletedFlowTrade, next: CompletedFlowTrade) =>
  !!row.cashAvailableDate && row.cashAvailableDate <= next.trade.purchaseDate;
export function DividendFlowGraph(props: { flow: DividendFlow; onSelect: (selectionIndex: number) => void }) {
  const arrowId = createUniqueId();
  const height = () => Math.max(360, props.flow.trades.length * ROW + 120);
  const completedAfter = (index: number): CompletedFlowTrade | undefined =>
    props.flow.trades.slice(index + 1).find((item): item is CompletedFlowTrade => item.status === "completed");
  const select = (item: FlowTrade) => props.onSelect(item.selectionIndex);
  return <div class="max-h-[740px] overflow-auto overscroll-contain" tabindex="0" role="region" aria-label="Dividend flow timeline. Scroll to explore dates and trades.">
    <div class="relative mx-auto" style={{ width: `${WIDTH}px`, height: `${height()}px` }}>
      <div class="sticky top-0 z-20 h-14 border-b border-line bg-surface-1" aria-hidden="true">
        <For each={props.flow.ticks}>{tick => <span class="absolute top-150 whitespace-nowrap text-50 font-600 text-muted" style={{ left: `${x(tick.position)}px`, transform: "translateX(-50%)" }}>
          {tick.month ? new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${tick.date}T00:00:00Z`)) : flowDate(tick.date)}
        </span>}</For>
        <span class="absolute top-150 text-50 text-muted" style={{ right: "30px" }}>DATE →</span>
      </div>
      <svg class="pointer-events-none absolute inset-0" width={WIDTH} height={height()} aria-hidden="true">
        <defs><marker id={arrowId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="var(--c-color-accent)" /></marker></defs>
        <For each={props.flow.ticks}>{tick => <line x1={x(tick.position)} y1="56" x2={x(tick.position)} y2={height()} stroke="var(--c-chart-grid)" />}</For>
        <Show when={props.flow.planningEndPosition < 1}>
          <rect x={x(props.flow.planningEndPosition)} y="56" width={WIDTH - RIGHT - x(props.flow.planningEndPosition)} height={height() - 56} fill="var(--c-color-surface-2)" opacity=".65" />
          <line x1={x(props.flow.planningEndPosition)} y1="56" x2={x(props.flow.planningEndPosition)} y2={height()} stroke="var(--c-chart-axis-text)" stroke-dasharray="4 5" />
        </Show>
        <For each={props.flow.trades}>{(item, index) => <>
          <line x1={LEFT - 20} y1={y(index())} x2={WIDTH - RIGHT + 20} y2={y(index())} stroke="var(--c-chart-grid)" />
          <Show when={item.status === "completed" ? item : undefined}>{row => <>
            <line x1={x(row().purchasePosition)} y1={y(index())} x2={x(row().salePosition)} y2={y(index())} stroke="var(--c-color-accent)" stroke-width="5" stroke-linecap="round" />
            <line x1={x(row().purchasePosition)} y1={y(index()) - 12} x2={x(row().purchasePosition)} y2={y(index())} stroke="var(--c-color-accent)" />
            <line x1={x(row().salePosition)} y1={y(index())} x2={x(row().salePosition)} y2={y(index()) + 18} stroke="var(--c-color-accent)" />
            <circle cx={x(row().purchasePosition)} cy={y(index())} r="7" fill="var(--c-color-accent)" stroke="var(--c-color-surface-1)" stroke-width="2" />
            <circle cx={x(row().salePosition)} cy={y(index())} r="7" fill="var(--c-color-accent)" stroke="var(--c-color-surface-1)" stroke-width="2" />
            <path d={`M${x(row().entitlementPosition)} ${y(index())} V${y(index()) + 180} H${x(row().paymentPosition)} V${y(index()) + 192}`} fill="none" stroke="var(--c-chart-axis-text)" stroke-width="1.5" stroke-dasharray="4 4" />
            <path d={`M${x(row().salePosition)} ${y(index())} V${y(index()) + 126} H${x(row().cashAvailablePosition)}`} fill="none" stroke="var(--c-color-accent)" stroke-width="1.5" stroke-dasharray="3 4" />
            <circle cx={x(row().cashAvailablePosition)} cy={y(index()) + 126} r="4" fill="var(--c-color-accent)" />
            <Show when={completedAfter(index())}>{next => {
              const nextIndex = () => props.flow.trades.indexOf(next());
              return <path d={`M${x(canFundNext(row(), next()) ? row().cashAvailablePosition : row().salePosition)} ${y(index()) + 126} H${x(next().purchasePosition)} V${y(nextIndex()) - 116}`} fill="none" stroke="var(--c-color-accent)" stroke-width="1.5" marker-end={`url(#${arrowId})`} />;
            }}</Show>
          </>}</Show>
          <Show when={item.status === "skipped"}>
            <circle cx={x(item.purchasePosition)} cy={y(index())} r="6" fill="var(--c-chart-other)" />
          </Show>
        </>}</For>
      </svg>
      <Show when={props.flow.planningEndPosition < 1}><span class="absolute top-[66px] rounded-100 bg-surface-2 px-100 py-50 text-50 text-muted" style={{ left: `${x(props.flow.planningEndPosition) + 8}px` }}>Pending after plan end</span></Show>
      <For each={props.flow.trades}>{(item, index) => <>
        <span class="absolute text-50 font-700 text-muted" style={{ left: "20px", top: `${y(index()) - 8}px` }}>{String(index() + 1).padStart(2, "0")}</span>
        <Show when={item.status === "completed" ? item : undefined}>{row => <>
          <button type="button" class={node} style={place(row().purchasePosition, y(index()) - 114)} onClick={() => select(item)}
            aria-label={`Edit ${row().trade.ticker} purchase on ${row().trade.purchaseDate}, ${flowMoney(row().trade.buyCost)}, ${row().trade.lots} lots`}>
            <span class={label}>Buy · {flowDate(row().trade.purchaseDate)}</span>
            <span class="mt-50 flex items-baseline justify-between gap-100"><strong class="text-200 font-700">{row().trade.ticker}</strong><span class="text-50 text-muted">{row().trade.lots} lots</span></span>
            <span class="mt-50 block font-600 tabular-nums">{flowMoney(row().trade.buyCost)}</span>
          </button>
          <span class="absolute rounded-full border border-line bg-surface-1 px-100 py-50 text-50 font-600 text-muted" style={holdingLabel(row(), index())}>Hold {row().holdingDays} days</span>
          <button type="button" class={node} style={place(row().salePosition, y(index()) + 18)} onClick={() => select(item)}
            aria-label={`Edit ${row().trade.ticker} trade. Sell ${row().trade.saleDate}, proceeds ${flowMoney(row().trade.netSale)}, net return ${flowPercent(row().returnPercent)}`}>
            <span class={label}>Sell {row().trade.ticker} · {flowDate(row().trade.saleDate)}</span>
            <span class="mt-50 flex items-baseline justify-between gap-50"><strong class="text-100 font-700 tabular-nums">{flowMoney(row().trade.netSale)}</strong></span>
            <span class="mt-50 block text-100 font-700 tabular-nums" classList={{ "text-pos": row().returnPercent > 0, "text-neg": row().returnPercent < 0 }}>{flowPercent(row().returnPercent)} <span class="text-50 font-400 text-muted">net return</span></span>
          </button>
          <span class="absolute w-[208px] text-50 text-muted" style={place(row().cashAvailablePosition, y(index()) + 138)}>
            T+2 · settles {flowDate(row().trade.settlementDate)}<br />
            {row().pendingSale ? "Pending sale · " : ""}{row().cashAvailableDate ? `Cash available ${flowDate(row().cashAvailableDate!)}` : "Add calendar for cash availability"}
            <Show when={completedAfter(index()) && !canFundNext(row(), completedAfter(index())!)}><br />Next buy uses existing cash</Show>
          </span>
          <button type="button" class={`${node} border-dashed bg-surface-2`} style={place(row().paymentPosition, y(index()) + 194)} onClick={() => select(item)}
            aria-label={`${row().trade.ticker} dividend, ${flowMoney(row().trade.netDividend)}, yield ${flowPercent(row().dividendYield)}, payment ${row().trade.paymentDate}${row().pendingDividend ? ", pending after plan end" : ""}`}>
            <span class={label}>{row().trade.ticker} · {row().pendingDividend ? "Pending dividend" : "Dividend"} · {flowDate(row().trade.paymentDate)}</span>
            <span class="mt-50 flex items-baseline justify-between gap-50"><strong class="font-700 tabular-nums">{flowMoney(row().trade.netDividend)}</strong><span class="text-50 tabular-nums">{flowPercent(row().dividendYield)}</span></span>
            <span class="mt-50 block text-50 text-muted">Net payment · joins available cash</span>
          </button>
        </>}</Show>
        <Show when={item.status === "skipped" ? item : undefined}>{row => <button type="button" class={`${node} border-dashed`} style={place(row().purchasePosition, y(index()) + 18)} onClick={() => select(item)}>
          <span class={label}>Skipped · {row().trade.purchaseDate || "No date"}</span><strong class="mt-50 block text-200">{row().trade.ticker}</strong><span class="mt-50 block text-50 text-muted">{row().trade.reason}</span>
        </button>}</Show>
      </>}</For>
    </div>
  </div>;
}
