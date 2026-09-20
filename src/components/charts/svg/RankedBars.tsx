import { For, createMemo } from "solid-js";
import { ChartFrame } from "../../ChartFrame";
import { AxisText, ChartCanvas, ChartTip, barPath, createTip, signed } from "./parts";
import { MOVERS } from "~/lib/chart-data";

const W = 900;
const ROW = 30;
const BAR = 18; // <= 24px: the band's leftover is air, not mark
const LABEL_W = 120;
const VALUE_W = 78;
const PAD_T = 26;

/**
 * Ranked movers. This is the form the pie above cannot be: sorted, on a shared
 * baseline, so "is Financials ahead of Healthcare" is answered by which bar is
 * longer rather than by comparing two wedge angles.
 *
 * Colour is the reserved direction pair, because the question is polarity —
 * and direction is never carried by colour alone, so the sign travels with the
 * value at every bar's tip.
 */
export function RankedBars() {
  const H = PAD_T + MOVERS.length * ROW + 18;
  const plotW = W - LABEL_W - VALUE_W;
  const zero = LABEL_W + plotW / 2;
  const domain = createMemo(() => Math.max(...MOVERS.map(m => Math.abs(m.change))) * 1.12);
  const scale = (v: number) => (v / domain()) * (plotW / 2);

  const { tip, clear, at } = createTip();

  /**
   * Every bar is already direct-labelled with its value, so the tooltip is not
   * repeating the chart — it adds the full company name, which only fits here.
   */
  function show(
    m: (typeof MOVERS)[number],
    up: boolean,
    len: number,
    y: number,
    color: string,
    e: { currentTarget: SVGElement },
  ) {
    at(
      e,
      { x: up ? zero + len : zero - len, y, width: W },
      { rows: [{ label: m.label, value: signed(m.change), color }] },
    );
  }

  return (
    <ChartFrame
      title="Today's movers"
      note="Sorted, on one shared baseline, diverging around zero. The honest form whenever the question is ranking rather than share."
    >
      <ChartCanvas width={W}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          class="w-full h-auto block overflow-visible"
          role="img"
          aria-label={`Daily change by company: ${MOVERS.map(
            m => `${m.label} ${m.change > 0 ? "up" : "down"} ${Math.abs(m.change)} percent`,
          ).join(", ")}.`}
        >
          {/* The zero rule is the baseline every bar grows from — it carries
              more meaning than a grid, so it is the only vertical line here. */}
          <line
            x1={zero}
            y1={PAD_T - 8}
            x2={zero}
            y2={H - 14}
            stroke="var(--c-chart-grid)"
            stroke-width="1"
            shape-rendering="crispEdges"
          />
          <AxisText x={zero} y={PAD_T - 16}>
            0%
          </AxisText>

          <For each={MOVERS}>
            {(m, i) => {
              const y = () => PAD_T + i() * ROW + (ROW - BAR) / 2;
              const up = () => m.change >= 0;
              const len = () => Math.abs(scale(m.change));
              const color = () => (up() ? "var(--c-chart-up)" : "var(--c-chart-down)");

              return (
                <g
                  tabindex="0"
                  class="outline-none cursor-pointer"
                  onPointerEnter={e => show(m, up(), len(), y(), color(), e)}
                  onPointerLeave={clear}
                  onFocus={e => show(m, up(), len(), y(), color(), e)}
                  onBlur={clear}
                >
                  <title>
                    {m.label}: {signed(m.change)}
                  </title>
                  {/* Hit target spans the whole band, not just the painted bar. */}
                  <rect x="0" y={PAD_T + i() * ROW} width={W} height={ROW} fill="transparent" />
                  <text
                    x={LABEL_W - 12}
                    y={y() + BAR / 2}
                    text-anchor="end"
                    dominant-baseline="middle"
                    fill="var(--c-color-text-secondary)"
                    style={{ "font-size": "12px" }}
                  >
                    {m.ticker}
                  </text>
                  <path
                    d={
                      up()
                        ? barPath(zero, y(), len(), BAR, "right")
                        : barPath(zero - len(), y(), len(), BAR, "left")
                    }
                    fill={color()}
                    class="transition-opacity hover:opacity-80"
                  />
                  <text
                    x={up() ? zero + len() + 8 : zero - len() - 8}
                    y={y() + BAR / 2}
                    text-anchor={up() ? "start" : "end"}
                    dominant-baseline="middle"
                    fill="var(--c-color-text-primary)"
                    style={{ "font-size": "12px", "font-weight": 600, "font-variant-numeric": "tabular-nums" }}
                  >
                    {signed(m.change)}
                  </text>
                </g>
              );
            }}
          </For>
        </svg>
        <ChartTip state={tip()} />
      </ChartCanvas>
    </ChartFrame>
  );
}

export default RankedBars;
