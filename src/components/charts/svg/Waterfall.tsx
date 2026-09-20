import { For, createMemo } from "solid-js";
import { ChartFrame } from "../../ChartFrame";
import { AxisText, ChartCanvas, ChartTip, GridLine, barPath, createTip } from "./parts";
import { ATTRIBUTION } from "~/lib/chart-data";

const W = 620;
const H = 300;
const PAD = { top: 18, right: 12, bottom: 44, left: 52 };
const BAR = 24; // the mark cap — the band's leftover is air

const money = (n: number) => `$${n.toFixed(1)}M`;
const delta = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(1)}M`;

interface Column {
  label: string;
  /** Plot-space top and bottom of the floating bar. */
  from: number;
  to: number;
  value: number;
  total: boolean;
}

/**
 * The bridge. Two anchored totals with signed deltas floating between them,
 * each starting where the last one finished — so the chart *proves* that the
 * parts add up to the difference rather than asserting it.
 *
 * Deltas take the reserved direction pair; the two totals are deliberately
 * neutral, because a total has no direction to report.
 */
export function Waterfall() {
  const columns = createMemo<Column[]>(() => {
    let running = 0;
    return ATTRIBUTION.map(step => {
      if (step.total) {
        running = step.value;
        return { label: step.label, from: 0, to: step.value, value: step.value, total: true };
      }
      const from = running;
      running += step.value;
      return { label: step.label, from, to: running, value: step.value, total: false };
    });
  });

  const max = createMemo(() => Math.max(...columns().flatMap(c => [c.from, c.to])) * 1.08);
  const plotH = H - PAD.top - PAD.bottom;
  const plotW = W - PAD.left - PAD.right;
  const band = () => plotW / columns().length;
  const y = (v: number) => PAD.top + plotH - (v / max()) * plotH;
  const ticks = createMemo(() => {
    const step = 50;
    const out: number[] = [];
    for (let t = 0; t <= max(); t += step) out.push(t);
    return out;
  });

  const { tip, clear, at } = createTip();

  return (
    <ChartFrame
      title="Contribution to net asset value"
      note="A bridge from opening to closing NAV. The deltas sum to the gap between the two grey totals — that arithmetic is the whole reason the form exists."
      legend={() => [
        { label: "Added", color: "var(--c-chart-up)" },
        { label: "Subtracted", color: "var(--c-chart-down)" },
        { label: "Total", color: "var(--c-chart-other)" },
      ]}
    >
      <ChartCanvas width={W}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          class="w-full h-auto block overflow-visible"
          role="img"
          aria-label={`Contribution to net asset value from ${money(
            ATTRIBUTION[0]!.value,
          )} to ${money(ATTRIBUTION[ATTRIBUTION.length - 1]!.value)}.`}
        >
          <For each={ticks()}>
            {t => (
              <>
                <GridLine x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} />
                <AxisText x={PAD.left - 10} y={y(t)} anchor="end">
                  {`$${t}M`}
                </AxisText>
              </>
            )}
          </For>

          <For each={columns()}>
            {(col, i) => {
              const cx = () => PAD.left + i() * band() + band() / 2;
              const top = () => Math.min(y(col.from), y(col.to));
              const height = () => Math.max(2, Math.abs(y(col.to) - y(col.from)));
              const fill = () =>
                col.total
                  ? "var(--c-chart-other)"
                  : col.value >= 0
                    ? "var(--c-chart-up)"
                    : "var(--c-chart-down)";
              const showTip = (e: { currentTarget: SVGElement }) =>
                at(
                  e,
                  { x: cx(), y: top(), width: W },
                  {
                    rows: [
                      {
                        label: col.label,
                        value: col.total ? money(col.value) : delta(col.value),
                        color: fill(),
                      },
                    ],
                  },
                );

              return (
                <g
                  tabindex="0"
                  class="outline-none cursor-pointer"
                  onPointerEnter={showTip}
                  onPointerLeave={clear}
                  onFocus={showTip}
                  onBlur={clear}
                >
                  <title>
                    {col.label}: {col.total ? money(col.value) : delta(col.value)}
                  </title>
                  <rect
                    x={cx() - band() / 2}
                    y={PAD.top}
                    width={band()}
                    height={plotH}
                    fill="transparent"
                  />
                  {/* The connector carries the "starts where the last finished"
                      claim. Hairline, so it never competes with the columns. */}
                  {i() > 0 && !col.total && (
                    <line
                      x1={cx() - band() / 2}
                      y1={y(col.from)}
                      x2={cx() - BAR / 2}
                      y2={y(col.from)}
                      stroke="var(--c-chart-crosshair)"
                      stroke-width="1"
                    />
                  )}
                  <path
                    d={barPath(
                      cx() - BAR / 2,
                      top(),
                      BAR,
                      height(),
                      col.total || col.value >= 0 ? "top" : "bottom",
                    )}
                    fill={fill()}
                    class="transition-opacity hover:opacity-80"
                  />
                  <text
                    x={cx()}
                    y={top() - 8}
                    text-anchor="middle"
                    fill="var(--c-color-text-primary)"
                    style={{
                      "font-size": "11px",
                      "font-weight": 600,
                      "font-variant-numeric": "tabular-nums",
                    }}
                  >
                    {col.total ? money(col.value) : delta(col.value)}
                  </text>
                  <text
                    x={cx()}
                    y={H - PAD.bottom + 18}
                    text-anchor="middle"
                    fill="var(--c-chart-axis-text)"
                    style={{ "font-size": "11px" }}
                  >
                    {col.label}
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

export default Waterfall;
