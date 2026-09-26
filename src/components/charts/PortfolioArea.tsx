import { createMemo, createSignal } from "solid-js";
import { AreaSeries, type MouseEventParams } from "lightweight-charts";
import { ChartFrame, ChartSurface } from "../ChartFrame";
import { compact, createThemedChart, type ChartTokens } from "~/lib/chart-theme";
import { PORTFOLIO, type Point } from "~/lib/market-data";

const DEFAULT_HEIGHT = 260;

export interface PortfolioAreaProps {
  data?: Point[];
  title?: string;
  note?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}

/**
 * One series, so there is no legend box — the title names it. The area fill is
 * the accent at low alpha fading to zero, which keeps the line itself the only
 * thing at full contrast.
 */
export function PortfolioArea(props: PortfolioAreaProps = {}) {
  let container: HTMLDivElement | undefined;
  const data = () => props.data ?? PORTFOLIO;
  const height = () => props.height ?? DEFAULT_HEIGHT;
  const first = data()[0]!;
  const last = data()[data().length - 1]!;
  const [hovered, setHovered] = createSignal<Point | null>(null);

  const shown = createMemo(() => hovered() ?? last);
  const change = createMemo(() => ((shown().value - first.value) / first.value) * 100);

  createThemedChart({
    container: () => container,
    height: height(),
    build: (chart, t) => {
      const area = chart.addSeries(AreaSeries, areaColors(t));
      area.setData(data());

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
      title={props.title ?? "Portfolio net asset value"}
      note={props.note ?? "Single series, 180 days. Since inception, indexed in dollars rather than percent."}
      primaryValue={() => (
        <div class="text-400 font-700 tabular-nums">{props.valueFormatter ? props.valueFormatter(shown().value) : compact(shown().value, "$")}</div>
      )}
      secondaryValue={() => (
        <div
          class="text-100 font-600 tabular-nums"
          classList={{ "text-pos": change() >= 0, "text-neg": change() < 0 }}
        >
          {change() >= 0 ? "▲" : "▼"} {Math.abs(change()).toFixed(2)}%
        </div>
      )}
    >
      <ChartSurface
        height={height()}
        ref={el => (container = el)}
        label={`${props.title ?? "Portfolio net asset value"} over ${data().length} days of sample data.`}
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
