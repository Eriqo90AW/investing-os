import { For, createMemo } from "solid-js";

const W = 210;
const H = 100;
const CX = W / 2;
const CY = 94;
const R = 62;
const STROKE = 8;
/** Leaves a visible 2px break after the rounded ends extend into the gap. */
const GAP = (STROKE + 2) / R;
const SENTIMENT_HISTORY = [52, 48, 55, 61, 65, 68] as const;

export const SENTIMENT_BANDS = [
  {
    label: "Extreme fear",
    color: "var(--c-color-red-500)",
    badge: "var(--c-color-red-500)",
    ink: "var(--c-chart-label-on-dark)",
    to: 25,
  },
  {
    label: "Fear",
    color: "var(--c-color-brand-400)",
    badge: "var(--c-color-brand-500)",
    ink: "var(--c-chart-label-on-dark)",
    to: 45,
  },
  {
    label: "Neutral",
    color: "var(--c-color-beige-500)",
    badge: "var(--c-color-beige-600)",
    ink: "var(--c-chart-label-ink)",
    to: 55,
  },
  {
    label: "Greed",
    color: "var(--c-color-green-300)",
    badge: "var(--c-color-green-500)",
    ink: "var(--c-chart-label-ink)",
    to: 75,
  },
  {
    label: "Extreme greed",
    color: "var(--c-color-green-500)",
    badge: "var(--c-color-green-600)",
    ink: "var(--c-chart-label-on-dark)",
    to: 100,
  },
] as const;

export function bandFor(value: number) {
  return SENTIMENT_BANDS.find(band => value <= band.to) ?? SENTIMENT_BANDS.at(-1)!;
}

/** 0 is due west and 100 is due east, sweeping over the top. */
const angleOf = (value: number) =>
  Math.PI + (Math.min(100, Math.max(0, value)) / 100) * Math.PI;

const pointOn = (angle: number, radius: number): [number, number] => [
  CX + Math.cos(angle) * radius,
  CY + Math.sin(angle) * radius,
];

function arcPath(from: number, to: number): string {
  const a0 = angleOf(from) + GAP / 2;
  const a1 = angleOf(to) - GAP / 2;
  const [x0, y0] = pointOn(a0, R);
  const [x1, y1] = pointOn(a1, R);
  return `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`;
}

export function SentimentGauge(props: { value: number; label?: string }) {
  const band = createMemo(() => bandFor(props.value));
  const marker = createMemo(() => pointOn(angleOf(props.value), R));
  const pillWidth = createMemo(() => Math.max(52, Math.min(106, band().label.length * 7 + 18)));
  const history = createMemo(() => [...SENTIMENT_HISTORY, props.value]);
  const historyPoints = createMemo(() =>
    history().map((value, index) => ({
      value,
      current: index === history().length - 1,
      x: 4 + (index / (history().length - 1)) * 202,
      y: 3 + ((80 - Math.min(80, Math.max(40, value))) / 40) * 18,
    })),
  );
  const historyLine = createMemo(() =>
    historyPoints()
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" "),
  );
  const shift = createMemo(() => props.value - SENTIMENT_HISTORY[0]);

  return (
    <figure
      class="m-0"
      role="img"
      aria-label={`${props.label ?? "Fear and Greed"}: ${props.value} out of 100, ${band().label}. Up ${shift()} points over seven days.`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} class="w-full h-auto block max-w-[210px] mx-auto">
        <For each={SENTIMENT_BANDS}>
          {(segment, index) => (
            <path
              d={arcPath(index() === 0 ? 0 : SENTIMENT_BANDS[index() - 1]!.to, segment.to)}
              fill="none"
              stroke={segment.color}
              stroke-width={STROKE}
              stroke-linecap="round"
            />
          )}
        </For>

        <circle
          cx={marker()[0]}
          cy={marker()[1]}
          r="5.5"
          fill="var(--c-color-text-primary)"
          stroke="var(--c-color-surface-1)"
          stroke-width="3"
        />

        <text
          x={CX}
          y="69"
          text-anchor="middle"
          fill="var(--c-color-text-primary)"
          style={{ "font-size": "22px", "font-weight": 700, "font-variant-numeric": "tabular-nums" }}
        >
          {props.value}
        </text>

        <rect
          x={CX - pillWidth() / 2}
          y="77"
          width={pillWidth()}
          height="22"
          rx="11"
          fill={band().badge}
        />
        <text
          x={CX}
          y="88"
          text-anchor="middle"
          dominant-baseline="middle"
          fill={band().ink}
          style={{ "font-size": "11px", "font-weight": 700 }}
        >
          {band().label}
        </text>
      </svg>

      <figcaption class="mt-50">
        <div class="flex items-center justify-between text-[9px] leading-tight">
          <span class="text-caption">7D sentiment trail</span>
          <span class="font-700 text-pos tabular-nums">▲ {shift()} pts</span>
        </div>
        <svg viewBox="0 0 210 24" class="mt-50 block h-6 w-full" aria-hidden="true">
          <path
            d={historyLine()}
            fill="none"
            stroke="var(--c-chart-crosshair)"
            stroke-width="1.5"
          />
          <For each={historyPoints()}>
            {point => (
              <circle
                cx={point.x}
                cy={point.y}
                r={point.current ? 3.5 : 2.5}
                fill={bandFor(point.value).badge}
                stroke="var(--c-color-surface-1)"
                stroke-width="1.5"
              />
            )}
          </For>
        </svg>
        <div class="mt-[2px] flex items-center justify-between text-[9px] leading-tight text-caption tabular-nums">
          <span>Last week · {SENTIMENT_HISTORY[0]}</span>
          <span>Today · {props.value}</span>
        </div>
      </figcaption>
    </figure>
  );
}

export default SentimentGauge;
