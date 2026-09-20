import { createMemo, createUniqueId } from "solid-js";

export interface SparklineProps {
  /** Values normalised to 0..1. */
  points: number[];
  rising: boolean;
  width?: number;
  height?: number;
  label: string;
}

/**
 * Row-scale sparkline. Deliberately SVG rather than a chart instance: at 135×40
 * a canvas chart costs a WebGL-ish context per row and reads no better. The
 * stroke takes the direction token, and the emphasised endpoint tells you where
 * the series actually finishes.
 */
export function Sparkline(props: SparklineProps) {
  const w = () => props.width ?? 135;
  const h = () => props.height ?? 40;
  const gradientId = createUniqueId();

  const geometry = createMemo(() => {
    const pts = props.points;
    const width = w();
    const height = h();
    const pad = 3;
    const usable = height - pad * 2;
    const step = pts.length > 1 ? width / (pts.length - 1) : width;

    const coords = pts.map((v, i) => {
      const x = i * step;
      const y = pad + (1 - v) * usable;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    const line = `M${coords.join(" L")}`;
    const area = `${line} L${width},${height} L0,${height} Z`;
    const lastRaw = coords[coords.length - 1] ?? `0,${height}`;
    const [lx, ly] = lastRaw.split(",");
    return { line, area, lx: lx ?? "0", ly: ly ?? "0" };
  });

  const stroke = () => (props.rising ? "var(--c-chart-up)" : "var(--c-chart-down)");

  return (
    <svg
      viewBox={`0 0 ${w()} ${h()}`}
      width={w()}
      height={h()}
      role="img"
      aria-label={props.label}
      class="inline-block align-middle max-w-full"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={stroke()} stop-opacity="0.18" />
          <stop offset="100%" stop-color={stroke()} stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d={geometry().area} fill={`url(#${gradientId})`} />
      <path
        d={geometry().line}
        fill="none"
        stroke={stroke()}
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle cx={geometry().lx} cy={geometry().ly} r="2" fill={stroke()} />
    </svg>
  );
}
