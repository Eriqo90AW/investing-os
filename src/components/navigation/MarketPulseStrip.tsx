import { For } from "solid-js";
import type { MarketSnapshot } from "~/lib/dashboard-data";

export function MarketPulseStrip(props: { markets: MarketSnapshot[] }) {
  return (
    <div class="border-b border-line bg-bg-2 overflow-x-auto" aria-label="Mock market overview">
      <div class="mx-auto max-w-[1440px] min-w-max px-200 h-9 flex items-center gap-300">
        <span class="inline-flex items-center gap-100 text-50 font-700 uppercase tracking-[.08em] text-accent">
          <span class="w-1.5 h-1.5 rounded-full bg-accent-fill" aria-hidden="true" />
          Mock market
        </span>
        <For each={props.markets}>
          {market => (
            <span class="inline-flex items-center gap-100 text-75 tabular-nums">
              <span class="font-600 text-ink">{market.symbol}</span>
              <span class="text-muted">{market.value}</span>
              <span
                class="font-600"
                classList={{ "text-pos": market.change >= 0, "text-neg": market.change < 0 }}
              >
                {market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%
              </span>
            </span>
          )}
        </For>
      </div>
    </div>
  );
}
