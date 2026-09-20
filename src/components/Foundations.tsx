import { For, Show, createEffect, createSignal } from "solid-js";
import { resolved } from "~/lib/theme";
import { PALETTES, palette } from "~/lib/palette";
import { accentHex, derived } from "~/lib/accent";
import {
  DIV_STEPS,
  GRAY_ROLES,
  GRAY_NOTE,
  GRAY_STEPS,
  SEQ_STEPS,
  HUES,
  HUE_NOTES,
  RADIUS_SCALE,
  RAMP_STEPS,
  SEMANTIC_TOKENS,
  SERIES_SLOTS,
  SPACE_SCALE,
  STATUS_TOKENS,
  TEXT_TOKENS,
  TYPE_SCALE,
} from "~/lib/tokens";

export function SectionHeading(props: { children: string; id?: string }) {
  return (
    <h2 id={props.id} class="text-800 font-700 leading-[130%] scroll-mt-24">
      {props.children}
    </h2>
  );
}

export function SubHeading(props: { children: string }) {
  return <h3 class="text-400 font-700">{props.children}</h3>;
}

export function Lede(props: { children: any }) {
  return <p class="mt-50 text-100 text-muted max-w-[65ch]">{props.children}</p>;
}

/**
 * Reads a live token value off :root so the printed hex always matches what
 * actually paints — including after the viewer flips the theme, which is the
 * whole point of the gray-ramp demo below.
 */
function LiveHex(props: { cssVar: string }) {
  const [hex, setHex] = createSignal("");

  createEffect(() => {
    resolved(); // re-sample on every theme flip
    palette(); // ...and on every palette swap
    accentHex(); // ...and on every accent swap
    // The stamp lands on <html> in the same tick; read after it settles.
    queueMicrotask(() => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(props.cssVar)
        .trim();
      setHex(v.toUpperCase());
    });
  });

  return <span class="font-mono text-50 text-caption">{hex() || " "}</span>;
}

/**
 * One solved value from the accent derivation, with the ratio it was solved
 * for. The number is measured, not promised — if it ever reads below the
 * floor, the derivation is wrong and the page says so rather than hiding it.
 */
function Measured(props: {
  label: string;
  swatch: string;
  ratio: number;
  floor: number;
}) {
  const pass = () => props.ratio >= props.floor;
  return (
    <div class="flex items-center gap-150">
      <span
        class="block w-9 h-9 rounded-100 border border-hairline shrink-0"
        style={{ background: props.swatch }}
      />
      <div class="min-w-0">
        <dt class="font-600 text-ink">{props.label}</dt>
        <dd class="font-mono text-50 text-caption">
          {props.swatch.toUpperCase()} ·{" "}
          <span classList={{ "text-pos": pass(), "text-neg": !pass() }}>
            {props.ratio.toFixed(2)}:1
          </span>{" "}
          vs {props.floor}:1
        </dd>
      </div>
    </div>
  );
}

/**
 * Palette is the second theme axis. It is documented first because every hex
 * printed further down this page depends on which one is active — the swatches
 * are live reads, not a table of the base palette.
 */
function PaletteAxis() {
  const active = () => PALETTES.find(p => p.id === palette()) ?? PALETTES[0]!;

  return (
    <>
      <SubHeading>Palette</SubHeading>
      <Lede>
        Light/dark answers <i>which ground</i>. Palette answers{" "}
        <i>which values that ground uses</i>. The two are independent, they stamp the same{" "}
        <code class="text-100 px-[4px] py-[1px] rounded-10 bg-surface-2 border border-line">
          &lt;html&gt;
        </code>{" "}
        element, and no component knows either exists — everything still resolves through
        the same <code class="text-100">--c-*</code> names, so the page below is the same
        page in every theme × palette combination.
      </Lede>

      <p class="mt-200 text-75 text-caption">
        Currently showing <b class="text-muted">{active().label}</b>. Switch in the header —
        every hex on this page re-reads itself.
      </p>

      <div class="mt-200 grid gap-150 lg:grid-cols-3">
        <For each={PALETTES}>
          {p => (
            <div
              class="rounded-200 border bg-surface-1 p-250 flex flex-col"
              classList={{
                "border-accent": palette() === p.id,
                "border-line": palette() !== p.id,
              }}
            >
              <div class="flex items-center gap-100">
                <span class="text-200 font-700">{p.label}</span>
                <Show when={palette() === p.id}>
                  <span class="text-50 font-600 uppercase tracking-[.08em] text-accent">
                    active
                  </span>
                </Show>
              </div>
              <p class="mt-50 text-75 text-muted">{p.note}</p>

              {/* Source swatches are literal hex, not tokens: they are what the
                  palette was designed *from*, so they must not follow the theme. */}
              <div class="mt-200 flex gap-[2px] rounded-50 overflow-hidden">
                <For each={p.source}>
                  {s => (
                    <div class="flex-1 h-10" style={{ background: s.hex }} title={s.name} />
                  )}
                </For>
              </div>
              <dl class="mt-150 text-50 leading-[160%]">
                <For each={p.source}>
                  {s => (
                    <div class="flex gap-100">
                      <dt class="font-mono text-caption shrink-0 w-[58px]">
                        {s.hex.toUpperCase()}
                      </dt>
                      <dd class="text-muted">
                        <b class="text-ink font-600">{s.name}</b> — {s.role}
                      </dd>
                    </div>
                  )}
                </For>
              </dl>

              <p class="mt-150 pt-150 border-t border-line text-50 text-muted">
                <b class="text-ink font-600">The tension:</b> {p.tension}
              </p>
            </div>
          )}
        </For>
      </div>

      <p class="mt-200 text-75 text-muted max-w-[78ch]">
        Every palette covers the same two gaps the same way. A handful of source colours
        cannot fill a 6-step neutral ramp and four CVD-separable chart slots — and the
        accent they would have needed is shared across styles, not owned by any one of
        them — so the neutrals are interpolated along the palette's own light→dark axis.
        And none of these palettes ships a green or a red: price direction is not a
        style choice, so <code class="text-100">positive</code> /{" "}
        <code class="text-100">negative</code> are identical in all three.
      </p>

      <div class="mt-500">
        <SubHeading>Accent</SubHeading>
        <Lede>
          The third axis, and the narrowest. A palette decides what the page is made of; an
          accent decides only what the page <i>points with</i> — so it can be changed
          without touching the palette under it.
        </Lede>

        <div class="mt-200 rounded-200 border border-line bg-surface-1 p-250">
          <div class="text-100 font-600">An accent owns six things, and nothing else</div>
          <ol class="mt-100 text-75 text-muted max-w-[78ch] list-decimal pl-300 space-y-[2px]">
            <li>
              the brand ramp, <code class="text-100">--c-color-brand-100…800</code>
            </li>
            <li>
              <code class="text-100">accent</code>,{" "}
              <code class="text-100">accent-fill</code>,{" "}
              <code class="text-100">accent-fill-hover</code>,{" "}
              <code class="text-100">on-accent</code>
            </li>
            <li>
              <code class="text-100">text-hyperlink</code> and{" "}
              <code class="text-100">official</code>
            </li>
            <li>chart slot 1, which always follows the accent</li>
            <li>the area-gradient pair, which is slot 1 with alpha</li>
            <li>the slot it displaces, if its hue was already a chart slot</li>
          </ol>
          <p class="mt-150 text-75 text-muted max-w-[78ch]">
            Only the last one is non-obvious, and it is uniform. Slot 1 is always the
            accent, so an accent that duplicates a slot pushes that slot onto the hue the
            accent just vacated — the warm one. Blue accent → slot 2 goes warm, teal →
            slot 3, violet → slot 4. The set stays four CVD-separable hues in every
            combination.
          </p>
        </div>

        <div class="mt-150 rounded-200 border border-line bg-surface-1 p-250">
          <div class="flex items-baseline gap-150 flex-wrap">
            <div class="text-100 font-600">What the picker actually does</div>
            <Show
              when={derived()}
              fallback={
                <span class="text-75 text-caption">
                  Nothing right now — the shared accent is in charge. Pick a colour in the header.
                </span>
              }
            >
              <span class="font-mono text-75 text-caption">{accentHex()}</span>
            </Show>
          </div>

          <p class="mt-100 text-75 text-muted max-w-[78ch]">
            The picked colour is never used raw. It is read into OKLCH, and every step
            below is <i>solved</i> against a contrast floor rather than chosen: the ink
            steps are the extreme lightness that still clears 4.5:1, so a colour is only
            darkened as far as it has to be. Measured against the worst ground any palette
            offers — light ink on <code class="text-100">#EFF1F5</code>, dark ink on{" "}
            <code class="text-100">#2F2D2A</code> — so a derived accent is valid under
            every palette, not just the one you can see.
          </p>

          <Show when={derived()}>
            {d => (
              <>
                <div class="mt-200 flex rounded-50 overflow-hidden">
                  <For each={d().ramp}>
                    {(hex, i) => (
                      <div class="flex-1">
                        <div class="h-10" style={{ background: hex }} />
                        <div class="mt-50 text-center font-mono text-50 text-caption">
                          {[100, 200, 300, 400, 500, 600, 700, 800][i()]}
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                <dl class="mt-200 grid gap-150 sm:grid-cols-2 lg:grid-cols-3 text-75">
                  <Measured
                    label="Ink, light ground"
                    swatch={d().ramp[4]!}
                    ratio={d().ratios.inkLight}
                    floor={4.5}
                  />
                  <Measured
                    label="Ink, dark ground"
                    swatch={d().ramp[3]!}
                    ratio={d().ratios.inkDark}
                    floor={4.5}
                  />
                  <Measured
                    label={d().inverted ? "Fill, dark label ink" : "Fill, light label ink"}
                    swatch={d().fill}
                    ratio={d().ratios.onAccent}
                    floor={4.5}
                  />
                  <Measured
                    label="Chart slot 1, light"
                    swatch={d().markLight}
                    ratio={d().ratios.markLight}
                    floor={3}
                  />
                  <Measured
                    label="Chart slot 1, dark"
                    swatch={d().markDark}
                    ratio={d().ratios.markDark}
                    floor={3}
                  />
                </dl>

                <ul class="mt-200 pt-200 border-t border-line text-75 text-muted flex flex-col gap-100 max-w-[78ch]">
                  <li>
                    <b class="text-ink font-600">The fill:</b>{" "}
                    {d().keptAsFill
                      ? "your colour survived intact — one of the two label inks clears 4.5:1 on it, so it was not darkened into a link colour."
                      : "neither label ink clears 4.5:1 on your colour, so the fill fell back to the solved 500 step."}{" "}
                    {d().inverted
                      ? "It takes dark ink, which is why on-accent is a token and not a hardcoded #fff."
                      : "It takes light ink."}
                  </li>
                  <li>
                    <b class="text-ink font-600">Chart slot 1:</b> a mark, not text, so the
                    floor is 3:1 — and the dark step is capped at OKLCH L 0.67, the top of
                    the dataviz band. Brighter than that and it blooms against a dark
                    ground, however good it would be as a label.
                  </li>
                  <li>
                    <b class="text-ink font-600">Displacement:</b>{" "}
                    <Show
                      when={d().displaces}
                      fallback="this hue is clear of the other three chart slots, so they stay where they are."
                    >
                      {slot => (
                        <>
                          this hue lands within 30° of chart slot {slot()}, so slot {slot()}{" "}
                          was pushed onto the warm hue the accent just vacated. The set
                          stays four CVD-separable colours.
                        </>
                      )}
                    </Show>
                  </li>
                  <Show when={d().reserved}>
                    {which => (
                      <li class="text-ink">
                        <b class="font-600">Careful:</b> this hue reads as{" "}
                        <b class="font-600">{which()}</b> — the colour this system reserves
                        for price direction. Every contrast floor still passes, but a link
                        will look like a{" "}
                        {which() === "positive" ? "gain" : "loss"}. Nothing stops you; it
                        is worth knowing.
                      </li>
                    )}
                  </Show>
                </ul>
              </>
            )}
          </Show>
        </div>
      </div>
    </>
  );
}

export function ColorFoundations() {
  return (
    <>
      <PaletteAxis />

      <div class="mt-500" />
      <SubHeading>Semantic color</SubHeading>
      <Lede>
        Reach for these first. The raw ramps below exist to build them, not to be used
        directly.
      </Lede>

      <div class="mt-200 grid gap-150 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <For each={SEMANTIC_TOKENS}>
          {t => (
            <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
              <div
                class="h-16 border-b border-line"
                style={{ background: `var(${t.cssVar})` }}
              />
              <div class="p-150">
                <div class="text-100 font-600">{t.name}</div>
                <div class="text-75 text-caption">{t.role}</div>
                <LiveHex cssVar={t.cssVar} />
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="mt-150 grid gap-150 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <For each={STATUS_TOKENS}>
          {t => (
            <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
              <div
                class="h-16 grid place-items-center border-b border-line"
                style={{ background: `var(${t.cssVar}-bg, var(--c-color-surface-2))` }}
              >
                <span class="font-700 text-200" style={{ color: `var(${t.cssVar})` }}>
                  {t.role}
                </span>
              </div>
              <div class="p-150">
                <div class="text-100 font-600">{t.name}</div>
                <LiveHex cssVar={t.cssVar} />
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="mt-300 rounded-200 border border-line bg-surface-1 p-250 flex flex-wrap gap-400">
        <For each={TEXT_TOKENS}>
          {t => (
            <div>
              <div
                class="text-200 font-600"
                style={{ color: `var(${t.cssVar})` }}
              >
                {t.name}
              </div>
              <div class="text-75 text-caption">{t.role}</div>
              <LiveHex cssVar={t.cssVar} />
            </div>
          )}
        </For>
      </div>

      <div class="mt-500">
        <SubHeading>Hue ramps</SubHeading>
        <Lede>
          Step <b class="text-ink">500</b> is the brand value of each hue. Step{" "}
          <b class="text-ink">800</b> exists almost entirely to back a badge in dark mode.
        </Lede>
        <div class="mt-200 flex flex-col gap-200">
          <For each={HUES}>
            {hue => (
              <div>
                <div class="flex flex-wrap items-baseline gap-150">
                  <span class="text-75 font-600 capitalize">{hue}</span>
                  <span class="text-75 text-caption">{HUE_NOTES[hue]}</span>
                </div>
                <div class="mt-50 flex gap-50 overflow-x-auto pb-50">
                  <For each={RAMP_STEPS}>
                    {step => (
                      <div class="flex-1 min-w-[72px]">
                        <div
                          class="h-12 rounded-50 border border-line"
                          style={{ background: `var(--c-color-${hue}-${step})` }}
                        />
                        <div
                          class="mt-50 text-50 font-600"
                          classList={{ "text-ink": step === 500, "text-muted": step !== 500 }}
                        >
                          {step}
                          <Show when={step === 500}> ●</Show>
                        </div>
                        <LiveHex cssVar={`--c-color-${hue}-${step}`} />
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="mt-500">
        <SubHeading>The gray ramp inverts</SubHeading>
        <Lede>
          Gray is positional, not absolute: <b class="text-ink">100</b> is always the step
          nearest the background and <b class="text-ink">600</b> the step nearest the text.
          Switching themes flips the actual hex values — watch the labels change. Never
          hardcode one. {GRAY_NOTE}
        </Lede>
        <div class="mt-200 grid gap-150 grid-cols-3 sm:grid-cols-6">
          <For each={GRAY_STEPS}>
            {step => (
              <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
                <div
                  class="h-14 border-b border-line"
                  style={{ background: `var(--c-color-gray-${step})` }}
                />
                <div class="p-150">
                  <div class="text-100 font-600">gray-{step}</div>
                  <LiveHex cssVar={`--c-color-gray-${step}`} />
                  <div class="text-50 text-muted mt-50">{GRAY_ROLES[step]}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="mt-500">
        <SubHeading>Categorical chart slots</SubHeading>
        <Lede>
          Four slots, assigned in fixed order and never cycled. Green and red are
          deliberately absent — they mean price direction, so reusing them as "series 5"
          would make a neutral line look like a gain. A fifth series folds into "Other" or
          becomes small multiples.
        </Lede>
        <div class="mt-200 grid gap-150 grid-cols-2 lg:grid-cols-4">
          <For each={SERIES_SLOTS}>
            {s => (
              <div class="rounded-200 border border-line bg-surface-1 overflow-hidden">
                <div class="h-14 border-b border-line" style={{ background: `var(${s.cssVar})` }} />
                <div class="p-150">
                  <div class="text-100 font-600">Slot {s.slot}</div>
                  <div class="text-75 text-caption capitalize">{s.hue}</div>
                  <LiveHex cssVar={s.cssVar} />
                </div>
              </div>
            )}
          </For>
        </div>
        <p class="mt-150 text-75 text-muted max-w-[65ch]">
          Validated against both surfaces: lightness band, chroma floor, CVD separation,
          normal-vision floor and contrast all pass. Worst adjacent pair under deuteranopia
          is purple ↔ teal at ΔE 16.2, comfortably above the ΔE 8 target.
        </p>
      </div>

      <div class="mt-500">
        <SubHeading>Magnitude and polarity</SubHeading>
        <Lede>
          Categorical answers <i>which one</i>. These two answer <i>how much</i> and{" "}
          <i>which way</i>, and reaching for the wrong one is the most common way a
          chart misstates its data.
        </Lede>

        <div class="mt-200 grid gap-250 lg:grid-cols-2">
          <div class="rounded-200 border border-line bg-surface-1 p-250">
            <div class="text-100 font-600">Sequential · one hue, light → dark</div>
            <p class="mt-50 text-75 text-muted">
              Four steps, each at least 0.06 OKLCH lightness from its neighbour, with a
              pale end that still clears 2:1 on the surface. Treemap tiles, heat grids of
              levels.
            </p>
            <div class="mt-150 flex gap-50">
              <For each={SEQ_STEPS}>
                {step => (
                  <div class="flex-1">
                    <div
                      class="h-12 rounded-50 grid place-items-center text-50 font-600"
                      style={{
                        background: `var(--c-chart-seq-${step})`,
                        color: `var(--c-chart-on-seq-${step})`,
                      }}
                    >
                      {step}
                    </div>
                    <LiveHex cssVar={`--c-chart-seq-${step}`} />
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="rounded-200 border border-line bg-surface-1 p-250">
            <div class="text-100 font-600">Diverging · two hues, neutral pivot</div>
            <p class="mt-50 text-75 text-muted">
              The reserved direction pair around a grey middle. The midpoint is never a
              hue — a third colour there invents a third category out of zero.
            </p>
            <div class="mt-150 flex gap-50">
              <For each={DIV_STEPS}>
                {step => (
                  <div class="flex-1 min-w-0">
                    <div
                      class="h-12 rounded-50"
                      style={{ background: `var(${step.cssVar})` }}
                    />
                    <div class="mt-50 text-50 text-muted truncate">{step.label}</div>
                    <LiveHex cssVar={step.cssVar} />
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        <div class="mt-150 rounded-200 border border-line bg-surface-1 p-250 flex flex-wrap items-center gap-250">
          <div>
            <div class="text-100 font-600">other</div>
            <p class="text-75 text-muted max-w-[46ch]">
              The tail of a part-to-whole chart. Deliberately chromaless: a fifth series
              is not a fifth identity, it is the absence of one.
            </p>
          </div>
          <div class="ml-auto flex items-center gap-100">
            <span
              class="grid place-items-center w-24 h-12 rounded-50 text-75 font-600"
              style={{
                background: "var(--c-chart-other)",
                color: "var(--c-chart-on-other)",
              }}
            >
              Other
            </span>
            <LiveHex cssVar="--c-chart-other" />
          </div>
        </div>
      </div>
    </>
  );
}

export function TypeFoundations() {
  return (
    <>
      <SubHeading>Type scale</SubHeading>
      <Lede>
        Inter throughout. Four steps grow at <code class="text-75">≥768px</code> — resize
        the window and the specimen re-measures itself.
      </Lede>
      <div class="mt-200 rounded-200 border border-line bg-surface-1 overflow-hidden">
        <For each={TYPE_SCALE}>
          {t => (
            <div class="flex flex-wrap items-baseline gap-200 px-250 py-200 border-b border-line last:border-0">
              <div class="w-28 shrink-0">
                <div class="text-75 font-600 font-mono text-accent">{t.step}</div>
                <div class="text-50 text-caption">{t.responsive ?? ""}</div>
              </div>
              <div class="w-32 shrink-0 text-75 text-muted">{t.role}</div>
              <div
                class="min-w-0 flex-1"
                style={{
                  "font-size": `var(--c-font-size-${t.step})`,
                  "font-weight": String(t.weight),
                  "line-height": t.step >= 400 ? "130%" : "150%",
                }}
              >
                {t.sample}
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="mt-250 grid gap-150 sm:grid-cols-2">
        <div class="rounded-200 border border-line bg-surface-1 p-250">
          <div class="text-50 font-600 uppercase tracking-[.08em] text-caption">Weights</div>
          <div class="mt-150 flex flex-col gap-50 text-200">
            <span class="font-300">300 · Light — rarely used</span>
            <span class="font-400">400 · Regular — body copy</span>
            <span class="font-500">500 · Medium — table headers, axis ticks</span>
            <span class="font-600">600 · Semibold — prices, deltas, buttons</span>
            <span class="font-700">700 · Bold — headings</span>
            <span class="font-900">900 · Black — display only</span>
          </div>
        </div>
        <div class="rounded-200 border border-line bg-surface-1 p-250">
          <div class="text-50 font-600 uppercase tracking-[.08em] text-caption">Numerics</div>
          <p class="mt-150 text-100 text-muted">
            Every column of figures sets <code class="text-75">tabular-nums</code>.
            Proportional digits drift; tabular ones stack.
          </p>
          <div class="mt-150 grid grid-cols-2 gap-200">
            <div>
              <div class="text-75 text-caption mb-50">Proportional ✗</div>
              <div class="text-200 font-600 leading-[1.5]">
                <div>$109,482.31</div>
                <div>$4,012.77</div>
                <div>$221.48</div>
              </div>
            </div>
            <div>
              <div class="text-75 text-caption mb-50">Tabular ✓</div>
              <div class="text-200 font-600 leading-[1.5] tabular-nums">
                <div>$109,482.31</div>
                <div>$4,012.77</div>
                <div>$221.48</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ShapeFoundations() {
  return (
    <>
      <SubHeading>Space</SubHeading>
      <Lede>
        One 4px-based ramp, identical at every breakpoint. A mirrored negative set
        (<code class="text-75">--c-space-n-*</code>) exists for pulling elements back over
        gutters.
      </Lede>
      <div class="mt-200 rounded-200 border border-line bg-surface-1 p-250 flex flex-col gap-100">
        <For each={SPACE_SCALE}>
          {s => (
            <div class="flex items-center gap-150">
              <div class="w-14 shrink-0 text-75 font-600 font-mono text-accent">{s.step}</div>
              <div
                class="h-[10px] rounded-10 bg-brand-400"
                style={{ width: `var(--c-space-${s.step})` }}
              />
              <div class="text-75 text-caption font-mono">{s.px}px</div>
            </div>
          )}
        </For>
      </div>

      <div class="mt-500 grid gap-250 lg:grid-cols-3">
        <div>
          <SubHeading>Radius</SubHeading>
          <Lede>
            <code class="text-75">100</code> (8px) is the workhorse — buttons and chips.
          </Lede>
          <div class="mt-200 grid grid-cols-3 gap-150">
            <For each={RADIUS_SCALE}>
              {r => (
                <div class="text-center">
                  <div
                    class="h-16 bg-surface-2 border border-hairline"
                    style={{ "border-radius": `var(--c-border-radius-${r.step})` }}
                  />
                  <div class="mt-50 text-75 font-600 font-mono text-accent">{r.step}</div>
                  <div class="text-50 text-caption">{r.use}</div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div>
          <SubHeading>Border width</SubHeading>
          <Lede>
            The default hairline is 1px <code class="text-75">gray-200</code>.
          </Lede>
          <div class="mt-200 flex flex-col gap-150">
            <div class="rounded-100 bg-surface-1 border-[1px] border-hairline p-150 text-100">
              100 · 1px — hairlines, cards, gridlines
            </div>
            <div class="rounded-100 bg-surface-1 border-[2px] border-accent p-150 text-100">
              200 · 2px — active tab, chart line weight
            </div>
            <div class="rounded-100 bg-surface-1 border-[4px] border-accent p-150 text-100">
              300 · 4px — emphasis rail
            </div>
          </div>
        </div>

        <div>
          <SubHeading>Elevation</SubHeading>
          <Lede>Scarce by design. The market table and every chart have none.</Lede>
          <div class="mt-200 flex flex-col gap-200">
            <div class="rounded-200 bg-surface-1 border border-line p-200 text-100">
              <div class="font-600">flat</div>
              <div class="text-75 text-caption">tables, chart cards, list rows</div>
            </div>
            <div class="rounded-200 bg-surface-1 p-200 text-100 shadow-tiny">
              <div class="font-600">shadow-tiny</div>
              <div class="text-75 text-caption">sticky toolbars, tooltips</div>
            </div>
            <div class="rounded-200 bg-surface-1 p-200 text-100 shadow-overlay">
              <div class="font-600">shadow-overlay</div>
              <div class="text-75 text-caption">dropdowns, modals</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
