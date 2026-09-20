import { For } from "solid-js";
import type { MarketSnapshot } from "~/lib/dashboard-data";

function StripItems(props: { markets: MarketSnapshot[] }) {
  return (
    <For each={props.markets}>
      {market => (
        <span class="inline-flex shrink-0 items-center gap-100 text-75 tabular-nums">
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
  );
}

export function MarketPulseStrip(props: { markets: MarketSnapshot[] }) {
  // Two identical halves: translating the track by -50% loops seamlessly,
  // so the strip drifts right-to-left like a market ticker.
  const duration = () => `${Math.max(24, props.markets.length * 4)}s`;

  return (
    <div class="border-b border-line bg-bg-2 overflow-hidden" aria-label="Mock market overview">
      <div class="mx-auto max-w-[1440px] px-200 h-9 flex items-center gap-300">
        <span class="inline-flex shrink-0 items-center gap-100 text-50 font-700 uppercase tracking-[.08em] text-accent">
          <span class="w-1.5 h-1.5 rounded-full bg-accent-fill" aria-hidden="true" />
          Mock market
        </span>
        <div class="ticker-viewport min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
          <div class="ticker-track flex w-max" style={{ "animation-duration": duration() }}>
            <div class="flex items-center gap-300 pr-300">
              <StripItems markets={props.markets} />
            </div>
            <div class="flex items-center gap-300 pr-300" aria-hidden="true">
              <StripItems markets={props.markets} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
