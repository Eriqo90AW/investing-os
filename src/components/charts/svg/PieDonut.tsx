import { For, createMemo, createSignal } from "solid-js";
import { ChartFrame, type LegendItem } from "../../ChartFrame";
import { ChartTip, createTip, pct, slotColor } from "./parts";
import { SECTOR_MIX, type Slice } from "~/lib/chart-data";

const SIZE = 240;
const R = 104;
/** The 2px surface gap, expressed as the angle that subtends it at radius R. */
const GAP = 2 / R;

interface Arc {
  slice: Slice;
  d: string;
  mid: number;
  color: string;
  share: number;
}

function arcPath(from: number, to: number, r: number, inner: number): string {
  const a0 = from + GAP / 2;
  const a1 = to - GAP / 2;
  if (a1 <= a0) return "";
  const c = SIZE / 2;
  const p = (a: number, rad: number) => [
    c + Math.cos(a) * rad,
    c + Math.sin(a) * rad,
  ];
  const big = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(a0, r);
  const [x1, y1] = p(a1, r);

  // A full ring has no wedge sides to draw — two half-arcs, or the path
  // degenerates to a point and the slice vanishes.
  if (to - from >= Math.PI * 2 - 1e-6) {
    const [mx, my] = p(a0 + Math.PI, r);
    const ring = `M${x0} ${y0} A${r} ${r} 0 1 1 ${mx} ${my} A${r} ${r} 0 1 1 ${x0} ${y0}`;
    if (inner <= 0) return ring;
    const [ix0, iy0] = p(a0, inner);
    const [imx, imy] = p(a0 + Math.PI, inner);
    return `${ring} M${ix0} ${iy0} A${inner} ${inner} 0 1 0 ${imx} ${imy} A${inner} ${inner} 0 1 0 ${ix0} ${iy0}`;
  }

  if (inner <= 0) {
    return `M${c} ${c} L${x0} ${y0} A${r} ${r} 0 ${big} 1 ${x1} ${y1} Z`;
  }
  const [ix1, iy1] = p(a1, inner);
  const [ix0, iy0] = p(a0, inner);
  return `M${x0} ${y0} A${r} ${r} 0 ${big} 1 ${x1} ${y1} L${ix1} ${iy1} A${inner} ${inner} 0 ${big} 0 ${ix0} ${iy0} Z`;
}

function useArcs(data: Slice[], inner: number) {
  return createMemo<Arc[]>(() => {
    const total = data.reduce((sum, s) => sum + s.value, 0);
    let a = -Math.PI / 2; // 12 o'clock, clockwise — the only reading order people expect
    return data.map(slice => {
      const sweep = (slice.value / total) * Math.PI * 2;
      const arc: Arc = {
        slice,
        d: arcPath(a, a + sweep, R, inner),
        mid: a + sweep / 2,
        color: slotColor(slice.slot),
        share: (slice.value / total) * 100,
      };
      a += sweep;
      return arc;
    });
  });
}

function legendOf(data: Slice[]): LegendItem[] {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  return data.map(s => ({
    label: s.label,
    color: slotColor(s.slot),
    value: pct((s.value / total) * 100),
  }));
}

function tableOf(data: Slice[]) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  return data.map(s => [s.label, pct((s.value / total) * 100), `$${(s.value * 5.3).toFixed(1)}M`]);
}

interface WheelProps {
  inner: number;
  center?: () => { value: string; label: string };
}

function Wheel(props: WheelProps) {
  const arcs = useArcs(SECTOR_MIX, props.inner);
  const { tip, setTip, clear } = createTip();
  const [active, setActive] = createSignal<string | null>(null);

  function show(arc: Arc, e: { currentTarget: SVGElement }) {
    const box = (e.currentTarget.ownerSVGElement ?? e.currentTarget).getBoundingClientRect();
    const scale = box.width / SIZE;
    setActive(arc.slice.label);
    setTip({
      x: (SIZE / 2 + Math.cos(arc.mid) * R * 0.66) * scale,
      y: (SIZE / 2 + Math.sin(arc.mid) * R * 0.66) * scale,
      rows: [{ label: arc.slice.label, value: pct(arc.share), color: arc.color }],
    });
  }

  return (
    <div class="relative grid place-items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        class="max-w-full h-auto overflow-visible"
        role="img"
        aria-label={`Portfolio weight by sector: ${SECTOR_MIX.map(
          s => `${s.label} ${s.value} percent`,
        ).join(", ")}. The table view below lists the same figures.`}
      >
        <For each={arcs()}>
          {arc => (
            <path
              d={arc.d}
              fill={arc.color}
              tabindex="0"
              class="outline-none cursor-pointer transition-opacity"
              style={{ opacity: active() && active() !== arc.slice.label ? 0.55 : 1 }}
              onPointerEnter={e => show(arc, e)}
              onPointerMove={e => show(arc, e)}
              onPointerLeave={() => {
                setActive(null);
                clear();
              }}
              onFocus={e => show(arc, e)}
              onBlur={() => {
                setActive(null);
                clear();
              }}
            >
              <title>
                {arc.slice.label}: {pct(arc.share)}
              </title>
            </path>
          )}
        </For>

        {props.center && (
          <>
            <text
              x={SIZE / 2}
              y={SIZE / 2 - 6}
              text-anchor="middle"
              fill="var(--c-color-text-primary)"
              style={{ "font-size": "25px", "font-weight": 700 }}
            >
              {props.center().value}
            </text>
            <text
              x={SIZE / 2}
              y={SIZE / 2 + 16}
              text-anchor="middle"
              fill="var(--c-color-text-secondary)"
              style={{ "font-size": "11px" }}
            >
              {props.center().label}
            </text>
          </>
        )}
      </svg>
      <ChartTip state={tip()} width={SIZE} />
    </div>
  );
}

/**
 * Part-to-whole at a glance. The spec's own caveat applies and is printed on
 * the card: a pie answers "is one of these dominant" and nothing finer. The
 * moment the question is "is Financials ahead of Healthcare", the honest form
 * is the ranked bar two cards down.
 *
 * Five segments is the ceiling here because the fifth is "Other" — four
 * identities and a tail, not five identities.
 */
export function PieShare() {
  return (
    <ChartFrame
      title="Portfolio weight by sector"
      note="Part-to-whole, at a glance only. Five segments is the cap: four categorical slots plus the de-emphasised tail. For ranking close values, use bars."
      legend={() => legendOf(SECTOR_MIX)}
      tableHead={["Sector", "Weight", "Value"]}
      tableRows={() => tableOf(SECTOR_MIX)}
    >
      <Wheel inner={0} />
    </ChartFrame>
  );
}

/**
 * The same data with the middle cut out. The hole is not decoration — it is
 * where the total goes, which is the one thing a pie cannot show. That makes
 * the donut the better default of the two whenever a total exists.
 */
export function DonutShare() {
  return (
    <ChartFrame
      title="Portfolio weight by sector · donut"
      note="Identical geometry to the pie, minus the middle — which is the point: the hole carries the total the slices add up to."
      legend={() => legendOf(SECTOR_MIX)}
      tableHead={["Sector", "Weight", "Value"]}
      tableRows={() => tableOf(SECTOR_MIX)}
    >
      <Wheel inner={66} center={() => ({ value: "$1.06M", label: "Total invested" })} />
    </ChartFrame>
  );
}
