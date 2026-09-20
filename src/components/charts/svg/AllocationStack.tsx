import { For } from "solid-js";
import { ChartFrame, type LegendItem } from "../../ChartFrame";
import { ChartCanvas, ChartTip, createTip, inkOn, pct, slotColor } from "./parts";
import { ALLOCATION_BY_QUARTER, ALLOCATION_PARTS } from "~/lib/chart-data";

const W = 900;
const ROW = 52;
const BAR = 24; // the cap, not a target
const LABEL_W = 78;
const GAP = 2; // the surface gap — white does the separating, not a stroke

/**
 * Part-to-whole *over time*, which is the case the pie genuinely cannot take.
 * Four stacked bars on a common 0–100 scale: the reader tracks one band's
 * width across four rows and sees drift, and the totals still tie out because
 * every row is normalised to the same length.
 *
 * Segments are separated by a 2px gap in the surface colour, never by a stroke
 * around each segment — a stroke adds ink that isn't data.
 */
export function AllocationStack() {
  const H = ALLOCATION_BY_QUARTER.length * ROW + 12;
  const plotW = W - LABEL_W - 8;
  const { tip, clear, at } = createTip();

  const legend = (): LegendItem[] =>
    ALLOCATION_PARTS.map((label, i) => ({
      label,
      color: slotColor(i === ALLOCATION_PARTS.length - 1 ? null : i),
    }));

  return (
    <ChartFrame
      title="Allocation drift by quarter"
      note="100% stacked bars. Same five parts as the pie, but four periods deep — the shape of the change is the story, not any single slice."
      legend={legend}
    >
      <ChartCanvas width={W}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          class="w-full h-auto block overflow-visible"
          role="img"
          aria-label={`Portfolio allocation by quarter. ${ALLOCATION_BY_QUARTER.map(
            r =>
              `${r.label}: ${r.parts
                .map((p, i) => `${ALLOCATION_PARTS[i]} ${p} percent`)
                .join(", ")}`,
          ).join(". ")}.`}
        >
          <For each={ALLOCATION_BY_QUARTER}>
            {(row, ri) => {
              const y = () => ri() * ROW + 18;
              let cursor = LABEL_W;

              return (
                <>
                  <text
                    x={0}
                    y={y() + BAR / 2}
                    dominant-baseline="middle"
                    fill="var(--c-color-text-secondary)"
                    style={{ "font-size": "12px", "font-variant-numeric": "tabular-nums" }}
                  >
                    {row.label}
                  </text>
                  <For each={row.parts}>
                    {(part, pi) => {
                      const full = (part / 100) * plotW;
                      const isLast = pi() === row.parts.length - 1;
                      const x = cursor;
                      // Every segment but the last gives up the gap on its
                      // right edge, so the gaps stay one consistent width.
                      const w = Math.max(0, full - (isLast ? 0 : GAP));
                      cursor += full;
                      const color = slotColor(isLast ? null : pi());
                      const label = ALLOCATION_PARTS[pi()]!;
                      const showTip = (e: { currentTarget: SVGElement }) =>
                        at(
                          e,
                          { x: x + w / 2, y: y(), width: W },
                          { title: row.label, rows: [{ label, value: pct(part), color }] },
                        );

                      return (
                        <g
                          tabindex="0"
                          class="outline-none cursor-pointer"
                          onPointerEnter={e => showTip(e)}
                          onPointerLeave={clear}
                          onFocus={e => showTip(e)}
                          onBlur={clear}
                        >
                          <title>
                            {row.label} · {label}: {pct(part)}
                          </title>
                          <rect
                            x={x}
                            y={y()}
                            width={w}
                            height={BAR}
                            fill={color}
                            class="transition-opacity hover:opacity-80"
                          />
                          {/* Only label a segment wide enough to hold the text
                              with padding on both sides. Interior segments have
                              no free end to spill onto, so a label that doesn't
                              fit is dropped, not clipped. */}
                          {w > 46 && (
                            <text
                              x={x + w / 2}
                              y={y() + BAR / 2}
                              text-anchor="middle"
                              dominant-baseline="middle"
                              fill={inkOn(color)}
                              style={{
                                "font-size": "11px",
                                "font-weight": 600,
                                "font-variant-numeric": "tabular-nums",
                              }}
                            >
                              {part.toFixed(0)}%
                            </text>
                          )}
                        </g>
                      );
                    }}
                  </For>
                </>
              );
            }}
          </For>
        </svg>
        <ChartTip state={tip()} />
      </ChartCanvas>
    </ChartFrame>
  );
}

export default AllocationStack;
