import { createMemo, createSignal } from "solid-js";
import { AreaSeries, type MouseEventParams } from "lightweight-charts";
import { ChartFrame, ChartSurface } from "../ChartFrame";
import { compact, createThemedChart, type ChartTokens } from "~/lib/chart-theme";
import { PORTFOLIO, type Point } from "~/lib/market-data";

const HEIGHT = 260;

/**
 * One series, so there is no legend box — the title names it. The area fill is
 * the accent at low alpha fading to zero, which keeps the line itself the only
 * thing at full contrast.
 */
export function PortfolioArea() {
  let container: HTMLDivElement | undefined;
  const first = PORTFOLIO[0]!;
  const last = PORTFOLIO[PORTFOLIO.length - 1]!;
  const [hovered, setHovered] = createSignal<Point | null>(null);

  const shown = createMemo(() => hovered() ?? last);
  const change = createMemo(() => ((shown().value - first.value) / first.value) * 100);

  createThemedChart({
    container: () => container,
    height: HEIGHT,
    build: (chart, t) => {
      const area = chart.addSeries(AreaSeries, areaColors(t));
      area.setData(PORTFOLIO);

      const onMove = (param: MouseEventParams) => {
        if (!param.time) {
          setHovered(null);
          return;
        }
        const p = param.seriesData.get(area) as { value?: number } | undefined;
        setHovered(
          p?.value === undefined ? null : { time: String(param.time), value: p.value },
        );
      };
      chart.subscribeCrosshairMove(onMove);

      return {
        retheme: tokens => area.applyOptions(areaColors(tokens)),
        dispose: () => chart.unsubscribeCrosshairMove(onMove),
      };
    },
    ready: chart => chart.timeScale().fitContent(),
  });

  return (
    <ChartFrame
      title="Portfolio net asset value"
      note="Single series, 180 days. Since inception, indexed in dollars rather than percent."
      hero={() => (
        <>
          <div class="text-600 font-700 tabular-nums">{compact(shown().value, "$")}</div>
          <div
            class="text-100 font-600 tabular-nums"
            classList={{ "text-pos": change() >= 0, "text-neg": change() < 0 }}
          >
            {change() >= 0 ? "▲" : "▼"} {Math.abs(change()).toFixed(2)}%
            <span class="text-caption font-400"> · {shown().time}</span>
          </div>
        </>
      )}
      tableHead={["Date", "NAV"]}
      tableRows={() =>
        PORTFOLIO.filter((_, i) => i % 20 === 0 || i === PORTFOLIO.length - 1).map(p => [
          p.time,
          `$${p.value.toLocaleString("en-US")}`,
        ])
      }
    >
      <ChartSurface
        height={HEIGHT}
        ref={el => (container = el)}
        label="Portfolio net asset value over 180 days of sample data. The table view below lists the same figures."
      />
    </ChartFrame>
  );
}

function areaColors(t: ChartTokens) {
  return {
    lineColor: t.series[0],
    topColor: t.areaTop,
    bottomColor: t.areaBottom,
    lineWidth: 2 as const,
    priceLineVisible: false,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: t.surface,
    crosshairMarkerBackgroundColor: t.series[0],
  };
}

export default PortfolioArea;
