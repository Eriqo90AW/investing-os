import { For, createMemo } from "solid-js";
import { ChartFrame } from "../../ChartFrame";
import { ChartCanvas, ChartTip, createTip, divColor, inkOn, signed } from "./parts";
import { MONTHLY_RETURNS, MONTHS } from "~/lib/chart-data";

const CELL = 60;
const CELL_H = 36;
const GAP = 2; // surface gap, same width everywhere
const LABEL_W = 48;
const HEAD_H = 22;
const W = LABEL_W + MONTHS.length * CELL;
const H = HEAD_H + MONTHLY_RETURNS.length * CELL_H + 4;

/**
 * Monthly returns as a grid. The reader's question is "which way, and how far
 * from flat", so the encoding is diverging — two reserved direction hues
 * around a neutral midpoint. A sequential ramp here would be a lie: it would
 * put -9% and +9% at opposite ends of one hue and make zero look like a value
 * rather than the pivot.
 *
 * A month that hasn't closed is a hole in the grid, never a zero-coloured cell.
 */
export function ReturnsHeatmap() {
  /**
   * Snapped up to an even number so the band boundary (half of it) lands on a
   * clean figure. Without the snap the legend has to round and then states a
   * threshold the chart isn't using — a −4.8% cell sitting in the "≤ −5%" band.
   */
  const scale = createMemo(() => {
    const peak = Math.max(
      ...MONTHLY_RETURNS.flatMap(r => r.months.map(m => Math.abs(m ?? 0))),
    );
    return Math.max(2, Math.ceil(peak / 2) * 2);
  });
  const edge = () => scale() / 2;
  const { tip, clear, at } = createTip();

  return (
    <ChartFrame
      title="Monthly total return"
      note="Diverging, centred on zero, with the reserved direction pair at the poles and a neutral grey in the middle. Unclosed months are left empty rather than drawn as flat."
      legend={() => [
        { label: `≤ −${edge()}%`, color: "var(--c-chart-div-neg-2)" },
        { label: `−${edge()}% to 0`, color: "var(--c-chart-div-neg-1)" },
        { label: "flat", color: "var(--c-chart-div-mid)" },
        { label: `0 to +${edge()}%`, color: "var(--c-chart-div-pos-1)" },
        { label: `≥ +${edge()}%`, color: "var(--c-chart-div-pos-2)" },
      ]}
    >
      <ChartCanvas width={W}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          class="h-auto block w-full"
          role="img"
          aria-label={`Monthly total return by year, ${MONTHLY_RETURNS[0]!.year} to ${
            MONTHLY_RETURNS[MONTHLY_RETURNS.length - 1]!.year
          }.`}
        >
          <For each={MONTHS}>
            {(m, i) => (
              <text
                x={LABEL_W + i() * CELL + CELL / 2}
                y={HEAD_H - 8}
                text-anchor="middle"
                fill="var(--c-chart-axis-text)"
                style={{ "font-size": "11px" }}
              >
                {m}
              </text>
            )}
          </For>

          <For each={MONTHLY_RETURNS}>
            {(row, ri) => (
              <>
                <text
                  x={LABEL_W - 10}
                  y={HEAD_H + ri() * CELL_H + CELL_H / 2}
                  text-anchor="end"
                  dominant-baseline="middle"
                  fill="var(--c-chart-axis-text)"
                  style={{ "font-size": "11px", "font-variant-numeric": "tabular-nums" }}
                >
                  {row.year}
                </text>
                <For each={row.months}>
                  {(value, mi) => {
                    const x = () => LABEL_W + mi() * CELL;
                    const y = () => HEAD_H + ri() * CELL_H;
                    if (value === null) {
                      return (
                        <rect
                          x={x() + GAP / 2}
                          y={y() + GAP / 2}
                          width={CELL - GAP}
                          height={CELL_H - GAP}
                          rx="2"
                          fill="none"
                          stroke="var(--c-chart-grid)"
                          stroke-width="1"
                        />
                      );
                    }
                    const fill = divColor(value, scale());
                    const showTip = (e: { currentTarget: SVGElement }) =>
                      at(
                        e,
                        { x: x() + CELL / 2, y: y(), width: W },
                        {
                          title: `${MONTHS[mi()]} ${row.year}`,
                          rows: [
                            { label: "total return", value: signed(value, 1), color: fill },
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
                          {MONTHS[mi()]} {row.year}: {signed(value, 1)}
                        </title>
                        <rect
                          x={x() + GAP / 2}
                          y={y() + GAP / 2}
                          width={CELL - GAP}
                          height={CELL_H - GAP}
                          rx="2"
                          fill={fill}
                          class="transition-opacity hover:opacity-80"
                        />
                        <text
                          x={x() + CELL / 2}
                          y={y() + CELL_H / 2}
                          text-anchor="middle"
                          dominant-baseline="middle"
                          fill={inkOn(fill)}
                          style={{ "font-size": "11px", "font-variant-numeric": "tabular-nums" }}
                        >
                          {value.toFixed(1)}
                        </text>
                      </g>
                    );
                  }}
                </For>
              </>
            )}
          </For>
        </svg>
        <ChartTip state={tip()} />
      </ChartCanvas>
    </ChartFrame>
  );
}

export default ReturnsHeatmap;
