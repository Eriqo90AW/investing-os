import { For, Show, createMemo, createSignal } from "solid-js";
import { Trophy } from "lucide-solid";
import {
  OUTCOME_RANGES,
  getOutcomeBuckets,
  summarizeOutcome,
  type OutcomeRange,
} from "~/lib/setup-outcomes";
import { AxisText, ChartCanvas, GridLine, barPath } from "~/components/charts/svg/parts";

const VB_W = 520;
const VB_H = 248;
const PAD = { l: 30, r: 8, t: 10, b: 26 };

const WIN_FILL = "var(--c-chart-up)";
const LOSS_FILL = "var(--c-chart-down)";

/**
 * Wins vs losses on closed setups, replacing the old agent-preview slot in
 * the performance grid. Hand-drawn SVG like the other composition charts, so
 * it renders on the server and follows the theme through CSS variables alone.
 */
export function SetupOutcomes() {
  const [range, setRange] = createSignal<OutcomeRange>("7D");
  const buckets = createMemo(() => getOutcomeBuckets(range()));
  const summary = createMemo(() => summarizeOutcome(buckets()));
  const rangeFull = createMemo(() => OUTCOME_RANGES.find(r => r.value === range())?.full ?? "");

  const plotW = VB_W - PAD.l - PAD.r;
  const plotH = VB_H - PAD.t - PAD.b;
  const baseline = PAD.t + plotH;

  const maxV = createMemo(() => {
    let m = 1;
    for (const b of buckets()) m = Math.max(m, b.wins + b.losses);
    return m;
  });

  const y = (v: number): number => baseline - (v / maxV()) * plotH;

  /** Gridlines at zero, half, and max — halves round up so the top line lands
   *  on a labelled count rather than a fractional one. */
  const gridValues = createMemo(() => {
    const m = maxV();
    return m <= 2 ? [0, m] : [0, Math.ceil(m / 2), m];
  });

  const n = createMemo(() => buckets().length);
  const slot = createMemo(() => plotW / Math.max(1, n()));
  const barW = createMemo(() => Math.max(3, Math.min(16, slot() * 0.3)));
  const pairGap = createMemo(() => Math.max(1.5, barW() * 0.25));
  /** X labels thin out to at most ~8 ticks so day numbers never collide. */
  const labelStep = createMemo(() => Math.max(1, Math.ceil(n() / 8)));

  const barH = (v: number): number => {
    if (v <= 0) return 0;
    return Math.max(2, (v / maxV()) * plotH);
  };

  const ariaLabel = createMemo(() => {
    const s = summary();
    const head =
      `Setup outcomes, ${rangeFull()}: ${s.wins} won, ${s.losses} lost` +
      (s.rate === null ? "." : `, ${s.rate.toFixed(1)} percent win rate.`);
    const body = buckets()
      .map(b => `${b.label}: ${b.wins} wins, ${b.losses} losses`)
      .join("; ");
    return `${head} ${body}`;
  });

  return (
    <section aria-label="Setup outcomes" class="h-full rounded-200 border border-line bg-surface-1 overflow-hidden">
      <div class="px-250 pt-250 pb-200 border-b border-line">
        <div class="flex items-start justify-between gap-150">
          <div class="flex items-center gap-150">
            <span class="grid place-items-center w-10 h-10 rounded-100 bg-secondary text-on-secondary">
              <Trophy size={20} />
            </span>
            <div>
              <h2 class="text-200 font-700">Setup outcomes</h2>
              <p class="mt-[2px] text-75 text-muted">Wins vs losses on closed setups</p>
            </div>
          </div>
          <Show when={summary().rate !== null}>
            <span
              class="shrink-0 inline-flex items-center px-100 py-[3px] rounded-10 text-50 font-700 tabular-nums"
              classList={{
                "bg-pos-bg text-pos": (summary().rate ?? 50) >= 50,
                "bg-neg-bg text-neg": (summary().rate ?? 50) < 50,
              }}
            >
              {summary().rate?.toFixed(1)}% wins
            </span>
          </Show>
        </div>
        <div class="mt-200 inline-flex items-center p-[3px] rounded-100 border border-line bg-surface-2" role="group" aria-label="Outcome range">
          <For each={OUTCOME_RANGES}>
            {item => (
              <button
                type="button"
                title={item.full}
                aria-label={item.full}
                aria-pressed={range() === item.value}
                onClick={() => setRange(item.value)}
                class="h-7 px-150 rounded-50 text-50 font-700 transition-colors cursor-pointer"
                classList={{
                  "bg-surface-1 text-ink shadow-tiny": range() === item.value,
                  "text-muted hover:text-ink": range() !== item.value,
                }}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="p-200">
        <p class="text-75 text-muted tabular-nums">
          <b class="text-pos font-700">{summary().wins} won</b>
          {" · "}
          <b class="text-neg font-700">{summary().losses} lost</b>
          <span class="text-caption"> · {summary().closed} closed · {rangeFull()}</span>
        </p>

        <Show
          when={summary().closed > 0}
          fallback={
            <p class="py-500 text-75 text-muted text-center">No closed setups in this range.</p>
          }
        >
          <div class="mt-150">
            <ChartCanvas width={VB_W}>
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} class="w-full h-auto" role="img" aria-label={ariaLabel()}>
                <For each={gridValues()}>
                  {v => (
                    <>
                      <GridLine x1={PAD.l} y1={y(v)} x2={VB_W - PAD.r} y2={y(v)} />
                      <AxisText x={PAD.l - 6} y={y(v)} anchor="end">{v}</AxisText>
                    </>
                  )}
                </For>
                <For each={buckets()}>
                  {(b, i) => {
                    const cx = PAD.l + slot() * (i() + 0.5);
                    const winX = cx - barW() - pairGap() / 2;
                    const lossX = cx + pairGap() / 2;
                    const winH = barH(b.wins);
                    const lossH = barH(b.losses);
                    return (
                      <>
                        <Show when={b.wins > 0}>
                          <path d={barPath(winX, baseline - winH, barW(), winH, "top", Math.min(3, barW() / 2))} fill={WIN_FILL}>
                            <title>{`${b.label}: ${b.wins} won`}</title>
                          </path>
                        </Show>
                        <Show when={b.losses > 0}>
                          <path d={barPath(lossX, baseline - lossH, barW(), lossH, "top", Math.min(3, barW() / 2))} fill={LOSS_FILL}>
                            <title>{`${b.label}: ${b.losses} lost`}</title>
                          </path>
                        </Show>
                        <Show when={i() % labelStep() === 0}>
                          <AxisText x={cx} y={VB_H - 9}>{b.label}</AxisText>
                        </Show>
                      </>
                    );
                  }}
                </For>
              </svg>
            </ChartCanvas>
            <div class="mt-150 flex items-center gap-300 text-75 text-muted">
              <span class="inline-flex items-center gap-100">
                <span aria-hidden="true" class="w-2.5 h-2.5 rounded-full" style={{ background: WIN_FILL }} />
                Wins
              </span>
              <span class="inline-flex items-center gap-100">
                <span aria-hidden="true" class="w-2.5 h-2.5 rounded-full" style={{ background: LOSS_FILL }} />
                Losses
              </span>
            </div>
          </div>
        </Show>
      </div>
    </section>
  );
}
