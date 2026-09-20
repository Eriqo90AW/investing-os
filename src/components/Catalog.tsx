import { For, createSignal } from "solid-js";
import { SubHeading, Lede } from "./Foundations";
import { SentimentGauge } from "./charts/svg/SentimentGauge";

const TABS = ["Top", "Trending", "Watchlist", "Gainers", "New"] as const;
const CHIPS = ["All", "DeFi", "Layer 1", "Stablecoins", "RWA", "Memes"] as const;

export function Buttons() {
  return (
    <>
      <SubHeading>Buttons</SubHeading>
      <div class="mt-200 rounded-200 border border-line bg-surface-1 p-250 flex flex-col gap-250">
        <div class="flex flex-wrap items-center gap-150">
          <button type="button" class="h-9 px-200 rounded-100 text-100 font-600 text-on-accent bg-accent-fill hover:bg-accent-fill-hover transition cursor-pointer">
            Primary
          </button>
          <button type="button" class="h-9 px-200 rounded-100 text-100 font-600 text-ink bg-surface-2 border border-line hover:border-hairline transition cursor-pointer">
            Secondary
          </button>
          <button type="button" class="h-9 px-200 rounded-100 text-100 font-600 text-ink hover:bg-surface-2 transition cursor-pointer">
            Ghost
          </button>
          <button
            type="button"
            class="h-9 px-200 rounded-100 text-100 font-600 text-white transition cursor-pointer"
            style={{ background: "var(--c-color-red-500)" }}
          >
            Danger
          </button>
          <button
            type="button"
            disabled
            class="h-9 px-200 rounded-100 text-100 font-600 text-caption bg-surface-2 border border-line cursor-not-allowed"
          >
            Disabled
          </button>
        </div>
        <div class="flex flex-wrap items-end gap-150">
          <button type="button" class="h-7 px-150 rounded-100 text-75 font-600 text-on-accent bg-accent-fill hover:bg-accent-fill-hover transition cursor-pointer">
            Small · 28px
          </button>
          <button type="button" class="h-9 px-200 rounded-100 text-100 font-600 text-on-accent bg-accent-fill hover:bg-accent-fill-hover transition cursor-pointer">
            Medium · 36px
          </button>
          <button type="button" class="h-11 px-300 rounded-100 text-200 font-600 text-on-accent bg-accent-fill hover:bg-accent-fill-hover transition cursor-pointer">
            Large · 44px
          </button>
        </div>
      </div>
    </>
  );
}

export function TabsAndChips() {
  const [tab, setTab] = createSignal<string>(TABS[0]);
  const [chip, setChip] = createSignal<string>(CHIPS[0]);

  return (
    <div>
      <SubHeading>Tabs</SubHeading>
      <Lede>
        Active gets a 2px <code class="text-75">accent</code> underline. Scrolls
        sideways; never wraps.
      </Lede>
      <div class="mt-200 rounded-200 border border-line bg-surface-1 px-250 overflow-x-auto">
        <div class="flex items-center gap-300 text-100 font-600 whitespace-nowrap" role="tablist">
          <For each={TABS}>
            {t => (
              <button
                role="tab"
                type="button"
                aria-selected={tab() === t}
                onClick={() => setTab(t)}
                class="py-200 border-b-2 transition-colors cursor-pointer"
                classList={{
                  "text-ink border-accent": tab() === t,
                  "text-muted border-transparent hover:text-ink": tab() !== t,
                }}
              >
                {t}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="mt-400">
        <SubHeading>Chips</SubHeading>
        <div class="mt-200 rounded-200 border border-line bg-surface-1 p-250 flex flex-wrap gap-100">
          <For each={CHIPS}>
            {c => (
              <button
                type="button"
                aria-pressed={chip() === c}
                onClick={() => setChip(c)}
                class="px-150 py-[6px] rounded-100 text-75 font-500 border transition cursor-pointer"
                classList={{
                  "bg-official-bg text-accent border-transparent": chip() === c,
                  "bg-surface-2 text-ink border-line hover:border-hairline": chip() !== c,
                }}
              >
                {c}
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

export function BadgesAndInputs() {
  return (
    <div>
      <SubHeading>Badges</SubHeading>
      <Lede>
        Uppercase, <code class="text-75">radius-10</code>, 11px/600. Each pairs a
        foreground with its own background token.
      </Lede>
      <div class="mt-200 rounded-200 border border-line bg-surface-1 p-250 flex flex-wrap gap-100">
        <span class="px-100 py-[3px] rounded-10 text-50 font-600 uppercase tracking-[.02em] bg-pos-bg text-pos">Gainer</span>
        <span class="px-100 py-[3px] rounded-10 text-50 font-600 uppercase tracking-[.02em] bg-neg-bg text-neg">Loser</span>
        <span class="px-100 py-[3px] rounded-10 text-50 font-600 uppercase tracking-[.02em] bg-official-bg text-official">Verified</span>
        <span class="px-100 py-[3px] rounded-10 text-50 font-600 uppercase tracking-[.02em] bg-reminder-bg text-reminder">Unaudited</span>
        <span class="px-100 py-[3px] rounded-10 text-50 font-600 uppercase tracking-[.02em] bg-noaccess-bg text-noaccess">Pro only</span>
      </div>

      <div class="mt-400">
        <SubHeading>Inputs</SubHeading>
        <div class="mt-200 rounded-200 border border-line bg-surface-1 p-250 flex flex-col gap-150">
          <div>
            <label for="in-default" class="block text-75 font-500 text-muted mb-50">Default</label>
            <input
              id="in-default"
              type="text"
              placeholder="Search a coin, pair or address"
              class="w-full h-10 px-150 rounded-100 bg-surface-2 border border-line text-100 text-ink placeholder:text-caption outline-none focus-visible:border-accent transition"
            />
          </div>
          <div>
            <label for="in-error" class="block text-75 font-500 text-muted mb-50">Error</label>
            <input
              id="in-error"
              type="text"
              value="0x00"
              aria-describedby="in-error-msg"
              class="w-full h-10 px-150 rounded-100 bg-surface-2 text-100 text-ink outline-none transition"
              style={{ border: "1px solid var(--c-color-red-500)" }}
            />
            <p id="in-error-msg" class="mt-50 text-75 text-neg">
              That address is 4 characters long. Paste the full 42-character address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const MARKET_CAP_TREND = [2.56, 2.59, 2.57, 2.63, 2.66, 2.64, 2.7, 2.68, 2.73, 2.75, 2.72, 2.78];
const VOLUME_PROFILE = [42, 51, 46, 62, 71, 58, 78, 92, 84, 69, 63, 55];

function MarketCapTrend() {
  const width = 240;
  const height = 64;
  const inset = 3;
  const min = Math.min(...MARKET_CAP_TREND);
  const max = Math.max(...MARKET_CAP_TREND);
  const points = MARKET_CAP_TREND.map((value, index) => ({
    x: inset + (index / (MARKET_CAP_TREND.length - 1)) * (width - inset * 2),
    y: inset + ((max - value) / (max - min)) * (height - inset * 2),
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const area = `${line} L${points.at(-1)!.x} ${height} L${points[0]!.x} ${height} Z`;

  return (
    <figure class="mt-auto pt-200" role="img" aria-label="Market cap rose from 2.56 to 2.78 trillion dollars over seven days.">
      <div class="flex items-center justify-between text-50 text-caption tabular-nums">
        <span>7D · $2.56T low</span>
        <span>$2.81T high</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} class="mt-100 block w-full h-[64px]" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="market-cap-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--c-chart-up)" stop-opacity=".28" />
            <stop offset="1" stop-color="var(--c-chart-up)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#market-cap-fill)" />
        <path d={line} fill="none" stroke="var(--c-chart-up)" stroke-width="2" vector-effect="non-scaling-stroke" />
        <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r="3.5" fill="var(--c-chart-up)" />
        <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r="1.5" fill="var(--c-color-surface-1)" />
      </svg>
    </figure>
  );
}

function VolumeProfile() {
  const max = Math.max(...VOLUME_PROFILE);

  return (
    <figure class="mt-auto pt-200" role="img" aria-label="Hourly volume peaked during the middle of the last 24 hours and has eased since.">
      <div class="flex items-end justify-between gap-[5px] h-[68px] border-b border-line" aria-hidden="true">
        <For each={VOLUME_PROFILE}>
          {(value, index) => (
            <span
              class="flex-1 rounded-t-[3px]"
              style={{
                height: `${Math.max(8, (value / max) * 100)}%`,
                background: index() >= VOLUME_PROFILE.length - 3
                  ? "var(--c-chart-series-1)"
                  : "var(--c-color-gray-300)",
                opacity: index() >= VOLUME_PROFILE.length - 3 ? 1 : 0.72,
              }}
            />
          )}
        </For>
      </div>
      <figcaption class="mt-100 flex items-center justify-between text-50 text-caption tabular-nums">
        <span>24 hours ago</span>
        <span>Peak $11.8B/h</span>
        <span>Now</span>
      </figcaption>
    </figure>
  );
}

function LiquidationSplit() {
  return (
    <figure class="mt-auto pt-200" role="img" aria-label="Of 801.52 million dollars liquidated, 612.8 million were long positions and 188.72 million were short positions.">
      <div class="flex items-center justify-between text-50 font-600 tabular-nums">
        <span class="text-neg">Longs · $612.8M</span>
        <span class="text-pos">Shorts · $188.72M</span>
      </div>
      <div class="mt-100 flex h-4 overflow-hidden rounded-50 bg-surface-2" aria-hidden="true">
        <span class="h-full" style={{ width: "76.5%", background: "var(--c-chart-down)" }} />
        <span class="h-full border-l-2 border-surface-1" style={{ width: "23.5%", background: "var(--c-chart-up)" }} />
      </div>
      <figcaption class="mt-150 flex items-center justify-between text-50 text-caption">
        <span>76.5% long positions</span>
        <span class="inline-flex items-center gap-50">
          <span class="h-1.5 w-1.5 rounded-full bg-neg" aria-hidden="true" />
          Leverage flush
        </span>
      </figcaption>
    </figure>
  );
}

export function StatTiles() {
  return (
    <>
      <SubHeading>Stat tiles</SubHeading>
      <Lede>
        Reserved for the market-overview strip, where the figures really are the point of
        the screen — not a general-purpose card.
      </Lede>
      <div class="mt-200 grid gap-150 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div class="min-h-[216px] rounded-200 border border-line bg-surface-1 p-200 flex flex-col">
          <div class="text-75 font-500 text-muted">Market Cap</div>
          <div class="mt-50 flex items-center justify-between gap-100">
            <div class="text-600 font-700 tabular-nums">$2.78T</div>
            <div class="inline-flex items-center px-100 py-[3px] rounded-10 text-50 font-600 bg-pos-bg text-pos">▲ 5.49%</div>
          </div>
          <MarketCapTrend />
        </div>
        <div class="min-h-[216px] rounded-200 border border-line bg-surface-1 p-200 flex flex-col">
          <div class="text-75 font-500 text-muted">24h Volume</div>
          <div class="mt-50 flex items-center justify-between gap-100">
            <div class="text-600 font-700 tabular-nums">$184.22B</div>
            <div class="inline-flex items-center px-100 py-[3px] rounded-10 text-50 font-600 bg-neg-bg text-neg">▼ 2.14%</div>
          </div>
          <VolumeProfile />
        </div>
        <div class="min-h-[216px] rounded-200 border border-line bg-surface-1 p-200 flex flex-col">
          <div class="text-75 font-500 text-muted">Liquidations (24h)</div>
          <div class="mt-50 flex items-center justify-between gap-100">
            <div class="text-600 font-700 tabular-nums">$801.52M</div>
            <div class="inline-flex items-center px-100 py-[3px] rounded-10 text-50 font-600 bg-neg-bg text-neg">▲ 324.28%</div>
          </div>
          <LiquidationSplit />
        </div>
        {/* The one tile whose value is a position on a named scale rather than
            a magnitude, so it gets the dial instead of the meter bar. */}
        <div class="min-h-[216px] rounded-200 border border-line bg-surface-1 p-200">
          <div class="text-75 font-500 text-muted">Fear &amp; Greed</div>
          <div class="mt-50">
            <SentimentGauge value={74} label="Fear and Greed" />
          </div>
        </div>
      </div>
    </>
  );
}

export function TickerStrip() {
  return (
    <div class="w-full bg-bg-2 border-b border-line overflow-x-auto">
      <div class="mx-auto max-w-[1280px] px-200 py-100 flex items-center gap-300 whitespace-nowrap text-75 text-muted">
        <span>Cryptos: <b class="text-ink font-600 tabular-nums">19,428,113</b></span>
        <span>Exchanges: <b class="text-ink font-600 tabular-nums">842</b></span>
        <span>
          Market Cap: <b class="text-ink font-600 tabular-nums">$2.78T</b>{" "}
          <b class="text-pos font-600">▲ 5.49%</b>
        </span>
        <span>
          24h Vol: <b class="text-ink font-600 tabular-nums">$184.22B</b>{" "}
          <b class="text-neg font-600">▼ 2.14%</b>
        </span>
        <span>
          Dominance: <b class="text-ink font-600 tabular-nums">BTC 58.4%</b>{" "}
          <span class="text-caption">ETH 12.9%</span>
        </span>
        <span>ETH Gas: <b class="text-ink font-600 tabular-nums">0.42 Gwei</b></span>
        <span>Fear &amp; Greed: <b class="text-pos font-600 tabular-nums">74</b></span>
      </div>
    </div>
  );
}

export function Pagination() {
  return (
    <div class="mt-250 flex flex-wrap items-center gap-150 justify-between">
      <p class="text-75 text-caption">Showing 1–6 of 19,428,113 assets</p>
      <nav aria-label="Pagination" class="flex items-center gap-50">
        <button type="button" disabled class="h-8 px-150 rounded-50 text-100 font-600 text-caption cursor-not-allowed">‹</button>
        <button type="button" aria-current="page" class="w-8 h-8 rounded-50 text-100 font-600 text-on-accent bg-accent-fill cursor-pointer">1</button>
        <button type="button" class="w-8 h-8 rounded-50 text-100 font-600 text-ink hover:bg-surface-2 transition cursor-pointer">2</button>
        <button type="button" class="w-8 h-8 rounded-50 text-100 font-600 text-ink hover:bg-surface-2 transition cursor-pointer">3</button>
        <span class="px-100 text-100 text-caption">…</span>
        <button type="button" class="w-8 h-8 rounded-50 text-100 font-600 text-ink hover:bg-surface-2 transition cursor-pointer">99</button>
        <button type="button" class="h-8 px-150 rounded-50 text-100 font-600 text-ink hover:bg-surface-2 transition cursor-pointer">›</button>
      </nav>
    </div>
  );
}
