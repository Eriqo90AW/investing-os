import { For } from "solid-js";
import { Sparkline } from "./Sparkline";
import { MARKET_ROWS } from "~/lib/market-data";

function Delta(props: { value: number }) {
  const up = () => props.value >= 0;
  return (
    <span
      class="inline-flex items-baseline justify-end gap-[3px] font-600 tabular-nums whitespace-nowrap"
      classList={{ "text-pos": up(), "text-neg": !up() }}
    >
      {/* The glyph is the non-colour half of the direction encoding, so it has
          to stay welded to the number it qualifies — inline-flex + nowrap, not
          two inline spans the line box is free to break between. */}
      <span aria-hidden="true" class="text-50 leading-none">
        {up() ? "▲" : "▼"}
      </span>
      <span class="sr-only">{up() ? "up" : "down"}</span>
      <span>{Math.abs(props.value).toFixed(2)}%</span>
    </span>
  );
}

/**
 * The component the whole system exists to serve: 60px rows, one hairline
 * between them, no elevation, and color spent only on direction.
 */
export function MarketTable() {
  return (
    <div class="rounded-200 border border-line bg-surface-1 overflow-x-auto">
      <table class="w-full min-w-[980px] border-collapse text-100">
        <caption class="sr-only">
          Sample cryptocurrency market data: rank, name, price, one-hour,
          twenty-four-hour and seven-day change, market cap, volume, circulating
          supply and a seven-day trend line.
        </caption>
        <thead>
          <tr class="text-75 font-500 text-muted border-b border-line">
            <th scope="col" class="w-10 py-150 pl-250 pr-100">
              <span class="sr-only">Watchlist</span>
            </th>
            <th scope="col" class="w-12 text-left font-500 py-150 pr-100">#</th>
            <th scope="col" class="text-left font-500 py-150 pr-200">Name</th>
            <th scope="col" class="text-right font-500 py-150 px-150">Price</th>
            <th scope="col" class="text-right font-500 py-150 px-150">1h %</th>
            <th scope="col" class="text-right font-500 py-150 px-150">24h %</th>
            <th scope="col" class="text-right font-500 py-150 px-150">7d %</th>
            <th scope="col" class="text-right font-500 py-150 px-150">Market Cap</th>
            <th scope="col" class="text-right font-500 py-150 px-150">Volume (24h)</th>
            <th scope="col" class="text-right font-500 py-150 px-150">Circulating Supply</th>
            <th scope="col" class="text-right font-500 py-150 pl-150 pr-250">Last 7 Days</th>
          </tr>
        </thead>
        <tbody>
          <For each={MARKET_ROWS}>
            {row => (
              <tr
                tabindex="0"
                class="border-b border-line last:border-0 hover:bg-surface-2 focus-visible:bg-surface-2 transition-colors"
              >
                <td class="py-200 pl-250 pr-100">
                  <button
                    type="button"
                    aria-label={`Add ${row.name} to watchlist`}
                    class="text-caption hover:text-reminder transition-colors cursor-pointer"
                  >
                    ★
                  </button>
                </td>
                <td class="py-200 pr-100 text-muted tabular-nums">{row.rank}</td>
                <td class="py-200 pr-200">
                  <div class="flex items-center gap-150">
                    <span
                      aria-hidden="true"
                      class="grid place-items-center w-6 h-6 rounded-full text-50 font-700 text-white shrink-0"
                      style={{ background: row.brand }}
                    >
                      {row.ticker.charAt(0)}
                    </span>
                    <span class="font-600 text-ink">{row.name}</span>
                    <span class="text-75 text-caption">{row.ticker}</span>
                  </div>
                </td>
                <td class="py-200 px-150 text-right font-600 tabular-nums">{row.price}</td>
                <td class="py-200 px-150 text-right"><Delta value={row.h1} /></td>
                <td class="py-200 px-150 text-right"><Delta value={row.h24} /></td>
                <td class="py-200 px-150 text-right"><Delta value={row.d7} /></td>
                <td class="py-200 px-150 text-right tabular-nums">{row.marketCap}</td>
                <td class="py-200 px-150 text-right tabular-nums">
                  {row.volume}
                  <div class="text-75 text-caption tabular-nums">{row.volumeCoin}</div>
                </td>
                <td class="py-200 px-150 text-right tabular-nums">{row.supply}</td>
                <td class="py-200 pl-150 pr-250 text-right">
                  <Sparkline
                    points={row.spark}
                    rising={row.d7 >= 0}
                    label={`${row.name} seven-day trend, ${row.d7 >= 0 ? "up" : "down"} ${Math.abs(row.d7).toFixed(2)} percent`}
                  />
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
