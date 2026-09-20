import { createMemo, createSignal } from "solid-js";
import {
  CandlestickSeries,
  HistogramSeries,
  type MouseEventParams,
} from "lightweight-charts";
import { ChartFrame, ChartSurface, type LegendItem } from "../ChartFrame";
import { compact, createThemedChart, type ChartTokens } from "~/lib/chart-theme";
import { BTC_CANDLES, BTC_VOLUME, type Candle } from "~/lib/market-data";

const HEIGHT = 380;

/**
 * Price and volume are two different measures, so they get two panes sharing
 * one time axis — never two y-scales on one plot. Direction is encoded by the
 * candle body AND by its position relative to the open, so the red/green pair
 * is reinforcement rather than the only signal.
 */
export function PriceChart() {
  let container: HTMLDivElement | undefined;
  const last = BTC_CANDLES[BTC_CANDLES.length - 1]!;
  const [hovered, setHovered] = createSignal<Candle | null>(null);

  const shown = createMemo(() => hovered() ?? last);
  const change = createMemo(() => {
    const c = shown();
    return ((c.close - c.open) / c.open) * 100;
  });

  createThemedChart({
    container: () => container,
    height: HEIGHT,
    build: (chart, t) => {
      const price = chart.addSeries(CandlestickSeries, candleColors(t));
      price.setData(BTC_CANDLES);

      const volume = chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
        },
        1,
      );
      volume.setData(volumeBars(t));

      const panes = chart.panes();
      panes[0]?.setStretchFactor(3);
      panes[1]?.setStretchFactor(1);

      chart.priceScale("right").applyOptions({
        scaleMargins: { top: 0.1, bottom: 0.1 },
      });

      const onMove = (param: MouseEventParams) => {
        if (!param.time) {
          setHovered(null);
          return;
        }
        const bar = param.seriesData.get(price) as Candle | undefined;
        setHovered(bar ?? null);
      };
      chart.subscribeCrosshairMove(onMove);

      return {
        retheme: tokens => {
          price.applyOptions(candleColors(tokens));
          volume.setData(volumeBars(tokens));
        },
        dispose: () => chart.unsubscribeCrosshairMove(onMove),
      };
    },
    ready: chart => chart.timeScale().fitContent(),
  });

  const legend = (): LegendItem[] => {
    const c = shown();
    return [
      { label: "Open", color: "var(--c-color-text-caption)", value: usd(c.open) },
      { label: "High", color: "var(--c-chart-up)", value: usd(c.high) },
      { label: "Low", color: "var(--c-chart-down)", value: usd(c.low) },
      { label: "Close", color: "var(--c-color-text-primary)", value: usd(c.close) },
    ];
  };

  return (
    <ChartFrame
      title="BTC / USD · daily"
      note="Candlesticks with volume in its own pane. 180 sessions of sample data — hover to read a bar."
      primaryValue={() => (
        <div class="text-400 font-700 tabular-nums">{usd(shown().close)}</div>
      )}
      secondaryValue={() => (
        <div
          class="text-100 font-600 tabular-nums"
          classList={{ "text-pos": change() >= 0, "text-neg": change() < 0 }}
        >
          {change() >= 0 ? "▲" : "▼"} {Math.abs(change()).toFixed(2)}%
          <span class="text-caption font-400"> · {shown().time}</span>
        </div>
      )}
      legend={legend}
    >
      <ChartSurface
        height={HEIGHT}
        ref={el => (container = el)}
        label="Bitcoin daily candlestick chart with volume, 180 sessions of sample data."
      />
    </ChartFrame>
  );
}

function candleColors(t: ChartTokens) {
  return {
    upColor: t.up,
    downColor: t.down,
    borderUpColor: t.up,
    borderDownColor: t.down,
    wickUpColor: t.up,
    wickDownColor: t.down,
    priceLineColor: t.crosshair,
  };
}

function volumeBars(t: ChartTokens) {
  return BTC_VOLUME.map((bar, i) => {
    const candle = BTC_CANDLES[i]!;
    return {
      time: bar.time,
      value: bar.value,
      color: candle.close >= candle.open ? t.volumeUp : t.volumeDown,
    };
  });
}

function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default PriceChart;
