import { createMemo, createSignal } from "solid-js";
import { BaselineSeries, type MouseEventParams } from "lightweight-charts";
import { ChartFrame, ChartSurface, type LegendItem } from "../ChartFrame";
import { createThemedChart, type ChartTokens } from "~/lib/chart-theme";
import { PNL, PNL_BASELINE, type Point } from "~/lib/market-data";

const HEIGHT = 260;

/**
 * The one genuinely diverging measure on the page: unrealised P&L has a real
 * zero, and which side of it you are on is the whole question. Two poles, a
 * neutral midpoint at the baseline — and the sign is printed as well as
 * colored, so the polarity never rests on hue alone.
 */
export function PnlBaseline() {
  let container: HTMLDivElement | undefined;
  const last = PNL[PNL.length - 1]!;
  const [hovered, setHovered] = createSignal<Point | null>(null);
  const shown = createMemo(() => hovered() ?? last);

  createThemedChart({
    container: () => container,
    height: HEIGHT,
    build: (chart, t) => {
      const series = chart.addSeries(BaselineSeries, baselineColors(t));
      series.setData(PNL);

      const onMove = (param: MouseEventParams) => {
        if (!param.time) {
          setHovered(null);
          return;
        }
        const p = param.seriesData.get(series) as { value?: number } | undefined;
        setHovered(
          p?.value === undefined ? null : { time: String(param.time), value: p.value },
        );
      };
      chart.subscribeCrosshairMove(onMove);

      return {
        retheme: tokens => series.applyOptions(baselineColors(tokens)),
        dispose: () => chart.unsubscribeCrosshairMove(onMove),
      };
    },
    ready: chart => chart.timeScale().fitContent(),
  });

  const legend = (): LegendItem[] => [
    { label: "Above cost basis", color: "var(--c-chart-up)" },
    { label: "Below cost basis", color: "var(--c-chart-down)" },
    { label: "Cost basis", color: "var(--c-color-text-caption)", dashed: true },
  ];

  return (
    <ChartFrame
      title="Unrealised P&L vs cost basis"
      note="A diverging measure with a true zero: two poles, neutral midpoint, no rainbow."
      primaryValue={() => (
        <div
          class="text-400 font-700 tabular-nums"
          classList={{ "text-pos": shown().value >= 0, "text-neg": shown().value < 0 }}
        >
          {shown().value >= 0 ? "+" : "−"}$
          {Math.abs(shown().value).toLocaleString("en-US")}
        </div>
      )}
      secondaryValue={() => (
        <div class="text-75 text-caption tabular-nums">{shown().time}</div>
      )}
      legend={legend}
    >
      <ChartSurface
        height={HEIGHT}
        ref={el => (container = el)}
        label="Unrealised profit and loss against cost basis over 180 days of sample data."
      />
    </ChartFrame>
  );
}

function baselineColors(t: ChartTokens) {
  return {
    baseValue: { type: "price" as const, price: PNL_BASELINE },
    topLineColor: t.up,
    topFillColor1: t.upFill,
    topFillColor2: "rgba(0,0,0,0)",
    bottomLineColor: t.down,
    bottomFillColor1: "rgba(0,0,0,0)",
    bottomFillColor2: t.downFill,
    lineWidth: 2 as const,
    priceLineVisible: false,
    crosshairMarkerBorderColor: t.surface,
  };
}

export default PnlBaseline;
