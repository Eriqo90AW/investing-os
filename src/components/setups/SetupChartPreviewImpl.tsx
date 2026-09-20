import { createMemo } from "solid-js";
import { CandlestickSeries } from "lightweight-charts";
import { ChartFrame, ChartSurface } from "../ChartFrame";
import { createThemedChart } from "~/lib/chart-theme";
import { setupCandles } from "~/lib/setup-generator";

const HEIGHT = 220;

export interface SetupChartPreviewProps {
  ticker: string;
}

/**
 * Seeded daily candlestick preview for the setup being edited. The series is
 * derived from the ticker's hash, so SSR, hydration and every later visit see
 * the same chart. Chrome and colors come entirely from the chart tokens via
 * `createThemedChart` — nothing here is hardcoded.
 */
export default function SetupChartPreview(props: SetupChartPreviewProps) {
  let container: HTMLDivElement | undefined;

  const data = createMemo(() => setupCandles(props.ticker));
  const last = createMemo(() => data()[data().length - 1]);
  const first = createMemo(() => data()[0]);
  const changePct = createMemo(() => {
    const f = first();
    const l = last();
    if (!f || !l) return 0;
    return ((l.close - f.open) / f.open) * 100;
  });

  createThemedChart({
    container: () => container,
    height: HEIGHT,
    build: (chart, t) => {
      const price = chart.addSeries(CandlestickSeries, {
        upColor: t.up,
        downColor: t.down,
        borderUpColor: t.up,
        borderDownColor: t.down,
        wickUpColor: t.up,
        wickDownColor: t.down,
      });
      price.setData(setupCandles(props.ticker));

      chart.priceScale("right").applyOptions({
        scaleMargins: { top: 0.12, bottom: 0.12 },
      });

      return {
        retheme: tokens => {
          price.applyOptions({
            upColor: tokens.up,
            downColor: tokens.down,
            borderUpColor: tokens.up,
            borderDownColor: tokens.down,
            wickUpColor: tokens.up,
            wickDownColor: tokens.down,
          });
        },
      };
    },
    ready: chart => chart.timeScale().fitContent(),
  });

  const positive = () => changePct() >= 0;

  return (
    <ChartFrame
      title={`${props.ticker.toUpperCase()} · daily`}
      note="Seeded sample series for layout preview — not live market data."
      primaryValue={() => <div class="text-200 font-700 tabular-nums">${last()?.close.toFixed(2) ?? "—"}</div>}
      secondaryValue={() => (
        <div
          class="text-75 font-600 tabular-nums"
          classList={{ "text-pos": positive(), "text-neg": !positive() }}
        >
          <span aria-hidden="true">{positive() ? "▲" : "▼"}</span>
          <span class="sr-only">{positive() ? "up" : "down"}</span>{" "}
          {Math.abs(changePct()).toFixed(2)}%
        </div>
      )}
    >
      <ChartSurface
        height={HEIGHT}
        ref={el => (container = el)}
        label={`${props.ticker.toUpperCase()} daily candlestick preview, 120 sessions of seeded sample data.`}
      />
    </ChartFrame>
  );
}
