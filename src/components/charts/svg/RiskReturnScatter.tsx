import { For, createMemo } from "solid-js";
import { ChartFrame } from "../../ChartFrame";
import { AxisText, ChartCanvas, ChartTip, GridLine, createTip, signed, slotColor } from "./parts";
import { RISK_RETURN } from "~/lib/chart-data";

const W = 620;
const H = 340;
const PAD = { top: 16, right: 16, bottom: 46, left: 52 };
const R = 6; // >= 8px mark
/** Transparent hit radius. ~31px across at full width — the ~24px floor with
    room to spare, since the mark itself is only 12px. */
const HIT = 16;

/**
 * Risk against return. Two measures, two axes — which is not the dual-axis
 * mistake: a scatter's axes carry two *different variables*, not two scales
 * for the same one.
 *
 * All-pairs forms cap at three identities in this system, so three names are
 * highlighted and the rest of the field is the de-emphasised tail. That is
 * emphasis, not a shortage of hues: the chart is about where those three sit
 * relative to everything else.
 */
export function RiskReturnScatter() {
  const xMax = createMemo(() => Math.ceil(Math.max(...RISK_RETURN.map(p => p.risk)) / 10) * 10 + 5);
  const yMin = createMemo(() => Math.floor(Math.min(...RISK_RETURN.map(p => p.ret)) / 10) * 10 - 5);
  const yMax = createMemo(() => Math.ceil(Math.max(...RISK_RETURN.map(p => p.ret)) / 10) * 10 + 5);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (v: number) => PAD.left + (v / xMax()) * plotW;
  const y = (v: number) => PAD.top + plotH - ((v - yMin()) / (yMax() - yMin())) * plotH;

  const yTicks = createMemo(() => {
    const out: number[] = [];
    for (let t = Math.ceil(yMin() / 20) * 20; t <= yMax(); t += 20) out.push(t);
    return out;
  });
  const xTicks = createMemo(() => {
    const out: number[] = [];
    for (let t = 0; t <= xMax(); t += 10) out.push(t);
    return out;
  });

  const { tip, clear, at } = createTip();

  /**
   * Direct labels ride to the right of their dot, except where that would lay
   * the text over a neighbour — then they go left instead. Nudging them
   * vertically would detach them from their dot, which reads as noise; the
   * legend is carrying identity regardless, so this only has to stay tidy.
   */
  const named = RISK_RETURN.filter(p => p.slot !== null);
  const labelsLeft = (p: (typeof RISK_RETURN)[number]) =>
    named.some(
      o =>
        o !== p &&
        x(o.risk) - x(p.risk) > 0 &&
        x(o.risk) - x(p.risk) < 60 &&
        Math.abs(y(o.ret) - y(p.ret)) < 20,
    );

  return (
    <ChartFrame
      title="Risk against return, trailing 12 months"
      note="Three named holdings against the rest of the field. An all-pairs form, so identity caps at three — a fourth hue is legal on adjacent bars and is not legal on scattered dots."
      legend={() => [
        ...RISK_RETURN.filter(p => p.slot !== null).map(p => ({
          label: p.label,
          color: slotColor(p.slot),
        })),
        { label: "Rest of sector", color: "var(--c-chart-other)" },
      ]}
    >
      <ChartCanvas width={W}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          class="w-full h-auto block overflow-visible"
          role="img"
          aria-label={`Annualised volatility against annualised return for ${RISK_RETURN.length} semiconductor companies.`}
        >
          <For each={yTicks()}>
            {t => (
              <>
                <GridLine x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} />
                <AxisText x={PAD.left - 10} y={y(t)} anchor="end">
                  {`${t}%`}
                </AxisText>
              </>
            )}
          </For>

          {/* Zero return is the line that matters here, so it gets one step
              more weight than the grid and nothing else does. */}
          <line
            x1={PAD.left}
            y1={y(0)}
            x2={W - PAD.right}
            y2={y(0)}
            stroke="var(--c-chart-crosshair)"
            stroke-width="1"
          />

          <For each={xTicks()}>
            {t => (
              <AxisText x={x(t)} y={H - PAD.bottom + 18}>
                {`${t}%`}
              </AxisText>
            )}
          </For>
          <AxisText x={PAD.left + plotW / 2} y={H - 8}>
            Annualised volatility
          </AxisText>

          {/* Field first, named holdings on top — emphasis is a paint order as
              much as a palette. */}
          <For each={[...RISK_RETURN].sort((a, b) => (a.slot === null ? -1 : 1))}>
            {p => {
              const color = slotColor(p.slot);
              const show = (e: { currentTarget: SVGElement }) =>
                at(
                  e,
                  { x: x(p.risk), y: y(p.ret) - R, width: W },
                  {
                    title: p.ticker,
                    rows: [
                      { label: "return", value: signed(p.ret, 1), color },
                      { label: "volatility", value: `${p.risk.toFixed(1)}%` },
                    ],
                  },
                );
              return (
                <g
                  tabindex="0"
                  class="outline-none cursor-pointer"
                  onPointerEnter={show}
                  onPointerLeave={clear}
                  onFocus={show}
                  onBlur={clear}
                >
                  <title>
                    {p.label}: {p.risk.toFixed(1)}% volatility, {signed(p.ret, 1)} return
                  </title>
                  <circle cx={x(p.risk)} cy={y(p.ret)} r={HIT} fill="transparent" />
                  {/* 2px surface ring, so overlapping dots stay countable. */}
                  <circle
                    cx={x(p.risk)}
                    cy={y(p.ret)}
                    r={R}
                    fill={color}
                    stroke="var(--c-color-surface-1)"
                    stroke-width="2"
                    class="transition-opacity hover:opacity-80"
                  />
                  {p.slot !== null && (
                    <text
                      x={labelsLeft(p) ? x(p.risk) - R - 6 : x(p.risk) + R + 6}
                      y={y(p.ret)}
                      text-anchor={labelsLeft(p) ? "end" : "start"}
                      dominant-baseline="middle"
                      fill="var(--c-color-text-primary)"
                      style={{ "font-size": "11px", "font-weight": 600 }}
                    >
                      {p.ticker}
                    </text>
                  )}
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

export default RiskReturnScatter;
