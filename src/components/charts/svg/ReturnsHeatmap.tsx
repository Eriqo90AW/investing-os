import { For, createMemo } from "solid-js";
import { ChartFrame } from "../../ChartFrame";
import { ChartTip, createTip, divColor, inkOn, signed } from "./parts";
import { MONTHLY_RETURNS, MONTHS } from "~/lib/chart-data";

const CELL = 44;
const CELL_H = 32;
const GAP = 2; // surface gap, same width everywhere
const LABEL_W = 44;
const HEAD_H = 20;
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
  const scale = createMemo(() =>
    Math.max(
      ...MONTHLY_RETURNS.flatMap(r => r.months.map(m => Math.abs(m ?? 0))),
    ),
  );
  const { tip, setTip, clear } = createTip();

  return (
    <ChartFrame
      title="Monthly total return"
      note="Diverging, centred on zero, with the reserved direction pair at the poles and a neutral grey in the middle. Unclosed months are left empty rather than drawn as flat."
      legend={() => [
        { label: `≤ −${(scale() / 2).toFixed(0)}%`, color: "var(--c-chart-div-neg-2)" },
        { label: "below flat", color: "var(--c-chart-div-neg-1)" },
        { label: "above flat", color: "var(--c-chart-div-pos-1)" },
        { label: `≥ +${(scale() / 2).toFixed(0)}%`, color: "var(--c-chart-div-pos-2)" },
      ]}
      tableHead={["Year", ...MONTHS]}
      tableRows={() =>
        MONTHLY_RETURNS.map(r => [
          String(r.year),
          ...r.months.map(m => (m === null ? "—" : signed(m, 1))),
        ])
      }
    >
      <div class="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          class="h-auto block min-w-[560px] w-full"
          role="img"
          aria-label={`Monthly total return by year, ${MONTHLY_RETURNS[0]!.year} to ${
            MONTHLY_RETURNS[MONTHLY_RETURNS.length - 1]!.year
          }. The table view below lists every figure.`}
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
                    return (
                      <g
                        tabindex="0"
                        class="outline-none cursor-pointer"
                        onPointerEnter={e => {
                          const svg = e.currentTarget.ownerSVGElement!;
                          const s = svg.getBoundingClientRect().width / W;
                          setTip({
                            x: (x() + CELL / 2) * s,
                            y: y() * s,
                            title: `${MONTHS[mi()]} ${row.year}`,
                            rows: [{ label: "total return", value: signed(value, 1), color: fill }],
                          });
                        }}
                        onPointerLeave={clear}
                        onFocus={e => {
                          const svg = e.currentTarget.ownerSVGElement!;
                          const s = svg.getBoundingClientRect().width / W;
                          setTip({
                            x: (x() + CELL / 2) * s,
                            y: y() * s,
                            title: `${MONTHS[mi()]} ${row.year}`,
                            rows: [{ label: "total return", value: signed(value, 1), color: fill }],
                          });
                        }}
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
                          style={{ "font-size": "10px", "font-variant-numeric": "tabular-nums" }}
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
        <ChartTip state={tip()} width={W} />
      </div>
    </ChartFrame>
  );
}

export default ReturnsHeatmap;
