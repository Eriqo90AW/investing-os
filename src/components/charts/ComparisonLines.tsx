import { For, createMemo, createSignal } from "solid-js";
import { LineSeries, type ISeriesApi, type MouseEventParams } from "lightweight-charts";
import { ChartFrame, ChartSurface, type LegendItem } from "../ChartFrame";
import { createThemedChart, type ChartTokens } from "~/lib/chart-theme";
import { COMPARISON, type Point } from "~/lib/market-data";

const HEIGHT = 300;

/** Fixed slot order. Color follows the asset, never its rank in the current view. */
const ASSETS = [
  { key: "BTC", label: "Bitcoin", slot: 0, data: COMPARISON.BTC },
  { key: "ETH", label: "Ethereum", slot: 1, data: COMPARISON.ETH },
  { key: "SOL", label: "Solana", slot: 2, data: COMPARISON.SOL },
  { key: "XRP", label: "XRP", slot: 3, data: COMPARISON.XRP },
] as const;

type AssetKey = (typeof ASSETS)[number]["key"];

/**
 * Four assets at wildly different dollar prices, compared on ONE axis by
 * rebasing each to 100 at the first bar. This is the fix for the dual-axis
 * temptation, not a workaround for it.
 *
 * Toggling a series hides it without recoloring the survivors — identity is
 * bound to the asset, so BTC is slot 1 orange whether it is alone or in company.
 */
export function ComparisonLines() {
  let container: HTMLDivElement | undefined;
  const series = new Map<AssetKey, ISeriesApi<"Line">>();

  const [hidden, setHidden] = createSignal<Set<AssetKey>>(new Set());
  const [hoverTime, setHoverTime] = createSignal<string | null>(null);
  const [hoverValues, setHoverValues] = createSignal<Partial<Record<AssetKey, number>>>({});

  const isHidden = (k: AssetKey) => hidden().has(k);

  function toggle(k: AssetKey) {
    const next = new Set(hidden());
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setHidden(next);
    series.get(k)?.applyOptions({ visible: !next.has(k) });
  }

  createThemedChart({
    container: () => container,
    height: HEIGHT,
    options: () => ({
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.14, bottom: 0.1 } },
    }),
    build: (chart, t) => {
      for (const asset of ASSETS) {
        const s = chart.addSeries(LineSeries, lineColors(t, asset.slot, asset.key));
        s.setData(asset.data as unknown as Point[]);
        series.set(asset.key, s);
      }

      const onMove = (param: MouseEventParams) => {
        if (!param.time) {
          setHoverTime(null);
          setHoverValues({});
          return;
        }
        const next: Partial<Record<AssetKey, number>> = {};
        for (const asset of ASSETS) {
          const s = series.get(asset.key);
          if (!s) continue;
          const p = param.seriesData.get(s) as { value?: number } | undefined;
          if (p?.value !== undefined) next[asset.key] = p.value;
        }
        setHoverTime(String(param.time));
        setHoverValues(next);
      };
      chart.subscribeCrosshairMove(onMove);

      return {
        retheme: tokens => {
          for (const asset of ASSETS) {
            series.get(asset.key)?.applyOptions(lineColors(tokens, asset.slot, asset.key));
          }
        },
        dispose: () => chart.unsubscribeCrosshairMove(onMove),
      };
    },
    ready: chart => chart.timeScale().fitContent(),
  });

  const lastValues = createMemo(() => {
    const out: Record<string, number> = {};
    for (const a of ASSETS) out[a.key] = a.data[a.data.length - 1]?.value ?? 100;
    return out;
  });

  const legend = (): LegendItem[] =>
    ASSETS.filter(a => !isHidden(a.key)).map(a => ({
      label: a.key,
      color: `var(--c-chart-series-${a.slot + 1})`,
      value: (hoverValues()[a.key] ?? lastValues()[a.key] ?? 100).toFixed(1),
    }));

  return (
    <ChartFrame
      title="Relative performance, rebased to 100"
      note="Four assets on one axis. Toggle a series off — the others keep their colors."
      secondaryValue={() => (
        <div class="text-75 text-caption tabular-nums">
          {hoverTime() ?? `${ASSETS[0].data[0]?.time} → ${ASSETS[0].data[ASSETS[0].data.length - 1]?.time}`}
        </div>
      )}
      legend={legend}
    >
      <div class="flex flex-wrap gap-100 pb-150">
        <For each={ASSETS}>
          {asset => (
            <button
              type="button"
              aria-pressed={!isHidden(asset.key)}
              onClick={() => toggle(asset.key)}
              class="inline-flex items-center gap-100 px-150 py-[6px] rounded-100 text-75 font-500 border transition cursor-pointer"
              classList={{
                "bg-surface-2 text-ink border-line hover:border-hairline": !isHidden(asset.key),
                "bg-transparent text-caption border-line line-through": isHidden(asset.key),
              }}
            >
              <span
                aria-hidden="true"
                class="w-[10px] h-[10px] rounded-[3px] shrink-0 transition-opacity"
                style={{
                  background: `var(--c-chart-series-${asset.slot + 1})`,
                  opacity: isHidden(asset.key) ? "0.3" : "1",
                }}
              />
              {asset.label}
            </button>
          )}
        </For>
      </div>
      <ChartSurface
        height={HEIGHT}
        ref={el => (container = el)}
        label="Bitcoin, Ethereum, Solana and XRP rebased to 100 over 180 days of sample data."
      />
    </ChartFrame>
  );
}

function lineColors(t: ChartTokens, slot: number, title: string) {
  return {
    color: t.series[slot % 4]!,
    lineWidth: 2 as const,
    title, // drawn on the price axis — the direct label, so identity is never color-alone
    priceLineVisible: false,
    lastValueVisible: true,
    crosshairMarkerRadius: 3,
    crosshairMarkerBorderColor: t.surface,
  };
}

export default ComparisonLines;
