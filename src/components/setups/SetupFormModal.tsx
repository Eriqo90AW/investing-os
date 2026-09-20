import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { clientOnly } from "@solidjs/start";
import { Database, Sparkles } from "lucide-solid";
import { Modal } from "~/components/ui/Modal";
import type { Direction, SetupStatus } from "~/lib/dashboard-data";
import { buildSpark, generateSetupFromPrompt } from "~/lib/setup-generator";
import { hashString, rng } from "~/lib/random";
import {
  SETUP_STATUSES,
  SETUP_UNIVERSES,
  addSetup,
  newSetupId,
  updateSetup,
  type SetupUniverse,
  type StoredSetup,
} from "~/lib/setups-store";

const SetupChartPreview = clientOnly(() => import("./SetupChartPreviewImpl"));

function ChartSkeleton() {
  return (
    <div class="rounded-200 border border-line bg-surface-1 p-250">
      <div class="h-5 w-40 rounded-50 bg-surface-2" />
      <div class="mt-150 h-[300px] w-full rounded-100 bg-surface-2" />
    </div>
  );
}

export interface SetupFormModalProps {
  open: boolean;
  /** Null → create; a stored setup → edit. */
  initial: StoredSetup | null;
  onClose: () => void;
}

interface FormFields {
  name: string;
  emiten: string;
  symbol: string;
  universe: SetupUniverse;
  direction: Direction;
  status: SetupStatus;
  thesis: string;
  entry: string;
  target: string;
  stopLoss: string;
  invalidation: string;
  riskReward: string;
  catalyst: string;
}

const EMPTY: FormFields = {
  name: "",
  emiten: "",
  symbol: "",
  universe: "us",
  direction: "long",
  status: "watching",
  thesis: "",
  entry: "",
  target: "",
  stopLoss: "",
  invalidation: "",
  riskReward: "",
  catalyst: "",
};

/** Loosen "$176.20–178.00" / "Rp 9,150" into a float where one exists. */
function parseLevel(text: string): number | null {
  const first = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!first) return null;
  const n = Number.parseFloat(first[0] ?? "");
  return Number.isFinite(n) ? n : null;
}

function fieldClasses(): string {
  return "h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-100 text-ink placeholder:text-caption outline-none focus:border-accent transition-colors";
}

function labelClasses(): string {
  return "mb-50 block text-75 font-600 text-muted";
}

export function SetupFormModal(props: SetupFormModalProps) {
  const [fields, setFields] = createSignal<FormFields>(EMPTY);
  const [touched, setTouched] = createSignal(false);
  const [prompt, setPrompt] = createSignal("");
  const [draftNote, setDraftNote] = createSignal(false);
  const [chartTicker, setChartTicker] = createSignal("");

  // Re-initialise the form each time the dialog opens.
  createEffect(() => {
    if (!props.open) return;
    const initial = props.initial;
    if (initial) {
      setFields({
        name: initial.name,
        emiten: initial.emiten,
        symbol: initial.symbol,
        universe: initial.universe,
        direction: initial.direction,
        status: initial.status,
        thesis: initial.thesis,
        entry: initial.entry,
        target: initial.target,
        stopLoss: initial.stopLoss,
        invalidation: initial.invalidation,
        riskReward: initial.riskReward,
        catalyst: initial.catalyst,
      });
    } else {
      setFields(EMPTY);
    }
    setTouched(false);
    setPrompt("");
    setDraftNote(false);
    setChartTicker(initial?.symbol ?? "");
  });

  let debounce: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const raw = fields().symbol.trim().toUpperCase();
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (raw.length >= 1) setChartTicker(raw);
    }, 500);
  });

  const valid = createMemo(() => {
    const f = fields();
    return {
      symbol: f.symbol.trim().length > 0,
      thesis: f.thesis.trim().length > 0,
      entry: f.entry.trim().length > 0,
      stopLoss: f.stopLoss.trim().length > 0,
      target: f.target.trim().length > 0,
    };
  });
  const formValid = () => props.initial?.lifecycle === "draft" || Object.values(valid()).every(Boolean);

  const save = () => {
    setTouched(true);
    if (!formValid()) return;
    const f = fields();
    const payload = { ...f, symbol: f.symbol.trim().toUpperCase() };
    const existing = props.initial;
    const isEdit = !!existing && !!existing.id;
    if (isEdit && existing) {
      updateSetup(existing.id, payload);
    } else {
      addSetup({
        ...payload,
        id: newSetupId(payload.symbol),
        score: 60,
        updated: "Just now",
        spark: seededSpark(payload.symbol),
      });
    }
    props.onClose();
  };

  const generate = () => {
    const value = prompt().trim();
    if (!value) return;
    const draft = generateSetupFromPrompt(value);
    setFields(f => ({
      ...f,
      name: draft.name,
      emiten: draft.emiten,
      symbol: draft.symbol,
      universe: draft.universe,
      direction: draft.direction,
      status: draft.status,
      thesis: draft.thesis,
      entry: draft.entry,
      target: draft.target,
      stopLoss: draft.stopLoss,
      invalidation: draft.invalidation,
      riskReward: draft.riskReward,
      catalyst: draft.catalyst,
    }));
    setChartTicker(draft.symbol);
    setDraftNote(true);
    setTouched(false);
  };

  const autoRR = createMemo(() => {
    const { entry, target, stopLoss } = fields();
    const e = parseLevel(entry);
    const t = parseLevel(target);
    const s = parseLevel(stopLoss);
    if (e === null || t === null || s === null) return "—";
    const risk = Math.abs(e - s);
    if (risk === 0) return "—";
    const reward = Math.abs(t - e);
    void reward;
    const rr = reward / risk;
    return `${rr.toFixed(1)}R`;
  });

  return (
    <Modal
      open={props.open}
      title={
        props.initial?.id ? `Edit ${props.initial.symbol} setup` : props.initial ? "Draft setup" : "New setup"
      }
      onClose={props.onClose}
      width="1360px"
      contentClass="lg:flex lg:overflow-hidden"
      footer={
        <div class="flex items-center justify-between gap-200">
          <p class="text-50 text-caption">
            Saving stores the setup locally in this browser (mock persistence).
          </p>
          <div class="flex items-center gap-100">
            <button
              type="button"
              onClick={props.onClose}
              class="h-9 px-200 rounded-100 text-100 font-600 text-ink hover:bg-surface-1 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={touched() && !formValid()}
              class="h-9 px-200 rounded-100 bg-accent-fill text-on-accent text-100 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {props.initial?.id ? "Save changes" : "Save setup"}
            </button>
          </div>
        </div>
      }
    >
      {/* Wide workspace: inputs + agent on the left, chart focus on the right. */}
      <div class="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[440px_minmax(0,1fr)]">
        <div class="min-w-0 border-b border-line lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {/* Mock agentic composer */}
      <section class="border-b border-line bg-surface-2 px-250 py-200">
        <div class="flex items-center justify-between gap-150">
          <div class="flex items-center gap-100">
            <Sparkles size={15} class="text-accent" />
            <h3 class="text-100 font-700">Generate with agent</h3>
            <span class="inline-flex items-center gap-50 px-100 py-[3px] rounded-10 bg-reminder-bg text-reminder text-50 font-700 uppercase tracking-[.04em]">
              <Database size={11} /> Mock
            </span>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={!prompt().trim()}
            class="inline-flex h-8 shrink-0 items-center gap-100 rounded-100 bg-accent-fill px-150 text-on-accent text-75 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={13} /> Generate draft
          </button>
        </div>
        <textarea
          rows="2"
          value={prompt()}
          onInput={event => setPrompt(event.currentTarget.value)}
          placeholder="Describe the trade — e.g. “long NVDA breakout on AI momentum”, “short TLKM after the earnings pop”, “crypto: ETH trend continuation”"
          class="mt-150 block w-full resize-none rounded-100 border border-line bg-surface-1 px-150 py-100 text-100 text-ink placeholder:text-caption outline-none focus:border-accent transition-colors"
        />
        <Show when={draftNote()}>
          <p class="mt-100 text-75 text-reminder">
            Draft generated — every field is a starting point. Review and edit before saving.
          </p>
        </Show>
      </section>

      <form
        class="px-250 py-250"
        onSubmit={event => {
          event.preventDefault();
          save();
        }}
      >
        <section aria-label="Instrument">
          <h4 class="text-50 font-700 uppercase tracking-[.08em] text-caption">Instrument</h4>
          <div class="mt-150 grid grid-cols-1 gap-200 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label class={labelClasses()} for="setup-name">Name</label>
              <input
                id="setup-name"
                value={fields().name}
                onInput={e => setFields(f => ({ ...f, name: e.currentTarget.value }))}
                placeholder="Nvidia"
                class={fieldClasses()}
              />
            </div>
            <div>
              <label class={labelClasses()} for="setup-emiten">Emiten (issuer)</label>
              <input
                id="setup-emiten"
                value={fields().emiten}
                onInput={e => setFields(f => ({ ...f, emiten: e.currentTarget.value }))}
                placeholder="NVIDIA Corporation"
                class={fieldClasses()}
              />
            </div>
            <div>
              <label class={labelClasses()} for="setup-symbol">Ticker <span class="text-neg">*</span></label>
              <input
                id="setup-symbol"
                value={fields().symbol}
                onInput={e => setFields(f => ({ ...f, symbol: e.currentTarget.value.toUpperCase().slice(0, 8) }))}
                placeholder="NVDA"
                class={`${fieldClasses()} uppercase`}
                aria-invalid={touched() && !valid().symbol}
                aria-describedby={touched() && !valid().symbol ? "setup-symbol-error" : undefined}
              />
              <Show when={touched() && !valid().symbol}>
                <p id="setup-symbol-error" class="mt-50 text-50 font-600 text-neg">Ticker is required.</p>
              </Show>
            </div>
            <div>
              <span class={labelClasses()}>Universe</span>
              <div class="flex flex-wrap gap-100">
                <For each={SETUP_UNIVERSES}>
                  {u => (
                    <button
                      type="button"
                      onClick={() => setFields(f => ({ ...f, universe: u.id }))}
                      aria-pressed={fields().universe === u.id}
                      class="h-8 shrink-0 cursor-pointer rounded-100 border px-150 text-75 font-600 transition-colors"
                      classList={{
                        "border-transparent bg-official-bg text-accent": fields().universe === u.id,
                        "border-line bg-surface-2 text-muted hover:text-ink": fields().universe !== u.id,
                      }}
                    >
                      {u.label}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Plan" class="mt-250">
          <h4 class="text-50 font-700 uppercase tracking-[.08em] text-caption">Thesis &amp; plan</h4>
          <div class="mt-150">
            <label class={labelClasses()} for="setup-thesis">Thesis <span class="text-neg">*</span></label>
            <textarea
              id="setup-thesis"
              rows="3"
              value={fields().thesis}
              onInput={e => setFields(f => ({ ...f, thesis: e.currentTarget.value }))}
              placeholder="Why this trade, in one or two sentences."
              class="block w-full resize-none rounded-100 border border-line bg-surface-2 px-150 py-100 text-100 text-ink placeholder:text-caption outline-none focus:border-accent transition-colors"
              aria-invalid={touched() && !valid().thesis}
            />
          </div>
          <div class="mt-150 grid grid-cols-1 gap-200">
            <div>
              <span class={labelClasses()}>Direction</span>
              <div class="flex gap-100">
                {(["long", "short"] as Direction[]).map(d => (
                  <button
                    type="button"
                    onClick={() => setFields(f => ({ ...f, direction: d }))}
                    aria-pressed={fields().direction === d}
                    class="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-50 rounded-100 border px-150 text-75 font-700 uppercase tracking-[.03em] transition-colors"
                    classList={{
                      "border-transparent bg-surface-1": fields().direction === d,
                      "border-line bg-surface-2 text-muted hover:text-ink": fields().direction !== d,
                    }}
                  >
                    <span classList={{ "text-pos": d === "long", "text-neg": d === "short" }}>
                      {d === "long" ? "▲" : "▼"}
                    </span>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span class={labelClasses()}>Status</span>
              <div class="flex flex-wrap gap-100">
                <For each={SETUP_STATUSES}>
                  {s => (
                    <button
                      type="button"
                      onClick={() => setFields(f => ({ ...f, status: s }))}
                      aria-pressed={fields().status === s}
                      class="h-8 shrink-0 cursor-pointer rounded-100 border px-150 text-75 font-600 capitalize transition-colors"
                      classList={{
                        "border-transparent bg-official-bg text-accent": fields().status === s,
                        "border-line bg-surface-2 text-muted hover:text-ink": fields().status !== s,
                      }}
                    >
                      {s}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Levels" class="mt-250">
          <h4 class="text-50 font-700 uppercase tracking-[.08em] text-caption">Levels &amp; risk</h4>
          <div class="mt-150 grid grid-cols-2 gap-200">
            <LevelField
              id="setup-entry"
              label="Entry"
              required
              error={touched() && !valid().entry}
              value={() => fields().entry}
              onInput={v => setFields(f => ({ ...f, entry: v }))}
            />
            <LevelField
              id="setup-stop"
              label="Stop loss"
              required
              error={touched() && !valid().stopLoss}
              value={() => fields().stopLoss}
              onInput={v => setFields(f => ({ ...f, stopLoss: v, invalidation: v }))}
            />
            <LevelField
              id="setup-target"
              label="Target"
              required
              error={touched() && !valid().target}
              value={() => fields().target}
              onInput={v => setFields(f => ({ ...f, target: v }))}
            />
            <div>
              <span class={labelClasses()}>Risk / reward</span>
              <div class="flex h-10 w-full items-center justify-between rounded-100 border border-line bg-surface-2 px-150 tabular-nums">
                <span class="text-100 font-700 text-ink">{autoRR()}</span>
                <span class="text-50 text-caption">auto</span>
              </div>
            </div>
          </div>
          <p class="mt-100 text-50 text-caption">
            Invalidation mirrors the stop loss by default; edit it separately if the thesis invalidates elsewhere.
          </p>
          <div class="mt-150">
            <label class={labelClasses()} for="setup-invalidation">Invalidation level</label>
            <input
              id="setup-invalidation"
              value={fields().invalidation}
              onInput={e => setFields(f => ({ ...f, invalidation: e.currentTarget.value }))}
              placeholder="$169.40"
              class={fieldClasses()}
            />
          </div>
          <div class="mt-150 max-w-[360px]">
            <label class={labelClasses()} for="setup-catalyst">Catalyst</label>
            <input
              id="setup-catalyst"
              value={fields().catalyst}
              onInput={e => setFields(f => ({ ...f, catalyst: e.currentTarget.value }))}
              placeholder="Earnings, macro print, product update…"
              class={fieldClasses()}
            />
          </div>
        </section>

        <Show when={touched() && !formValid()}>
          <p class="mt-200 text-75 font-600 text-neg" role="alert">
            Fill the required fields — ticker, thesis, entry, stop loss and target — to save.
          </p>
        </Show>
      </form>
        </div>

        {/* The form scrolls independently; the technical-analysis canvas stays put. */}
        <aside aria-label="Chart" class="min-w-0 border-t border-line bg-surface-2 lg:min-h-0 lg:overflow-hidden lg:border-t-0">
          <div class="h-full p-250">
            <div class="flex flex-wrap items-end justify-between gap-100">
              <div>
                <h4 class="text-50 font-700 uppercase tracking-[.08em] text-caption">Chart</h4>
                <p class="mt-50 text-200 font-700 tabular-nums">
                  {chartTicker() ? chartTicker().toUpperCase() : "—"}
                  <span class="ml-100 text-75 font-600 text-muted">analysis workspace</span>
                </p>
              </div>
              <div class="flex flex-wrap gap-x-200 gap-y-50 text-75 tabular-nums">
                <span class="text-muted">Entry <strong class="text-ink">{fields().entry || "—"}</strong></span>
                <span class="text-neg">Stop <strong>{fields().stopLoss || "—"}</strong></span>
                <span class="text-pos">Target <strong>{fields().target || "—"}</strong></span>
                <span class="text-muted">R/R <strong class="text-ink">{autoRR()}</strong></span>
              </div>
            </div>
            <div class="mt-150">
              <Show
                when={chartTicker()}
                keyed
                fallback={
                  <div class="grid h-[300px] w-full place-items-center rounded-200 border border-dashed border-line bg-surface-1 p-250 text-center">
                    <p class="max-w-[36ch] text-100 text-muted">
                      Enter a ticker to preview its chart — e.g. NVDA, BTC, BBCA.
                    </p>
                  </div>
                }
              >
                {ticker => <SetupChartPreview ticker={ticker} height={300} fallback={<ChartSkeleton />} />}
              </Show>
            </div>
            <p class="mt-100 text-50 text-caption">
              Drawings stay local to this editing session. Price data is seeded sample data, not a live feed.
            </p>
          </div>
        </aside>
      </div>
    </Modal>
  );
}

function seededSpark(symbol: string) {
  return buildSpark(rng(hashString(`spark:${symbol.toUpperCase()}`)));
}

function LevelField(props: {
  id: string;
  label: string;
  required?: boolean;
  error?: boolean;
  value: () => string;
  onInput: (value: string) => void;
}) {
  return (
    <div>
      <label class={labelClasses()} for={props.id}>
        {props.label} {props.required ? <span class="text-neg">*</span> : null}
      </label>
      <input
        id={props.id}
        value={props.value()}
        onInput={e => props.onInput(e.currentTarget.value)}
        class={fieldClasses()}
        aria-invalid={props.error}
      />
    </div>
  );
}
