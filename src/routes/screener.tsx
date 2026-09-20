import { For, Show, createMemo, createSignal } from "solid-js";
import { clientOnly } from "@solidjs/start";
import { Title, Meta } from "@solidjs/meta";
import { Search, SlidersHorizontal, Target } from "lucide-solid";
import { AppNavbar } from "~/components/navigation/AppNavbar";
import { MarketPulseStrip } from "~/components/navigation/MarketPulseStrip";
import { SetupFormModal } from "~/components/setups/SetupFormModal";
import { Modal } from "~/components/ui/Modal";
import { Sparkline } from "~/components/Sparkline";
import { dashboardData } from "~/lib/dashboard-data";
import {
  QUANT_PRESETS,
  SCREENER_ROWS,
  type ScreenerRow,
  type Universe,
} from "~/lib/screener-data";
import { generateSetupFromPrompt } from "~/lib/setup-generator";
import { initSetupsStore, type StoredSetup } from "~/lib/setups-store";
import { initTheme } from "~/lib/theme";
import { initPalette } from "~/lib/palette";
import { initAccent } from "~/lib/accent";
import { initSavedScreensStore, matchesScreen, savedScreens, type SavedScreen } from "~/lib/screener-store";

const SetupChartPreview = clientOnly(() => import("~/components/setups/SetupChartPreviewImpl"));

function ChartSkeleton() {
  return (
    <div class="rounded-200 border border-line bg-surface-1 p-250">
      <div class="h-5 w-40 rounded-50 bg-surface-2" />
      <div class="mt-150 h-[220px] w-full rounded-100 bg-surface-2" />
    </div>
  );
}

// --------------------------------------------------------------------------
// Delta — direction is never color-alone: glyph first, then ink.
// --------------------------------------------------------------------------

function Delta(props: { value: number }) {
  const up = () => props.value >= 0;
  return (
    <span
      class="inline-flex items-baseline justify-end gap-[3px] font-600 tabular-nums whitespace-nowrap"
      classList={{ "text-pos": up(), "text-neg": !up() }}
    >
      <span aria-hidden="true" class="text-50 leading-none">
        {up() ? "▲" : "▼"}
      </span>
      <span class="sr-only">{up() ? "up" : "down"}</span>
      <span>{Math.abs(props.value).toFixed(2)}%</span>
    </span>
  );
}

const SORT_KEYS = ["score", "chg1d", "chg7d", "chg1m", "rsi14", "momentum3m"] as const;
type SortKey = (typeof SORT_KEYS)[number];

const SORT_LABELS: Record<SortKey, string> = {
  score: "Score",
  chg1d: "1D",
  chg7d: "7D",
  chg1m: "1M",
  rsi14: "RSI",
  momentum3m: "3M",
};

function cellOf(row: ScreenerRow, key: SortKey): number {
  if (key === "score") return row.quantScore;
  return row[key];
}

const universeClasses: Record<Universe, string> = {
  us: "bg-official-bg text-official",
  crypto: "bg-reminder-bg text-reminder",
  ihsg: "bg-noaccess-bg text-noaccess",
};

const UNIVERSAL_LABEL: Record<Universe, string> = {
  us: "US",
  crypto: "Crypto",
  ihsg: "IHSG",
};

export default function ScreenerPage() {
  initTheme();
  initPalette();
  initAccent();
  initSetupsStore();
  initSavedScreensStore();

  const [universe, setUniverse] = createSignal<"all" | Universe>("all");
  const [query, setQuery] = createSignal("");
  const [presets, setPresets] = createSignal<string[]>([]);
  const [minScore, setMinScore] = createSignal(0);
  const [sortKey, setSortKey] = createSignal<SortKey>("score");
  const [sortDir, setSortDir] = createSignal<"asc" | "desc">("desc");
  const [openRow, setOpenRow] = createSignal<ScreenerRow | null>(null);
  const [prefill, setPrefill] = createSignal<StoredSetup | null>(null);
  const [activeScreen, setActiveScreen] = createSignal<SavedScreen | null>(null);

  const togglePreset = (id: string) => {
    setPresets(current =>
      current.includes(id) ? current.filter(p => p !== id) : [...current, id],
    );
  };

  const activePresets = createMemo(() =>
    QUANT_PRESETS.filter(preset => presets().includes(preset.id)),
  );

  const rows = createMemo(() => {
    const q = query().trim().toLowerCase();
    const filtered = SCREENER_ROWS.filter(row => {
      if (universe() !== "all" && row.universe !== universe()) return false;
      if (row.quantScore < minScore()) return false;
      if (activePresets().length > 0 && !activePresets().every(preset => preset.test(row))) return false;
      if (activeScreen() && !matchesScreen(row, activeScreen()!.rules)) return false;
      if (
        q &&
        !`${row.symbol} ${row.name}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
    const key = sortKey();
    const dir = sortDir() === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => cellOf(a, key) - cellOf(b, key) === 0 ? a.symbol.localeCompare(b.symbol) : (cellOf(a, key) - cellOf(b, key)) * dir);
  });

  const universeCount = (id: Universe) => SCREENER_ROWS.filter(row => row.universe === id).length;

  const saveFromRow = (row: ScreenerRow) => {
    const preset = activePresets().find(p => p.test(row));
    const draft = generateSetupFromPrompt(
      `${row.universe === "ihsg" ? "IHSG" : row.universe} ${row.symbol} ${preset?.label ?? "momentum"} thesis`,
    );
    setOpenRow(null);
    setPrefill({
      id: "",
      symbol: row.symbol,
      name: row.name,
      emiten: row.name,
      universe: row.universe,
      direction: draft.direction,
      status: draft.status,
      score: row.quantScore,
      thesis: draft.thesis,
      entry: draft.entry,
      invalidation: draft.invalidation,
      stopLoss: draft.stopLoss,
      target: draft.target,
      riskReward: draft.riskReward,
      catalyst: preset?.label ?? draft.catalyst,
      updated: "Just now",
      spark: row.spark,
    });
  };

  return (
    <>
      <Title>Investing OS | Quant screener</Title>
      <Meta
        name="description"
        content="Screen US stocks, cryptocurrencies and IHSG on fundamentals, technicals and quant rules to surface the best setups."
      />

      <AppNavbar />
      <MarketPulseStrip markets={dashboardData.markets} />

      <main class="mx-auto max-w-[1440px] px-200 pb-800">
        <section class="pt-500">
          <div class="flex items-start justify-between gap-250">
            <div>
              <div class="flex items-center gap-100 text-50 font-700 uppercase tracking-[.08em] text-accent">
                <span class="inline-flex items-center gap-50 px-100 py-[3px] rounded-10 bg-official-bg text-official">
                  <Target size={11} /> Quant screener
                </span>
              </div>
              <h1 class="mt-150 text-800 font-700 leading-[120%] tracking-[-.025em] text-ink">
                Best available setups
              </h1>
              <p class="mt-100 max-w-[68ch] text-100 text-muted">
                Fundamentals, technicals and quant rules across the three supported universes —
                score-ranked, rule-filtered, and one click from the setup workspace.
              </p>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <section class="mt-300 rounded-200 border border-line bg-surface-1" aria-label="Screener filters">
          <div class="px-200 md:px-250 py-200 border-b border-line flex flex-col xl:flex-row xl:items-center gap-150">
            <div class="flex items-center gap-50 overflow-x-auto" role="tablist" aria-label="Universe">
              {(["all", "us", "crypto", "ihsg"] as const).map(id => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={universe() === id}
                  onClick={() => setUniverse(id)}
                  class="shrink-0 h-8 cursor-pointer rounded-100 border px-150 text-75 font-600 capitalize transition-colors"
                  classList={{
                    "border-transparent bg-official-bg text-accent": universe() === id,
                    "border-line bg-surface-2 text-muted hover:text-ink": universe() !== id,
                  }}
                >
                  {id === "all" ? `All (${SCREENER_ROWS.length})` : `${UNIVERSAL_LABEL[id]} (${SCREENER_ROWS.filter(r => r.universe === id).length})`}
                </button>
              ))}
            </div>
            <div class="relative xl:ml-auto w-full xl:w-[300px]">
              <Search size={15} class="pointer-events-none absolute left-150 top-1/2 -translate-y-1/2 text-caption" />
              <input
                type="search"
                value={query()}
                onInput={event => setQuery(event.currentTarget.value)}
                placeholder="Search symbol or emiten…"
                aria-label="Search instruments"
                class="h-10 w-full rounded-100 border border-line bg-surface-2 pl-400 pr-150 text-100 text-ink placeholder:text-caption outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div class="px-200 md:px-250 py-150 flex flex-col lg:flex-row lg:items-center gap-150 border-b border-line">
            <div class="flex items-center gap-100 min-w-0 overflow-x-auto" role="tablist" aria-label="Quant presets">
              <For each={QUANT_PRESETS}>
                {preset => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={presets().includes(preset.id)}
                    onClick={() => togglePreset(preset.id)}
                    title={preset.description}
                    class="shrink-0 h-8 cursor-pointer rounded-100 border px-150 text-75 font-600 transition-colors"
                    classList={{
                      "border-transparent bg-official-bg text-accent": presets().includes(preset.id),
                      "border-line bg-surface-2 text-muted hover:text-ink": !presets().includes(preset.id),
                    }}
                  >
                    {preset.label}
                  </button>
                )}
              </For>
            </div>
            <div class="flex items-center gap-150 lg:ml-auto shrink-0">
              <span class="inline-flex items-center gap-50 text-50 font-700 uppercase tracking-[.05em] text-caption">
                <SlidersHorizontal size={12} /> Score ≥ <span class="text-100 tabular-nums">{minScore()}</span>
              </span>
              <input
                type="range"
                min="0"
                max="95"
                value={minScore()}
                onInput={event => setMinScore(Number(event.currentTarget.value))}
                class="w-40 accent-[var(--c-color-accent)]"
                aria-label="Minimum quant score"
              />
            </div>
          </div>

          <Show when={activePresets().length > 0}>
            <div class="px-200 md:px-250 py-150 border-b border-line bg-surface-2">
              <For each={activePresets()}>
                {preset => (
                  <p class="text-75 text-muted">
                    <span class="font-700 text-ink">{preset.label}</span> — {preset.description}
                  </p>
                )}
              </For>
            </div>
          </Show>
          <Show when={savedScreens().length > 0}>
            <div class="px-200 md:px-250 py-150 border-b border-line bg-bg-1 flex flex-wrap items-center gap-100">
              <span class="text-50 font-700 uppercase tracking-[.05em] text-caption">Saved by agent</span>
              <For each={savedScreens()}>{screen => <button type="button" onClick={() => setActiveScreen(activeScreen()?.id === screen.id ? null : screen)} class="h-8 rounded-100 border px-150 text-75 font-600" classList={{ "border-transparent bg-accent-fill text-on-accent": activeScreen()?.id === screen.id, "border-line bg-surface-2 text-muted": activeScreen()?.id !== screen.id }}>{screen.name}</button>}</For>
            </div>
          </Show>
        </section>

        {/* Sort chips */}
        <div class="mt-150 flex flex-wrap items-center gap-50">
          <span class="text-50 font-700 uppercase tracking-[.05em] text-caption">Sort</span>
          <For each={SORT_KEYS}>
            {key => (
              <button
                type="button"
                onClick={() => {
                  if (sortKey() === key) {
                    setSortDir(d => (d === "desc" ? "asc" : "desc"));
                  } else {
                    setSortKey(key);
                    setSortDir("desc");
                  }
                }}
                aria-pressed={sortKey() === key}
                class="h-7 cursor-pointer px-100 rounded-50 border text-50 font-700 transition-colors tabular-nums"
                classList={{
                  "border-transparent bg-secondary text-on-secondary": sortKey() === key,
                  "border-line text-muted hover:bg-surface-2 hover:text-ink": sortKey() !== key,
                }}
              >
                {SORT_LABELS[key]}
                <span aria-hidden="true" classList={{ "opacity-0": sortKey() !== key }}>
                  {sortKey() === key ? (sortDir() === "desc" ? " ↓" : " ↑") : " ↓"}
                </span>
              </button>
            )}
          </For>
        </div>

        {/* Results */}
        <section class="mt-150 rounded-200 border border-line bg-surface-1 overflow-hidden" aria-label="Screened instruments">
          <ScreenerTable
            rows={rows()}
            sortKey={sortKey()}
            onRowClick={row => setOpenRow(row)}
          />
        </section>
      </main>

      <footer class="border-t border-line bg-bg-2">
        <div class="mx-auto max-w-[1440px] px-200 py-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-100 text-50 text-caption">
          <span>Investing OS quant screener</span>
          <span>All values are deterministic mock data. No live market feed is connected.</span>
        </div>
      </footer>

      {/* Detail drawer */}
      <Modal
        open={openRow() !== null}
        title={openRow() ? `${openRow()!.symbol} — ${openRow()!.name}` : ""}
        width="680px"
        onClose={() => setOpenRow(null)}
      >
        <Show when={openRow()} keyed>
          {row => <RowDetail row={row} onSave={() => saveFromRow(row)} />}
        </Show>
      </Modal>

      <SetupFormModal open={prefill() !== null} initial={prefill()} onClose={() => setPrefill(null)} />
    </>
  );
}

function ScreenerTable(props: {
  rows: ScreenerRow[];
  sortKey: SortKey;
  onRowClick: (row: ScreenerRow) => void;
}) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1080px] border-collapse text-100">
        <caption class="sr-only">
          Quant screener results across US stocks, crypto and IHSG: price, one-day, seven-day and
          one-month change, market cap, volume, price-to-earnings, EPS growth, RSI, three-month
          momentum, composite quant score and a fourteen-point trend line.
        </caption>
        <thead>
          <tr class="text-75 font-500 text-muted border-b border-line">
            <th scope="col" class="w-12 py-150 pl-250 pr-100 text-left font-500">#</th>
            <th scope="col" class="py-150 pr-200 text-left font-500">Instrument</th>
            <th scope="col" class="py-150 px-150 text-right font-500">Price</th>
            <th scope="col" class="py-150 px-150 text-right font-500">1D</th>
            <th scope="col" class="py-150 px-150 text-right font-500">7D</th>
            <th scope="col" class="py-150 px-150 text-right font-500">1M</th>
            <th scope="col" class="py-150 px-150 text-right font-500">P/E</th>
            <th scope="col" class="py-150 px-150 text-right font-500">EPS g</th>
            <th scope="col" class="py-150 px-150 text-right font-500">RSI</th>
            <th scope="col" class="py-150 px-150 text-right font-500">3M mom</th>
            <th scope="col" class="py-150 px-150 text-right font-500">Quant score</th>
            <th scope="col" class="py-150 pr-250 text-right font-500">14d</th>
          </tr>
        </thead>
        <tbody>
          <For
            each={props.rows}
            fallback={
              <tr>
                <td colspan="12" class="px-250 py-500 text-75 text-muted text-center">
                  No instruments match these rules. Loosen the presets or lower the score cut.
                </td>
              </tr>
            }
          >
            {(row, index) => (
              <tr
                tabindex="0"
                onClick={() => props.onRowClick(row)}
                onKeyDown={event => {
                  if (event.key === "Enter") props.onRowClick(row);
                }}
                class="border-b border-line last:border-0 hover:bg-surface-2 focus-visible:bg-surface-2 transition-colors cursor-pointer"
                aria-label={`${row.symbol}, ${row.name}, universe ${row.universe}, quant score ${row.quantScore}. Activate for details.`}
              >
                <td class="py-200 pl-250 pr-100 text-muted tabular-nums">{index() + 1}</td>
                <td class="py-200 pr-200">
                  <div class="flex items-center gap-150">
                    <span class="grid size-6 place-items-center rounded-full bg-surface-2 border border-line text-50 font-700 text-ink shrink-0">
                      {row.symbol.charAt(0)}
                    </span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-100">
                        <span class="font-600 text-ink">{row.name}</span>
                        <span class={`px-100 py-[2px] rounded-10 text-50 font-700 uppercase tracking-[.03em] ${universeClasses[row.universe]}`}>
                          {UNIVERSAL_LABEL[row.universe]}
                        </span>
                      </div>
                      <span class="text-75 text-caption">{row.symbol}</span>
                    </div>
                  </div>
                </td>
                <td class="py-200 px-150 text-right font-600 tabular-nums">{row.price}</td>
                <td class="py-200 px-150 text-right"><Delta value={row.chg1d} /></td>
                <td class="py-200 px-150 text-right"><Delta value={row.chg7d} /></td>
                <td class="py-200 px-150 text-right"><Delta value={row.chg1m} /></td>
                <td class="py-200 px-150 text-right tabular-nums">
                  <Show when={row.pe !== null} fallback={<span class="text-caption">—</span>}>
                    {row.pe?.toFixed(1)}
                  </Show>
                </td>
                <td class="py-200 px-150 text-right">
                  <Show when={row.epsGrowth !== null} fallback={<span class="text-caption">—</span>}>
                    <Delta value={row.epsGrowth!} />
                  </Show>
                </td>
                <td class="py-200 px-150 text-right tabular-nums">{row.rsi14}</td>
                <td class="py-200 px-150 text-right"><Delta value={row.momentum3m} /></td>
                <td class="py-200 px-150 text-right">
                  <span class="inline-flex items-center justify-end gap-100">
                    <span class="w-12 h-1.5 rounded-full bg-surface-2 overflow-hidden shrink-0">
                      <span class="block h-full rounded-full bg-accent-fill" style={{ width: `${row.quantScore}%` }} />
                    </span>
                    <span class="text-75 font-700 tabular-nums">{row.quantScore}</span>
                  </span>
                </td>
                <td class="py-200 pr-250 text-right">
                  <span class="inline-block align-middle">
                    <Sparkline
                      points={row.spark}
                      rising={(row.spark[row.spark.length - 1] ?? 0) > (row.spark[0] ?? 0)}
                      label={`${row.symbol} fourteen-day trend`}
                      width={72}
                      height={26}
                    />
                  </span>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}

function RowDetail(props: { row: ScreenerRow; onSave: () => void }) {
  const matched = createMemo(() => QUANT_PRESETS.filter(preset => preset.test(props.row)));

  return (
    <div>
      <div class="px-250 py-200">
        <div class="flex flex-wrap items-center gap-100">
          <span class={`px-100 py-[2px] rounded-10 text-50 font-700 uppercase tracking-[.04em] ${universeClasses[props.row.universe]}`}>
            {UNIVERSAL_LABEL[props.row.universe]}
          </span>
          <For each={props.row.tags}>
            {tag => (
              <span class="px-100 py-[2px] rounded-10 bg-surface-2 text-50 font-700 text-ink">{tag}</span>
            )}
          </For>
        </div>

        <div class="mt-150 flex flex-wrap items-baseline gap-x-200 gap-y-50 tabular-nums">
          <span class="text-600 font-700">{props.row.price}</span>
          <Delta value={props.row.chg1d} />
          <span class="text-75 text-muted">7d</span>
          <Delta value={props.row.chg7d} />
          <span class="text-75 text-muted">1M</span>
          <Delta value={props.row.chg1m} />
        </div>

        <div class="mt-200">
          <SetupChartPreview ticker={props.row.symbol} fallback={<ChartSkeleton />} />
        </div>

        <div class="mt-200 grid grid-cols-2 sm:grid-cols-3 gap-100" role="group" aria-label="Fundamentals and technicals">
          <Metric label="Market cap" value={props.row.marketCap} />
          <Metric label="Volume" value={props.row.volume} />
          <Metric label="P/E" value={props.row.pe === null ? "—" : props.row.pe.toFixed(1)} />
          <Metric label="EPS growth" value={props.row.epsGrowth === null ? "—" : `${props.row.epsGrowth.toFixed(1)}%`} />
          <Metric label="Revenue growth" value={props.row.revenueGrowth === null ? "—" : `${props.row.revenueGrowth.toFixed(1)}%`} />
          <Metric label="Net margin" value={props.row.netMargin === null ? "—" : `${props.row.netMargin.toFixed(1)}%`} />
          <Metric label="RSI (14)" value={String(props.row.rsi14)} />
          <Metric label="vs 50-day" value={`${props.row.sma50Pos > 0 ? "+" : ""}${props.row.sma50Pos.toFixed(1)}%`} />
          <Metric label="30d volatility" value={`${props.row.vol30d.toFixed(1)}%`} />
        </div>

        <div class="mt-200 rounded-200 border border-line bg-surface-2 p-200">
          <p class="text-50 font-700 uppercase tracking-[.08em] text-caption">Quant rules</p>
          <div class="mt-100 space-y-50">
            <For each={QUANT_PRESETS}>
              {preset => {
                const pass = createMemo(() => preset.test(props.row));
                const relevant = preset.appliesTo.includes(props.row.universe);
                return (
                  <Show when={relevant}>
                    <p class="flex items-center gap-100 text-75">
                      <Show when={pass()} fallback={<span class="text-caption">—</span>}>
                        <span class="text-pos font-700" aria-hidden="true">▲</span>
                        <span class="sr-only">passes</span>
                      </Show>
                      <span class={pass() ? "font-600 text-ink" : "text-muted"}>
                        {preset.label} — {preset.description}
                      </span>
                    </p>
                  </Show>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      <div class="sticky bottom-0 border-t border-line bg-surface-2 px-250 py-200 flex items-center justify-between gap-200">
        <span class="inline-flex items-center gap-100 text-75 text-muted">
          <Target size={14} class="text-accent" />
          {matched().length} of {QUANT_PRESETS.length} rules match
        </span>
        <button
          type="button"
          onClick={props.onSave}
          class="h-9 px-200 rounded-100 bg-accent-fill text-on-accent text-100 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer"
        >
          Save as setup
        </button>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div class="rounded-100 border border-line bg-surface-2 px-150 py-100">
      <p class="text-50 font-600 text-muted">{props.label}</p>
      <p class="mt-[2px] text-100 font-700 text-ink tabular-nums">{props.value}</p>
    </div>
  );
}
