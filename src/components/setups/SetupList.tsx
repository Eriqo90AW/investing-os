import { For, Show, createMemo, createSignal } from "solid-js";
import { Pencil, Search, Target, Trash2 } from "lucide-solid";
import { Sparkline } from "~/components/Sparkline";
import type { SetupStatus } from "~/lib/dashboard-data";
import {
  SETUP_STATUSES,
  SETUP_UNIVERSES,
  removeSetup,
  setups,
  statusClasses,
  directionGlyph,
} from "~/lib/setups-store";

type UniverseFilter = "all" | "us" | "crypto" | "ihsg";
const SETUP_FILTERS: Array<"all" | SetupStatus> = ["all", ...SETUP_STATUSES];

const UNIVERSE_LABEL = new Map(SETUP_UNIVERSES.map(u => [u.id, u.label] as const));

/**
 * The setup workspace behind `/setups`. Reads the shared setups store, so a
 * setup saved from the screener or edited here shows up on the dashboard
 * Alpha board too. Same row anatomy as the Alpha board, plus edit/delete.
 */
export function SetupList(props: { onEdit: (id: string) => void; onOpen?: (id: string) => void }) {
  const [status, setStatus] = createSignal<"all" | SetupStatus>("all");
  const [universe, setUniverse] = createSignal<UniverseFilter>("all");
  const [query, setQuery] = createSignal("");
  const [confirmingDelete, setConfirmingDelete] = createSignal<string | null>(null);

  const visible = createMemo(() => {
    const q = query().trim().toLowerCase();
    return setups().filter(item => {
      if (status() !== "all" && item.status !== status()) return false;
      if (universe() !== "all" && item.universe !== universe()) return false;
      if (
        q &&
        !`${item.symbol} ${item.name} ${item.emiten ?? ""} ${item.thesis}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  });

  return (
    <section id="workspace" class="rounded-200 border border-line bg-surface-1 overflow-hidden">
      <div class="px-200 md:px-250 pt-200 md:pt-250 pb-150 border-b border-line">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-150">
          <div>
            <div class="flex items-center gap-100">
              <Target size={17} class="text-accent" />
              <h2 class="text-300 font-700 tracking-[-.01em]">Saved setups</h2>
              <span class="px-100 py-[2px] rounded-10 bg-surface-2 text-caption text-50 font-700">
                {setups().length} setups
              </span>
            </div>
            <p class="mt-50 text-75 text-muted">
              Theses, levels and outcome tracking across all three universes.
            </p>
          </div>
          <div class="relative self-start w-full md:w-[320px]">
            <Search size={15} class="pointer-events-none absolute left-150 top-1/2 -translate-y-1/2 text-caption" />
            <input
              type="search"
              value={query()}
              onInput={event => setQuery(event.currentTarget.value)}
              placeholder="Search ticker, emiten, thesis…"
              aria-label="Search setups"
              class="h-10 w-full rounded-100 border border-line bg-surface-2 pl-400 pr-150 text-100 text-ink placeholder:text-caption outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div class="mt-200 flex flex-wrap items-center gap-x-300 gap-y-100">
          <div class="flex items-center gap-50 overflow-x-auto pb-50" role="tablist" aria-label="Filter setups by status">
            <For each={SETUP_FILTERS}>
              {item => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={status() === item}
                  onClick={() => setStatus(item)}
                  class="shrink-0 h-8 cursor-pointer rounded-100 border px-150 text-75 font-600 capitalize transition-colors"
                  classList={{
                    "border-transparent bg-official-bg text-accent": status() === item,
                    "border-line bg-surface-2 text-muted hover:text-ink": status() !== item,
                  }}
                >
                  {item}
                </button>
              )}
            </For>
          </div>
          <div class="flex items-center gap-50 overflow-x-auto pb-50" role="tablist" aria-label="Filter setups by universe">
            <For each={["all" as const, ...SETUP_UNIVERSES.map(u => u.id)]}>
              {item => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={universe() === item}
                  onClick={() => setUniverse(item)}
                  class="shrink-0 h-8 cursor-pointer rounded-100 border px-150 text-75 font-600 capitalize transition-colors"
                  classList={{
                    "border-transparent bg-official-bg text-accent": universe() === item,
                    "border-line bg-surface-2 text-muted hover:text-ink": universe() !== item,
                  }}
                >
                  {item === "all" ? "All universes" : SETUP_UNIVERSES.find(u => u.id === item)?.label}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      <div class="hidden lg:grid grid-cols-[minmax(230px,1.6fr)_90px_90px_110px_105px_90px_120px] gap-150 px-250 py-100 border-b border-line text-50 font-700 uppercase tracking-[.05em] text-caption">
        <span>Setup</span><span>Score</span><span>Entry</span><span>Invalidation</span><span>Target</span><span>R / R</span><span class="text-right">Actions</span>
      </div>

      <div class="divide-y divide-line">
        <For
          each={visible()}
          fallback={
            <p class="px-250 py-500 text-75 text-muted text-center">
              No setups match these filters. Adjust the filters or create a new setup.
            </p>
          }
        >
          {setup => (
            <article
              onClick={() => props.onOpen ? props.onOpen(setup.id) : props.onEdit(setup.id)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (props.onOpen) props.onOpen(setup.id);
                  else props.onEdit(setup.id);
                }
              }}
              tabindex="0"
              role="button"
              aria-label={`Open ${setup.symbol} setup`}
              title={`Open ${setup.symbol} setup`}
              class="px-200 md:px-250 py-200 hover:bg-surface-2 focus-visible:bg-surface-2 transition-colors cursor-pointer outline-none"
            >
              <div class="lg:grid lg:grid-cols-[minmax(230px,1.6fr)_90px_90px_110px_105px_90px_120px] lg:gap-150 lg:items-center">
                <div class="min-w-0">
                  <div class="flex items-center gap-100">
                    <span class="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 border border-line text-50 font-900 text-ink">
                      {setup.symbol.slice(0, 2)}
                    </span>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-100">
                        <span class="text-100 font-700">{setup.symbol}</span>
                        <span class="sr-only">{setup.direction === "long" ? "long" : "short"}</span>
                        <span
                          aria-hidden="true"
                          class="text-50 font-700"
                          classList={{ "text-pos": setup.direction === "long", "text-neg": setup.direction === "short" }}
                        >
                          {directionGlyph(setup.direction)}
                        </span>
                        <span class={`px-100 py-[2px] rounded-10 text-50 font-700 uppercase tracking-[.03em] ${statusClasses(setup.status)}`}>{setup.status}</span>
                        <Show when={setup.lifecycle === "draft"}>
                          <span class="px-100 py-[2px] rounded-10 bg-reminder-bg text-reminder text-50 font-700 uppercase tracking-[.03em]">draft</span>
                        </Show>
                        <span class="px-100 py-[2px] rounded-10 bg-surface-2 text-50 font-700 text-caption uppercase tracking-[.03em]">{setup.universe}</span>
                      </div>
                      <p class="mt-50 text-75 text-muted truncate" title={setup.thesis}>{setup.thesis}</p>
                    </div>
                  </div>
                </div>
                <div class="mt-150 lg:mt-0 flex items-center gap-100">
                  <div class="w-10 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <span class="block h-full rounded-full bg-accent-fill" style={{ width: `${setup.score}%` }} />
                  </div>
                  <span class="text-75 font-700 tabular-nums">{setup.score}</span>
                  <Show when={setup.spark.length > 1}>
                    <Sparkline
                      points={setup.spark}
                      rising={(setup.spark[setup.spark.length - 1] ?? 0) > (setup.spark[0] ?? 0)}
                      label={`${setup.symbol} recent trend preview`}
                      width={56}
                      height={22}
                    />
                  </Show>
                </div>
                <dl class="mt-150 lg:mt-0 grid grid-cols-2 sm:grid-cols-4 lg:contents gap-150 tabular-nums">
                  <div>
                    <dt class="lg:hidden text-50 text-caption">Entry</dt>
                    <dd class="mt-50 lg:mt-0 text-75 font-600">{setup.entry}</dd>
                  </div>
                  <div>
                    <dt class="lg:hidden text-50 text-caption">Invalidation</dt>
                    <dd class="mt-50 lg:mt-0 text-75 font-600 text-neg">{setup.invalidation}</dd>
                  </div>
                  <div>
                    <dt class="lg:hidden text-50 text-caption">Target</dt>
                    <dd class="mt-50 lg:mt-0 text-75 font-600 text-pos">{setup.target}</dd>
                  </div>
                  <div>
                    <dt class="lg:hidden text-50 text-caption">R / R</dt>
                    <dd class="mt-50 lg:mt-0 text-75 font-700">{setup.riskReward}</dd>
                  </div>
                </dl>
                <div
                  class="mt-150 lg:mt-0 flex items-center lg:justify-end gap-100"
                  onClick={event => event.stopPropagation()}
                  onKeyDown={event => event.stopPropagation()}
                >
                  <Show
                    when={confirmingDelete() === setup.id}
                    fallback={
                      <>
                        <button
                          type="button"
                          onClick={() => props.onEdit(setup.id)}
                          class="grid size-8 cursor-pointer place-items-center rounded-100 text-caption hover:bg-bg-1 hover:text-ink transition-colors"
                          aria-label={`Edit ${setup.symbol} setup`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(setup.id)}
                          class="grid size-8 cursor-pointer place-items-center rounded-100 text-caption hover:bg-neg-bg hover:text-neg transition-colors"
                          aria-label={`Delete ${setup.symbol} setup`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        removeSetup(setup.id);
                        setConfirmingDelete(null);
                      }}
                      class="h-8 px-150 rounded-100 bg-neg-bg text-neg text-50 font-700 cursor-pointer"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(null)}
                      class="h-8 px-100 rounded-100 text-50 font-600 text-caption cursor-pointer"
                    >
                      Keep
                    </button>
                  </Show>
                </div>
              </div>
              <div class="mt-150 lg:pl-10 flex flex-wrap items-center gap-x-200 gap-y-50 text-50 text-caption">
                <span>{setup.emiten}</span>
                {setup.catalyst ? <span class="inline-flex items-center gap-50">{setup.catalyst}</span> : null}
                <span>Updated {setup.updated}</span>
              </div>
            </article>
          )}
        </For>
      </div>

      <Show when={setups().length > 0}>
        <p class="sr-only">{visible().length} of {setups().length} setups shown.</p>
      </Show>
    </section>
  );
}
