import { For, createMemo } from "solid-js";
import { ChartFrame } from "../../ChartFrame";
import { AxisText, ChartTip, GridLine, barPath, createTip } from "./parts";
import { RETURN_BINS, RETURN_MEAN } from "~/lib/chart-data";

const W = 620;
const H = 280;
const PAD = { top: 20, right: 16, bottom: 46, left: 44 };
const GAP = 2; // surface gap between neighbouring columns

/**
 * Distribution of daily returns. One series, so no legend box — the title
 * already says what is plotted, and a single swatch would only restate it.
 *
 * Deliberately NOT coloured by sign. Green-below-zero / red-above would look
 * like the direction tokens doing their usual job, but a histogram bin is a
 * count, not a return: the height is the data and the fill is just the mark.
 * One accent hue throughout, and the zero rule does the dividing.
 */
export function ReturnHistogram() {
  const total = RETURN_BINS.reduce((sum, b) => sum + b.count, 0);
  const max = createMemo(() => Math.max(...RETURN_BINS.map(b => b.count)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / RETURN_BINS.length;

  const lo = RETURN_BINS[0]!.from;
  const hi = RETURN_BINS[RETURN_BINS.length - 1]!.to;
  const xOf = (v: number) => PAD.left + ((v - lo) / (hi - lo)) * plotW;
  const yOf = (count: number) => PAD.top + plotH - (count / max()) * plotH;

  const ticks = createMemo(() => {
    const step = 50;
    const out: number[] = [];
    for (let t = 0; t <= max(); t += step) out.push(t);
    return out;
  });

  const { tip, setTip, clear } = createTip();

  return (
    <ChartFrame
      title="Distribution of daily returns"
      note="756 sessions in one-point bins. One hue throughout: the bar height is a count, not a return, so the direction tokens would be saying something untrue."
      hero={() => (
        <>
          <div class="text-600 font-700">{`+${RETURN_MEAN.toFixed(2)}%`}</div>
          <div class="text-75 text-muted">mean daily return</div>
        </>
      )}
      tableHead={["Bin", "Sessions", "Share"]}
      tableRows={() =>
        RETURN_BINS.map(b => [
          `${b.from > 0 ? "+" : ""}${b.from}% to ${b.to > 0 ? "+" : ""}${b.to}%`,
          String(b.count),
          `${((b.count / total) * 100).toFixed(1)}%`,
        ])
      }
    >
      <div class="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          class="w-full h-auto block overflow-visible"
          role="img"
          aria-label={`Distribution of ${total} daily returns across ${RETURN_BINS.length} one-point bins. The table view below lists every bin.`}
        >
          <For each={ticks()}>
            {t => (
              <>
                <GridLine x1={PAD.left} y1={yOf(t)} x2={W - PAD.right} y2={yOf(t)} />
                <AxisText x={PAD.left - 10} y={yOf(t)} anchor="end">
                  {t}
                </AxisText>
              </>
            )}
          </For>

          <For each={RETURN_BINS}>
            {(bin, i) => {
              const x = () => PAD.left + i() * band + GAP / 2;
              const w = () => band - GAP;
              const top = () => yOf(bin.count);
              const show = (e: { currentTarget: SVGElement }) => {
                const svg = e.currentTarget.ownerSVGElement!;
                const s = svg.getBoundingClientRect().width / W;
                setTip({
                  x: (x() + w() / 2) * s,
                  y: top() * s,
                  title: `${bin.from > 0 ? "+" : ""}${bin.from}% to ${bin.to > 0 ? "+" : ""}${bin.to}%`,
                  rows: [
                    { label: "sessions", value: String(bin.count), color: "var(--c-chart-series-1)" },
                    { label: "of total", value: `${((bin.count / total) * 100).toFixed(1)}%` },
                  ],
                });
              };
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
                    {bin.from}% to {bin.to}%: {bin.count} sessions
                  </title>
                  <rect
                    x={PAD.left + i() * band}
                    y={PAD.top}
                    width={band}
                    height={plotH}
                    fill="transparent"
                  />
                  <path
                    d={barPath(x(), top(), w(), PAD.top + plotH - top(), "top")}
                    fill="var(--c-chart-series-1)"
                    class="transition-opacity hover:opacity-80"
                  />
                </g>
              );
            }}
          </For>

          {/* Baseline and the zero-return rule: the two lines that mean
              something, both solid hairlines, neither of them dashed. */}
          <GridLine
            x1={PAD.left}
            y1={PAD.top + plotH}
            x2={W - PAD.right}
            y2={PAD.top + plotH}
          />
          <line
            x1={xOf(RETURN_MEAN)}
            y1={PAD.top - 4}
            x2={xOf(RETURN_MEAN)}
            y2={PAD.top + plotH}
            stroke="var(--c-chart-crosshair)"
            stroke-width="2"
          />
          <text
            x={xOf(RETURN_MEAN) + 6}
            y={PAD.top + 4}
            fill="var(--c-color-text-secondary)"
            style={{ "font-size": "11px", "font-weight": 600 }}
          >
            mean
          </text>

          <For each={RETURN_BINS}>
            {(bin, i) =>
              i() % 2 === 0 ? (
                <AxisText x={xOf(bin.from)} y={H - PAD.bottom + 18}>
                  {`${bin.from > 0 ? "+" : ""}${bin.from}%`}
                </AxisText>
              ) : null
            }
          </For>
          <AxisText x={PAD.left + plotW / 2} y={H - 8}>
            Daily return
          </AxisText>
        </svg>
        <ChartTip state={tip()} width={W} />
      </div>
    </ChartFrame>
  );
}

export default ReturnHistogram;
