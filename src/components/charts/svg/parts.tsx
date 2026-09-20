import { Show, createSignal, type JSX } from "solid-js";

/**
 * Shared pieces for the hand-drawn SVG charts.
 *
 * These forms (pie, donut, treemap, heatmap, waterfall, scatter, histogram)
 * are not time series, so Lightweight Charts has nothing to offer them. Plain
 * SVG also means they render on the server — the composition section of the
 * page has no loading state at all, unlike the canvas charts above it.
 *
 * Everything reads `var(--c-chart-*)`, so these follow the theme through CSS
 * alone: no sampling, no re-theme pass, no `dark:` variants.
 */

/** Categorical identity. `null` is the de-emphasised tail, not a fifth hue. */
export function slotColor(slot: number | null): string {
  return slot === null ? "var(--c-chart-other)" : `var(--c-chart-series-${slot + 1})`;
}

/**
 * Magnitude. `t` is 0..1. Four steps: enough to read as an order, few enough
 * that adjacent classes never blur, and — the binding constraint — few enough
 * that every step can clear 4.5:1 against one of the two label inks.
 */
export function seqColor(t: number): string {
  const step = Math.min(4, Math.max(1, Math.ceil(t * 4) || 1));
  return `var(--c-chart-seq-${step})`;
}

/**
 * Polarity around zero. Two hues and a neutral midpoint — the midpoint is
 * never a hue, or the reader reads a third category where there is none.
 */
export function divColor(value: number, scale: number): string {
  const t = value / scale;
  if (t <= -0.5) return "var(--c-chart-div-neg-2)";
  if (t < 0) return "var(--c-chart-div-neg-1)";
  if (t === 0) return "var(--c-chart-div-mid)";
  if (t < 0.5) return "var(--c-chart-div-pos-1)";
  return "var(--c-chart-div-pos-2)";
}

/**
 * Ink for a label set *inside* a filled mark — the one place text is allowed
 * to depend on the fill. It is not computed here: every fill ships with an
 * `on-` partner token that already encodes the choice and flips with the
 * theme, so this only has to name it.
 */
export function inkOn(fill: string): string {
  return fill.replace("--c-chart-", "--c-chart-on-");
}

export interface TipState {
  x: number;
  y: number;
  rows: { label: string; value: string; color?: string }[];
  title?: string;
}

export function createTip() {
  const [tip, setTip] = createSignal<TipState | null>(null);
  return { tip, setTip, clear: () => setTip(null) };
}

/**
 * Hover readout. Values lead and labels follow — the legend's hierarchy
 * inverted, because by the time someone is hovering they know which series
 * they are on and want the number. Identity is a short stroke of the series
 * colour, never coloured text.
 *
 * It enhances and never gates: everything in here is also in the table view.
 */
export function ChartTip(props: { state: TipState | null; width: number }) {
  return (
    <Show when={props.state}>
      {state => (
        <div
          role="status"
          aria-live="polite"
          class="pointer-events-none absolute z-20 min-w-[128px] rounded-100 border border-line bg-surface-1 px-150 py-100 shadow-overlay"
          style={{
            left: `${Math.min(Math.max(state().x, 72), props.width - 72)}px`,
            top: `${state().y}px`,
            transform: "translate(-50%, calc(-100% - 10px))",
          }}
        >
          <Show when={state().title}>
            <div class="text-50 font-600 uppercase tracking-[.06em] text-caption">
              {state().title}
            </div>
          </Show>
          {state().rows.map(row => (
            <div class="flex items-baseline gap-100 whitespace-nowrap">
              <Show when={row.color}>
                <span
                  aria-hidden="true"
                  class="w-3 h-[2px] rounded-full shrink-0"
                  style={{ background: row.color }}
                />
              </Show>
              <span class="text-100 font-700 tabular-nums text-ink">{row.value}</span>
              <span class="text-75 text-muted">{row.label}</span>
            </div>
          ))}
        </div>
      )}
    </Show>
  );
}

/** Positions the tip layer over a chart without disturbing SVG layout. */
export function TipLayer(props: { children: JSX.Element }) {
  return <div class="relative">{props.children}</div>;
}

/** Recessive axis rule — hairline, solid, one step off the surface. */
export function GridLine(props: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={props.x1}
      y1={props.y1}
      x2={props.x2}
      y2={props.y2}
      stroke="var(--c-chart-grid)"
      stroke-width="1"
      shape-rendering="crispEdges"
    />
  );
}

/** Axis tick text. Always a text token — never the series colour. */
export function AxisText(props: {
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  children: JSX.Element;
  dominant?: "middle" | "hanging" | "auto";
}) {
  return (
    <text
      x={props.x}
      y={props.y}
      text-anchor={props.anchor ?? "middle"}
      dominant-baseline={props.dominant ?? "middle"}
      fill="var(--c-chart-axis-text)"
      style={{ "font-size": "11px", "font-variant-numeric": "tabular-nums" }}
    >
      {props.children}
    </text>
  );
}

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
export const signed = (n: number, digits = 2) =>
  `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(digits)}%`;

/**
 * A bar with a 4px rounded data-end and a square baseline end. Drawn as a path
 * rather than a `rect` with `rx`, because rounding both ends detaches the mark
 * from its baseline and makes short bars read as floating pills.
 */
export function barPath(
  x: number,
  y: number,
  w: number,
  h: number,
  end: "right" | "left" | "top" | "bottom",
  radius = 4,
): string {
  if (w <= 0 || h <= 0) return "";
  const r = Math.max(0, Math.min(radius, end === "left" || end === "right" ? w : h, (end === "left" || end === "right" ? h : w) / 2));
  const [x1, y1] = [x + w, y + h];
  switch (end) {
    case "right":
      return `M${x} ${y} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y + r} V${y1 - r} A${r} ${r} 0 0 1 ${x1 - r} ${y1} H${x} Z`;
    case "left":
      return `M${x1} ${y} H${x + r} A${r} ${r} 0 0 0 ${x} ${y + r} V${y1 - r} A${r} ${r} 0 0 0 ${x + r} ${y1} H${x1} Z`;
    case "top":
      return `M${x} ${y1} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y + r} V${y1} Z`;
    default:
      return `M${x} ${y} V${y1 - r} A${r} ${r} 0 0 0 ${x + r} ${y1} H${x1 - r} A${r} ${r} 0 0 0 ${x1} ${y1 - r} V${y} Z`;
  }
}
