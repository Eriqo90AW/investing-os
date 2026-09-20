import { For, Show, createMemo, createSignal } from "solid-js";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  ExternalLink,
  Gauge,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-solid";
import type {
  AgentSuggestion,
  DashboardKpi,
  InvestmentSetup,
  MarketSnapshot,
  SetupStatus,
  SignalEvent,
} from "~/lib/dashboard-data";

function KpiSparkline(props: { values: number[]; positive: boolean }) {
  const width = 112;
  const height = 36;
  const min = Math.min(...props.values);
  const max = Math.max(...props.values);
  const span = max - min || 1;
  const points = props.values
    .map((value, index) => {
      const x = (index / (props.values.length - 1)) * width;
      const y = 3 + ((max - value) / span) * (height - 6);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} class="w-24 h-8" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={props.positive ? "var(--c-chart-up)" : "var(--c-chart-down)"}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  );
}

export function DashboardHero(props: { asOf: string }) {
  return (
    <section id="overview" class="pt-500 scroll-mt-28">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-250">
        <div>
          <div class="flex items-center gap-100 text-50 font-700 uppercase tracking-[.08em] text-accent">
            <span class="inline-flex items-center gap-50 px-100 py-[3px] rounded-10 bg-official-bg text-official">
              <Database size={11} /> Mock data
            </span>
            Research command center
          </div>
          <h1 class="mt-150 text-800 font-700 leading-[120%] tracking-[-.025em] text-ink">
            Good evening, Eriq.
          </h1>
          <p class="mt-100 max-w-[68ch] text-100 text-muted">
            Your setups are outperforming this month. Two fresh signals need a decision before the next session.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-100">
          <span class="inline-flex items-center gap-100 h-9 px-150 rounded-100 border border-line bg-surface-1 text-75 text-muted">
            <span class="w-1.5 h-1.5 rounded-full bg-pos" />
            Updated {props.asOf}
          </span>
          <button type="button" class="h-9 px-150 inline-flex items-center gap-100 rounded-100 bg-accent-fill text-on-accent text-75 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer">
            <Plus size={16} /> New setup
          </button>
        </div>
      </div>
    </section>
  );
}

export function KpiGrid(props: { kpis: DashboardKpi[] }) {
  return (
    <section class="mt-300 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-150" aria-label="Setup performance metrics">
      <For each={props.kpis}>
        {kpi => (
          <article class="relative overflow-hidden rounded-200 border border-line bg-surface-1 p-200 min-h-[148px] group hover:border-hairline transition-colors">
            <div class="flex items-start justify-between gap-150">
              <p class="text-75 font-600 text-muted">{kpi.label}</p>
              <span
                class="inline-flex items-center gap-[2px] px-100 py-[3px] rounded-10 text-50 font-700 tabular-nums"
                classList={{ "bg-pos-bg text-pos": kpi.change >= 0, "bg-neg-bg text-neg": kpi.change < 0 }}
              >
                <Show when={kpi.change >= 0} fallback={<ArrowDownRight size={11} />}><ArrowUpRight size={11} /></Show>
                {Math.abs(kpi.change).toFixed(1)}%
              </span>
            </div>
            <div class="mt-150 flex items-end justify-between gap-100">
              <div>
                <div class="text-600 font-700 leading-none tracking-[-.02em] tabular-nums">{kpi.value}</div>
                <div class="mt-100 text-75 text-caption">{kpi.detail}</div>
              </div>
              <KpiSparkline values={kpi.spark} positive={kpi.change >= 0} />
            </div>
          </article>
        )}
      </For>
    </section>
  );
}

export function MarketRegime(props: { markets: MarketSnapshot[] }) {
  return (
    <section class="mt-150 rounded-200 border border-line bg-surface-1 overflow-hidden">
      <div class="px-200 py-150 flex items-center justify-between border-b border-line">
        <div class="flex items-center gap-100">
          <Gauge size={16} class="text-accent" />
          <h2 class="text-100 font-700">Market regime</h2>
          <span class="px-100 py-[2px] rounded-10 bg-reminder-bg text-reminder text-50 font-700 uppercase tracking-[.04em]">Risk on</span>
        </div>
        <p class="hidden sm:block text-50 text-caption">Cross-asset context, fixture snapshot</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-x divide-y xl:divide-y-0 divide-line">
        <For each={props.markets}>
          {market => (
            <div class="px-200 py-150 min-w-0">
              <div class="flex items-center justify-between gap-100">
                <span class="text-75 font-700 text-ink">{market.symbol}</span>
                <span class="text-50 text-caption truncate">{market.label}</span>
              </div>
              <div class="mt-100 flex items-baseline justify-between gap-100 tabular-nums">
                <span class="text-100 font-600 truncate">{market.value}</span>
                <span class="text-75 font-700" classList={{ "text-pos": market.change >= 0, "text-neg": market.change < 0 }}>
                  {market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}

export function PerformanceSummary() {
  const [range, setRange] = createSignal("3M");
  const ranges = ["1M", "3M", "6M", "YTD", "All"];
  return (
    <div class="mb-150 flex flex-col sm:flex-row sm:items-center justify-between gap-150">
      <div>
        <div class="flex items-center gap-100">
          <h2 class="text-300 font-700 tracking-[-.01em]">Research portfolio</h2>
          <span class="px-100 py-[2px] rounded-10 bg-pos-bg text-pos text-50 font-700">+18.6%</span>
        </div>
        <p class="mt-50 text-75 text-muted">Mock net asset value across tracked positions.</p>
      </div>
      <div class="inline-flex self-start items-center p-[3px] rounded-100 border border-line bg-surface-2">
        <For each={ranges}>
          {item => (
            <button
              type="button"
              onClick={() => setRange(item)}
              aria-pressed={range() === item}
              class="h-7 px-100 rounded-50 text-50 font-700 transition-colors cursor-pointer"
              classList={{
                "bg-surface-1 text-ink shadow-tiny": range() === item,
                "text-muted hover:text-ink": range() !== item,
              }}
            >
              {item}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

export function AgentResearchPanel(props: { suggestions: AgentSuggestion[] }) {
  const [prompt, setPrompt] = createSignal("");
  const [submitted, setSubmitted] = createSignal<string | null>(null);

  const submit = (event: Event) => {
    event.preventDefault();
    const value = prompt().trim();
    if (!value) return;
    setSubmitted(value);
  };

  return (
    <section id="agent" class="h-full rounded-200 border border-line bg-surface-1 overflow-hidden scroll-mt-28">
      <div class="relative px-250 pt-250 pb-200 border-b border-line overflow-hidden">
        <div class="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-official-bg opacity-70" />
        <div class="relative flex items-start justify-between gap-150">
          <div class="flex items-center gap-150">
            <span class="grid place-items-center w-10 h-10 rounded-100 bg-secondary text-on-secondary"><BrainCircuit size={20} /></span>
            <div>
              <h2 class="text-200 font-700">Investing OS Agent</h2>
              <p class="mt-[2px] text-75 text-muted">Research copilot preview</p>
            </div>
          </div>
          <span class="inline-flex items-center gap-50 px-100 py-[3px] rounded-10 bg-reminder-bg text-reminder text-50 font-700 uppercase tracking-[.04em]">
            <Database size={11} /> Mock
          </span>
        </div>
        <p class="relative mt-200 text-100 text-muted">
          Ask across saved theses, market context, catalysts, and trading history.
        </p>
      </div>

      <div class="p-200">
        <Show
          when={submitted()}
          fallback={
            <div class="space-y-100">
              <p class="text-50 font-700 uppercase tracking-[.08em] text-caption">Try asking</p>
              <For each={props.suggestions}>
                {suggestion => (
                  <button
                    type="button"
                    onClick={() => setPrompt(suggestion.prompt)}
                    class="w-full px-150 py-150 flex items-center gap-100 rounded-100 border border-line bg-bg-1 text-left hover:border-hairline transition-colors cursor-pointer"
                  >
                    <Sparkles size={14} class="shrink-0 text-accent" />
                    <span class="min-w-0 flex-1 text-75 font-600 text-ink">{suggestion.label}</span>
                    <ChevronRight size={14} class="text-caption" />
                  </button>
                )}
              </For>
            </div>
          }
        >
          <div class="rounded-100 border border-line bg-bg-1 p-150">
            <div class="flex items-center justify-between gap-100">
              <span class="text-50 font-700 uppercase tracking-[.08em] text-accent">Preview queued</span>
              <button type="button" onClick={() => setSubmitted(null)} class="text-caption hover:text-ink cursor-pointer" aria-label="Dismiss preview"><X size={14} /></button>
            </div>
            <p class="mt-100 text-75 font-600 text-ink">{submitted()}</p>
            <p class="mt-100 text-75 text-muted">The interface is wired. A live agent adapter can replace this mock response state later.</p>
          </div>
        </Show>

        <form onSubmit={submit} class="mt-200 rounded-200 border border-line bg-surface-2 p-100 focus-within:border-accent transition-colors">
          <label for="agent-prompt" class="sr-only">Ask Investing OS</label>
          <textarea
            id="agent-prompt"
            value={prompt()}
            onInput={event => setPrompt(event.currentTarget.value)}
            rows="3"
            placeholder="Ask about a setup, catalyst, or risk..."
            class="block w-full resize-none bg-transparent px-100 py-100 text-100 text-ink placeholder:text-caption outline-none"
          />
          <div class="flex items-center justify-between gap-100">
            <span class="px-100 text-50 text-caption">Uses dashboard mock context</span>
            <button type="submit" class="grid place-items-center w-8 h-8 rounded-100 bg-accent-fill text-on-accent hover:bg-accent-fill-hover transition-colors cursor-pointer" aria-label="Send prompt">
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const SETUP_FILTERS: Array<"all" | SetupStatus> = ["all", "watching", "ready", "active", "won", "lost"];

function statusClasses(status: SetupStatus): string {
  if (status === "won") return "bg-pos-bg text-pos";
  if (status === "lost") return "bg-neg-bg text-neg";
  if (status === "active") return "bg-official-bg text-official";
  if (status === "ready") return "bg-reminder-bg text-reminder";
  return "bg-noaccess-bg text-noaccess";
}

export function AlphaBoard(props: { setups: InvestmentSetup[] }) {
  const [filter, setFilter] = createSignal<(typeof SETUP_FILTERS)[number]>("all");
  const visible = createMemo(() => filter() === "all" ? props.setups : props.setups.filter(setup => setup.status === filter()));

  return (
    <section id="setups" class="rounded-200 border border-line bg-surface-1 overflow-hidden scroll-mt-28">
      <div class="px-200 md:px-250 pt-200 md:pt-250 pb-150 border-b border-line">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-150">
          <div>
            <div class="flex items-center gap-100">
              <Target size={17} class="text-accent" />
              <h2 class="text-300 font-700 tracking-[-.01em]">Alpha board</h2>
              <span class="px-100 py-[2px] rounded-10 bg-surface-2 text-caption text-50 font-700">{props.setups.length} setups</span>
            </div>
            <p class="mt-50 text-75 text-muted">Saved theses, entry logic, and outcome tracking in one queue.</p>
          </div>
          <button type="button" class="self-start inline-flex items-center gap-100 text-75 font-700 text-accent hover:text-link cursor-pointer">
            Open workspace <ArrowRight size={14} />
          </button>
        </div>
        <div class="mt-200 flex items-center gap-50 overflow-x-auto pb-50" role="tablist" aria-label="Filter setups">
          <For each={SETUP_FILTERS}>
            {item => (
              <button
                type="button"
                role="tab"
                aria-selected={filter() === item}
                onClick={() => setFilter(item)}
                class="shrink-0 h-8 px-150 rounded-100 text-75 font-600 capitalize border transition-colors cursor-pointer"
                classList={{
                  "bg-official-bg text-accent border-transparent": filter() === item,
                  "bg-surface-2 text-muted border-line hover:text-ink": filter() !== item,
                }}
              >
                {item}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="hidden lg:grid grid-cols-[minmax(230px,1.6fr)_90px_90px_110px_105px_90px] gap-150 px-250 py-100 border-b border-line text-50 font-700 uppercase tracking-[.05em] text-caption">
        <span>Setup</span><span>Score</span><span>Entry</span><span>Invalidation</span><span>Target</span><span>R / R</span>
      </div>
      <div class="divide-y divide-line">
        <For each={visible()} fallback={<p class="px-250 py-500 text-75 text-muted text-center">No setups match this filter.</p>}>
          {setup => (
            <article class="px-200 md:px-250 py-200 hover:bg-surface-2 transition-colors">
              <div class="lg:grid lg:grid-cols-[minmax(230px,1.6fr)_90px_90px_110px_105px_90px] lg:gap-150 lg:items-center">
                <div class="min-w-0">
                  <div class="flex items-center gap-100">
                    <span class="grid place-items-center w-8 h-8 rounded-full bg-surface-2 border border-line text-50 font-900 text-ink">{setup.symbol.slice(0, 2)}</span>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-100">
                        <span class="text-100 font-700">{setup.symbol}</span>
                        <span class={`px-100 py-[2px] rounded-10 text-50 font-700 uppercase tracking-[.03em] ${statusClasses(setup.status)}`}>{setup.status}</span>
                        <span class="text-50 font-700 uppercase" classList={{ "text-pos": setup.direction === "long", "text-neg": setup.direction === "short" }}>{setup.direction}</span>
                      </div>
                      <p class="mt-50 text-75 text-muted truncate" title={setup.thesis}>{setup.thesis}</p>
                    </div>
                  </div>
                </div>
                <div class="mt-150 lg:mt-0 flex items-center gap-100">
                  <div class="w-10 h-1.5 rounded-full bg-surface-2 overflow-hidden"><span class="block h-full rounded-full bg-accent-fill" style={{ width: `${setup.score}%` }} /></div>
                  <span class="text-75 font-700 tabular-nums">{setup.score}</span>
                </div>
                <dl class="mt-150 lg:mt-0 grid grid-cols-2 sm:grid-cols-4 lg:contents gap-150 tabular-nums">
                  <div><dt class="lg:hidden text-50 text-caption">Entry</dt><dd class="mt-50 lg:mt-0 text-75 font-600">{setup.entry}</dd></div>
                  <div><dt class="lg:hidden text-50 text-caption">Invalidation</dt><dd class="mt-50 lg:mt-0 text-75 font-600 text-neg">{setup.invalidation}</dd></div>
                  <div><dt class="lg:hidden text-50 text-caption">Target</dt><dd class="mt-50 lg:mt-0 text-75 font-600 text-pos">{setup.target}</dd></div>
                  <div><dt class="lg:hidden text-50 text-caption">R / R</dt><dd class="mt-50 lg:mt-0 text-75 font-700">{setup.riskReward}</dd></div>
                </dl>
              </div>
              <div class="mt-150 lg:pl-10 flex flex-wrap items-center gap-x-200 gap-y-50 text-50 text-caption">
                <span class="inline-flex items-center gap-50"><CalendarClock size={11} />{setup.catalyst}</span>
                <span>Updated {setup.updated}</span>
              </div>
            </article>
          )}
        </For>
      </div>
    </section>
  );
}

const SIGNAL_FILTERS = ["all", "macro", "flow", "technical", "on-chain"] as const;

function impactClasses(impact: SignalEvent["impact"]): string {
  if (impact === "bullish") return "bg-pos-bg text-pos";
  if (impact === "bearish") return "bg-neg-bg text-neg";
  return "bg-reminder-bg text-reminder";
}

export function SignalRadar(props: { signals: SignalEvent[] }) {
  const [filter, setFilter] = createSignal<(typeof SIGNAL_FILTERS)[number]>("all");
  const visible = createMemo(() => filter() === "all" ? props.signals : props.signals.filter(signal => signal.category === filter()));

  return (
    <section id="signals" class="h-full rounded-200 border border-line bg-surface-1 overflow-hidden scroll-mt-28">
      <div class="px-200 md:px-250 pt-200 md:pt-250 pb-150 border-b border-line">
        <div class="flex items-start justify-between gap-150">
          <div>
            <div class="flex items-center gap-100">
              <Radio size={17} class="text-accent" />
              <h2 class="text-300 font-700 tracking-[-.01em]">Signal radar</h2>
            </div>
            <p class="mt-50 text-75 text-muted">Only events tied to a decision make the cut.</p>
          </div>
          <span class="inline-flex items-center gap-50 px-100 py-[3px] rounded-10 bg-neg-bg text-neg text-50 font-700">
            <CircleDot size={10} /> 2 urgent
          </span>
        </div>
        <div class="mt-200 flex items-center gap-50 overflow-x-auto" role="tablist" aria-label="Filter signals">
          <For each={SIGNAL_FILTERS}>
            {item => (
              <button
                type="button"
                role="tab"
                aria-selected={filter() === item}
                onClick={() => setFilter(item)}
                class="shrink-0 h-7 px-100 rounded-50 text-50 font-700 capitalize transition-colors cursor-pointer"
                classList={{ "bg-secondary text-on-secondary": filter() === item, "text-muted hover:bg-surface-2 hover:text-ink": filter() !== item }}
              >
                {item}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="divide-y divide-line">
        <For each={visible()} fallback={<p class="px-250 py-500 text-75 text-muted text-center">No signals match this filter.</p>}>
          {signal => (
            <article class="p-200 md:p-250 hover:bg-surface-2 transition-colors">
              <div class="flex items-start gap-150">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-100">
                    <span class={`px-100 py-[2px] rounded-10 text-50 font-700 uppercase tracking-[.04em] ${impactClasses(signal.impact)}`}>{signal.impact}</span>
                    <span class="text-50 font-700 uppercase tracking-[.04em] text-caption">{signal.category}</span>
                    <span class="text-50 text-caption">{signal.publishedAt}</span>
                  </div>
                  <h3 class="mt-100 text-100 font-700 leading-[140%]">{signal.headline}</h3>
                  <p class="mt-100 text-75 leading-[150%] text-muted">{signal.whyItMatters}</p>
                </div>
                <button type="button" class="shrink-0 grid place-items-center w-8 h-8 rounded-100 text-caption hover:text-ink hover:bg-bg-1 cursor-pointer" aria-label={`Open ${signal.headline}`}><ExternalLink size={14} /></button>
              </div>
              <div class="mt-150 flex flex-wrap items-center gap-100">
                <For each={signal.symbols}>{symbol => <span class="px-100 py-[2px] rounded-10 bg-surface-2 text-50 font-700 text-ink">{symbol}</span>}</For>
                <span class="ml-auto inline-flex items-center gap-50 text-50 text-caption"><ShieldCheck size={11} />{signal.confidence}% confidence</span>
              </div>
              <div class="mt-150 pt-150 border-t border-line flex items-center justify-between gap-150 text-50 text-caption">
                <span>{signal.sourceType}</span>
                <span class="font-600 text-muted">Relevance {signal.relevance} · {signal.horizon}</span>
              </div>
            </article>
          )}
        </For>
      </div>
    </section>
  );
}

export function MobileDock() {
  const items = [
    { label: "Home", href: "#overview", icon: Gauge },
    { label: "Setups", href: "#setups", icon: Target },
    { label: "Agent", href: "#agent", icon: Bot },
    { label: "Signals", href: "#signals", icon: Radio },
  ];
  return (
    <nav class="md:hidden fixed z-40 left-200 right-200 bottom-200 h-14 px-100 grid grid-cols-4 rounded-300 border border-line bg-bg-2/95 backdrop-blur-xl shadow-overlay" aria-label="Mobile navigation">
      <For each={items}>
        {item => (
          <a href={item.href} class="flex flex-col items-center justify-center gap-[2px] text-caption hover:text-accent transition-colors">
            <item.icon size={17} />
            <span class="text-50 font-700">{item.label}</span>
          </a>
        )}
      </For>
    </nav>
  );
}
