import { For, createMemo } from "solid-js";
import { ChartFrame } from "../../ChartFrame";
import { ChartCanvas, ChartTip, createTip, divColor, inkOn, pct, signed } from "./parts";
import { MARKET_SHARE, type ShareNode } from "~/lib/chart-data";

const SIZE = 400;
/**
 * Half the 2px surface gap — each tile gives this up on every side. A tile
 * narrower than the gap itself (a fraction-of-a-percent name) would otherwise
 * inset itself out of existence, so the inset yields to the tile.
 */
const INSET = 1;
const insetFor = (w: number, h: number) => Math.min(INSET, w / 4, h / 4);

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Worst aspect ratio in a candidate row. The squarified algorithm keeps adding
 * to a row while this number improves, and breaks the row when it stops — that
 * is the whole of the heuristic.
 */
function worst(row: number[], side: number, sum: number): number {
  const max = Math.max(...row);
  const min = Math.min(...row);
  const s2 = sum * sum;
  const w2 = side * side;
  return Math.max((w2 * max) / s2, s2 / (w2 * min));
}

/**
 * Squarified treemap (Bruls, Huizing & van Wijk). Areas are exactly
 * proportional to value; the algorithm only chooses how to cut the remaining
 * rectangle so tiles come out near-square rather than as slivers.
 *
 * The degenerate case the spec asks about falls out for free: one node at 100%
 * takes a single row whose row-depth equals the full width, so it fills the
 * square edge to edge. Two nodes at 90/10 give one tall rectangle and one
 * short one beside it.
 */
function squarify(values: number[], bounds: Rect): Rect[] {
  const out: Rect[] = [];
  let { x, y, w, h } = bounds;
  let i = 0;

  while (i < values.length && w > 0.01 && h > 0.01) {
    const side = Math.min(w, h);
    let row: number[] = [];
    let sum = 0;
    let j = i;

    while (j < values.length) {
      const value = values[j]!;
      const nextSum = sum + value;
      if (row.length > 0 && worst(row, side, sum) < worst([...row, value], side, nextSum)) {
        break;
      }
      row = [...row, value];
      sum = nextSum;
      j++;
    }

    if (w >= h) {
      const depth = sum / h;
      let cursor = y;
      for (const value of row) {
        const height = value / depth;
        out.push({ x, y: cursor, w: depth, h: height });
        cursor += height;
      }
      x += depth;
      w -= depth;
    } else {
      const depth = sum / w;
      let cursor = x;
      for (const value of row) {
        const width = value / depth;
        out.push({ x: cursor, y, w: width, h: depth });
        cursor += width;
      }
      y += depth;
      h -= depth;
    }
    i = j;
  }
  return out;
}

interface Tile extends Rect {
  node: ShareNode;
  fill: string;
  ink: string;
}

/** Snapped to an even number so the band edge lands on a clean figure. */
export function changeScale(nodes: ShareNode[]): number {
  const peak = Math.max(...nodes.map(n => Math.abs(n.change)));
  return Math.max(2, Math.ceil(peak / 2) * 2);
}

function layout(nodes: ShareNode[]): Tile[] {
  const total = nodes.reduce((sum, n) => sum + n.share, 0);
  const area = SIZE * SIZE;
  const scaled = nodes.map(n => (n.share / total) * area);
  const rects = squarify(scaled, { x: 0, y: 0, w: SIZE, h: SIZE });
  const scale = changeScale(nodes);

  return rects.map((r, i) => {
    const node = nodes[i]!;
    const fill = divColor(node.change, scale);
    return { ...r, node, fill, ink: inkOn(fill) };
  });
}

/**
 * Market share as area. The form exists because share *is* an area question —
 * a 41% name should look like it owns 41% of the board, and no amount of bar
 * length communicates "share of the whole" as directly as a share of the
 * square does.
 *
 * **Two variables, two channels.** Area is share; hue is the one-day change, on
 * the diverging scale. Colouring by share as well would double-encode it —
 * spending the one free channel to restate what the tile sizes already say,
 * across categories (companies) with no natural order to ramp along. This is
 * the market-map idiom for a reason: it answers "who is big" and "who moved"
 * in a single read.
 */
export function MarketShareTreemap() {
  const tiles = createMemo(() => layout(MARKET_SHARE));
  const { tip, clear, at } = createTip();

  function show(tile: Tile, e: { currentTarget: SVGElement }) {
    at(
      e,
      { x: tile.x + tile.w / 2, y: tile.y + tile.h / 2, width: SIZE },
      {
        title: tile.node.label,
        rows: [
          { label: "today", value: signed(tile.node.change), color: tile.fill },
          { label: "share", value: pct(tile.node.share) },
          { label: "market cap", value: tile.node.cap },
        ],
      },
    );
  }

  return (
    <ChartFrame
      title="Semiconductor market share"
      note="Squarified treemap: area is exactly proportional to share, so one name at 100% fills the square and 90/10 splits it 90/10. Hue is a second variable — today's move — never a restatement of the size."
      legend={() => {
        const edge = changeScale(MARKET_SHARE) / 2;
        return [
          { label: `≤ −${edge}%`, color: "var(--c-chart-div-neg-2)" },
          { label: `−${edge}% to 0`, color: "var(--c-chart-div-neg-1)" },
          { label: `0 to +${edge}%`, color: "var(--c-chart-div-pos-1)" },
          { label: `≥ +${edge}%`, color: "var(--c-chart-div-pos-2)" },
        ];
      }}
    >
      <ChartCanvas width={SIZE}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          class="w-full h-auto block rounded-50 overflow-hidden"
          role="img"
          aria-label={`Semiconductor market share by area, shaded by one-day change: ${MARKET_SHARE.map(
            n =>
              `${n.label} ${n.share} percent share, ${n.change >= 0 ? "up" : "down"} ${Math.abs(n.change)} percent today`,
          ).join("; ")}.`}
        >
          <For each={tiles()}>
            {tile => {
              const pad = () => insetFor(tile.w, tile.h);
              const w = () => Math.max(0, tile.w - pad() * 2);
              const h = () => Math.max(0, tile.h - pad() * 2);
              // Measured against the tile, not guessed. The share is the
              // bottom rung of the ladder: it is the value the chart is *about*,
              // so it is the last label dropped rather than the first. The
              // ticker joins it once there is a second line's worth of room,
              // the full name once there is a third.
              const showShare = () => w() > 34 && h() > 17;
              const showTicker = () => w() > 48 && h() > 33;
              const showName = () => w() > 112 && h() > 62;
              // With no ticker above it, the share sits alone on the first line.
              const shareY = () => (showTicker() ? 34 : 15);

              return (
                <g
                  tabindex="0"
                  class="outline-none cursor-pointer"
                  onPointerEnter={e => show(tile, e)}
                  onPointerMove={e => show(tile, e)}
                  onPointerLeave={clear}
                  onFocus={e => show(tile, e)}
                  onBlur={clear}
                >
                  <title>
                    {tile.node.label}: {pct(tile.node.share)} share, {signed(tile.node.change)}{" "}
                    today
                  </title>
                  <rect
                    x={tile.x + pad()}
                    y={tile.y + pad()}
                    width={w()}
                    height={h()}
                    rx="2"
                    fill={tile.fill}
                    class="transition-opacity hover:opacity-85"
                  />
                  {showTicker() && (
                    <text
                      x={tile.x + pad() + 7}
                      y={tile.y + pad() + 17}
                      fill={tile.ink}
                      style={{ "font-size": "12px", "font-weight": 700 }}
                    >
                      {tile.node.ticker}
                    </text>
                  )}
                  {showShare() && (
                    <text
                      x={tile.x + pad() + 7}
                      y={tile.y + pad() + shareY()}
                      fill={tile.ink}
                      opacity={showTicker() ? 0.92 : 1}
                      style={{
                        "font-size": showTicker() ? "13px" : "11px",
                        "font-weight": showTicker() ? 400 : 700,
                        "font-variant-numeric": "tabular-nums",
                      }}
                    >
                      {pct(tile.node.share)}
                    </text>
                  )}
                  {showName() && (
                    <text
                      x={tile.x + pad() + 7}
                      y={tile.y + pad() + 51}
                      fill={tile.ink}
                      opacity="0.75"
                      style={{ "font-size": "11px" }}
                    >
                      {tile.node.label}
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

export default MarketShareTreemap;
