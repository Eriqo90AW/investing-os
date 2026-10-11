import { Title, Meta } from "@solidjs/meta";
import { For, Show, createMemo, createSignal, type JSX } from "solid-js";
import { ArrowRight, BarChart3, CalendarDays, Plus, RotateCcw, Settings2, Sparkles, Trash2 } from "lucide-solid";
import { AppNavbar } from "~/components/navigation/AppNavbar";
import { MarketPulseStrip } from "~/components/navigation/MarketPulseStrip";
import { Modal } from "~/components/ui/Modal";
import { DividendFlowGraph, flowMoney as money, flowPercent, flowDate } from "~/components/dividends/DividendFlowGraph";
import { buildDividendFlow } from "~/lib/dividends/flow";
import { dashboardData } from "~/lib/dashboard-data";
import { initAccent } from "~/lib/accent";
import { initPalette } from "~/lib/palette";
import { initTheme } from "~/lib/theme";
import { SCENARIOS } from "~/lib/dividends/assumptions";
import { validateEvent } from "~/lib/dividends/events";
import { createCalendar, TRADING_RULES_SOURCE, CALENDAR_SOURCE } from "~/lib/dividends/calendar";
import { searchChains } from "~/lib/dividends/search";
import { simulateChain } from "~/lib/dividends/simulation";
import { deleteDividendEvent, dividendStore, dividendWorkspace, initDividendStore, resetDividendDemo, saveDividendEvent, setDividendMode, setSelectedChain, updateDividendWorkspace } from "~/lib/dividends/store";
import type { ChainTrade, DividendEvent, PlannerInputs, ScenarioName, Strategy } from "~/lib/dividends/types";

initTheme(); initPalette(); initAccent(); initDividendStore();
const SCENARIO_LABEL: Record<ScenarioName, string> = { downside: "Downside", base: "Base", upside: "Upside" };
const field = "h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-75 text-ink outline-none focus:border-accent";
const panel = "rounded-200 border border-line bg-surface-1";
const button = "cursor-pointer inline-flex h-9 items-center justify-center gap-100 rounded-100 border border-line px-150 text-75 font-600 text-accent hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed";

export default function DividendsPage() {
  const [strategy, setStrategy] = createSignal<Strategy>("recovery");
  const [scenario, setScenario] = createSignal<ScenarioName>("base");
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [eventsOpen, setEventsOpen] = createSignal(false);
  const [infoOpen, setInfoOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<DividendEvent | null>(null);
  const [modalOpen, setModalOpen] = createSignal(false);
  const [tradeIndex, setTradeIndex] = createSignal<number | null>(null);
  const [tradeDraft, setTradeDraft] = createSignal<ChainTrade | null>(null);
  const [error, setError] = createSignal("");
  const [calendarYear, setCalendarYear] = createSignal(2027);
  const [holidayText, setHolidayText] = createSignal("");
  const [calendarSource, setCalendarSource] = createSignal("");
  const workspace = dividendWorkspace;
  const inputs = () => workspace().inputs;
  const events = () => workspace().events;
  const tickers = createMemo(() => [...new Set(events().map(event => event.ticker))].filter(Boolean).sort());
  const suggestionState = createMemo(() => {
    try { return { suggestions: searchChains(events(), inputs(), strategy()), error: "" }; }
    catch (cause) { return { suggestions: [], error: cause instanceof Error ? cause.message : "Check settings and calendar coverage." }; }
  });
  const selectedChain = (): ChainTrade[] => workspace().selected[strategy()] ?? suggestionState().suggestions[0]?.chain ?? [];
  const simulationState = createMemo(() => {
    try {
      const result = simulateChain({ chain: selectedChain(), events: events(), inputs: inputs(), strategy: strategy(), scenario: scenario() });
      return { result, flow: buildDividendFlow(result, inputs(), selectedChain(), events()), error: "" };
    } catch (cause) { return { result: null, flow: null, error: cause instanceof Error ? cause.message : "Check settings to calculate." }; }
  });
  const graphError = () => simulationState().error;
  const result = () => simulationState().result;
  const availableEvents = () => events().filter(event => !event.excluded && !selectedChain().some(item => item.eventId === event.id));
  const updateInputs = (patch: Partial<PlannerInputs>) => { setError(""); updateDividendWorkspace({ inputs: { ...inputs(), ...patch } }); };
  const updateScenario = (name: ScenarioName, patch: Partial<PlannerInputs["scenarios"][ScenarioName]>) => updateInputs({ scenarios: { ...inputs().scenarios, [name]: { ...inputs().scenarios[name], ...patch } } });
  const updateOverride = (ticker: string, name: ScenarioName, patch: { dropMultiple?: number; recoverySessions?: number | null }) => {
    const current = inputs().scenarios[name]; const prior = current.overrides[ticker] ?? { dropMultiple: current.dropMultiple, recoverySessions: current.recoverySessions };
    updateScenario(name, { overrides: { ...current.overrides, [ticker]: { ...prior, ...patch } } });
  };
  const clearOverride = (ticker: string, name: ScenarioName) => { const current = inputs().scenarios[name]; const overrides = { ...current.overrides }; delete overrides[ticker]; updateScenario(name, { overrides }); };
  const useSuggestion = () => { setSelectedChain(strategy(), suggestionState().suggestions[0]?.chain ?? []); setError(""); };
  const openTrade = (index: number) => {
    const item = selectedChain()[index];
    if (!item) return;
    setTradeIndex(index); setTradeDraft({ ...item }); setError("");
  };
  const addTrade = () => {
    const event = availableEvents()[0];
    if (!event) { setEventsOpen(false); startEvent(); return; }
    setTradeIndex(-1); setTradeDraft({ eventId: event.id, purchaseDate: event.cumDate }); setError("");
  };
  const closeTrade = () => { setTradeDraft(null); setTradeIndex(null); };
  const saveTrade = () => {
    const draft = tradeDraft(); const index = tradeIndex();
    if (!draft || index === null) return;
    const next = [...selectedChain()];
    if (index === -1) next.push({ ...draft }); else next[index] = { ...draft };
    setSelectedChain(strategy(), next); closeTrade();
  };
  const removeTrade = () => {
    const index = tradeIndex();
    if (index !== null && index >= 0) setSelectedChain(strategy(), selectedChain().filter((_, i) => i !== index));
    closeTrade();
  };
  const tradePreview = createMemo(() => {
    const draft = tradeDraft(); const index = tradeIndex();
    if (!draft || index === null) return null;
    const previewChain = [...selectedChain()];
    if (index === -1) previewChain.push(draft); else previewChain[index] = draft;
    try {
      const previewResult = simulateChain({ chain: previewChain, events: events(), inputs: inputs(), strategy: strategy(), scenario: scenario() });
      return buildDividendFlow(previewResult, inputs(), previewChain, events()).trades.find(item => item.selectionIndex === (index === -1 ? previewChain.length - 1 : index)) ?? null;
    } catch { return null; }
  });
  const previewReason = () => { const item = tradePreview(); return item?.status === "skipped" ? item.trade.reason : ""; };
  const startEvent = (event?: DividendEvent) => { setEventsOpen(false); setEditing(event ?? blankEvent()); setError(""); setModalOpen(true); };
  const saveEvent = () => {
    const event = editing(); if (!event) return;
    try { const calendar = createCalendar(inputs().calendars); const message = validateEvent(event, calendar); if (message) { setError(message); return; } saveDividendEvent(event); setModalOpen(false); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this event."); }
  };
  const addCalendar = () => {
    try {
      const holidays = holidayText().split(/[\s,;]+/).map(value => value.trim()).filter(Boolean);
      if (!calendarSource().trim()) throw new Error("Add a source note for this exchange calendar.");
      createCalendar([...inputs().calendars, { year: calendarYear(), holidays, source: calendarSource().trim() }]);
      updateInputs({ calendars: [...inputs().calendars, { year: calendarYear(), holidays, source: calendarSource().trim() }] });
      setHolidayText(""); setCalendarSource(""); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Calendar could not be added."); }
  };

  return <>
    <Title>Investing OS | Dividend flow</Title>
    <Meta name="description" content="A timeline of projected dividend trades, cash payments, and reinvestment." />
    <AppNavbar />
    <MarketPulseStrip markets={dashboardData.markets} />
    <main class="mx-auto max-w-[1440px] px-200 pb-900 pt-300">
      <header class="flex flex-wrap items-center justify-between gap-150">
        <div class="flex items-center gap-150"><h1 class="text-600 font-700 tracking-[-.025em]">Dividends</h1><button type="button" class="cursor-pointer rounded-full border border-line bg-surface-2 px-100 py-50 text-50 text-accent" onClick={() => setInfoOpen(true)}>{dividendStore().mode === "demo" ? "Demo" : "Manual"} · Projection</button></div>
        <div class="flex flex-wrap gap-100"><button type="button" class={button} onClick={() => setEventsOpen(true)}><CalendarDays size={14} /> Manage events</button><button type="button" class={button} onClick={() => setSettingsOpen(true)}><Settings2 size={14} /> Settings</button></div>
      </header>
      <section class={`${panel} mt-200 overflow-hidden`} aria-label="Dividend chain planner">
        <div class="grid grid-cols-2 items-end gap-100 border-b border-line bg-surface-2 px-200 py-150 lg:flex lg:flex-wrap lg:gap-150">
          <Field label="Workspace"><select class={`cursor-pointer ${field} min-w-[120px]`} value={dividendStore().mode} onChange={event => setDividendMode(event.currentTarget.value as "demo" | "manual")}><option value="demo">Demo data</option><option value="manual">Manual</option></select></Field>
          <div class="min-w-0 lg:w-[160px]"><Field label="Starting capital · IDR"><input class={field} type="number" min="1" value={inputs().capital ?? ""} placeholder="Enter capital" onInput={event => updateInputs({ capital: event.currentTarget.value === "" ? null : event.currentTarget.valueAsNumber })} /></Field></div>
          <div class="min-w-0 lg:w-[150px]"><Field label="From"><input class={field} type="date" value={inputs().startDate} onInput={event => updateInputs({ startDate: event.currentTarget.value })} /></Field></div>
          <div class="min-w-0 lg:w-[150px]"><Field label="To"><input class={field} type="date" value={inputs().endDate} onInput={event => updateInputs({ endDate: event.currentTarget.value })} /></Field></div>
          <div class="min-w-0 lg:min-w-[180px] lg:flex-1"><Field label="Exit strategy"><select class={`${field} cursor-pointer`} value={strategy()} onChange={event => setStrategy(event.currentTarget.value as Strategy)}><option value="recovery">Wait for recovery</option><option value="ex-date">Sell on ex-date</option></select></Field></div>
          <div class="min-w-0 lg:w-[130px]"><Field label="Scenario"><select class={`${field} cursor-pointer`} value={scenario()} onChange={event => setScenario(event.currentTarget.value as ScenarioName)}><For each={SCENARIOS}>{name => <option value={name} selected={name === scenario()}>{SCENARIO_LABEL[name]}</option>}</For></select></Field></div>
        </div>
        <dl class="grid grid-cols-3 gap-100 border-b border-line px-200 py-150">
          <Summary label="Projected profit" value={result() ? money(result()!.netProfit) : "—"} tone={result()?.netProfit} />
          <Summary label="Return on capital" value={result() ? flowPercent(result()!.returnOnCapital) : "—"} tone={result()?.returnOnCapital} />
          <Summary label="Ending wealth" value={result() ? money(result()!.endingWealth) : "—"} />
        </dl>
        <div class="flex flex-wrap items-center justify-between gap-150 px-200 py-150">
          <div class="flex items-center gap-100"><BarChart3 size={15} class="text-accent" /><h2 class="text-100 font-700">Your dividend chain</h2><span class="text-50 text-muted">{selectedChain().length} trades</span></div>
          <div class="flex gap-100"><button type="button" class={button} onClick={useSuggestion} disabled={!!suggestionState().error || suggestionState().suggestions.length === 0} title="Use the best chain ranked by base-case ending wealth"><Sparkles size={13} /> Use suggestion</button><button type="button" class={`${button} bg-accent-fill text-on-accent`} onClick={addTrade}><Plus size={13} /> Add trade</button></div>
        </div>
        <Show when={!graphError()} fallback={<div class="flex min-h-[330px] flex-col items-center justify-center gap-150 px-250 text-center"><Settings2 size={24} class="text-accent" /><p class="text-100 font-600">Complete your planning settings</p><p class="max-w-[50ch] text-75 text-muted" role="status">{graphError()}</p><button type="button" class={button} onClick={() => setSettingsOpen(true)}>Open settings <ArrowRight size={14} /></button></div>}>
          <Show when={simulationState().flow?.trades.length} fallback={<div class="flex min-h-[330px] flex-col items-center justify-center gap-150 px-250 text-center"><BarChart3 size={28} class="text-accent" /><p class="text-200 font-600">Start your dividend chain</p><p class="max-w-[48ch] text-75 text-muted">{events().length ? "This chain stays in cash. Add a trade to explore a stock sequence." : "Add a dividend event, then connect your first trade."}</p><button type="button" class={button} onClick={addTrade}><Plus size={14} />{events().length ? "Add trade" : "Add dividend event"}</button></div>}>
            <DividendFlowGraph flow={simulationState().flow!} onSelect={openTrade} />
          </Show>
        </Show>
        <footer class="flex flex-wrap items-center justify-between gap-100 border-t border-line px-200 py-100 text-50 text-muted"><span>Click a node to edit · Scroll to follow the chain</span><span>Solid = holding / reinvestment · Dashed = dividend / settlement</span></footer>
      </section>
      <Show when={error() && !settingsOpen() && !modalOpen()}><p class="mt-150 text-75 text-neg" role="alert">{error()}</p></Show>
    </main>
    <Modal open={settingsOpen()} title="Planning settings" width="1040px" contentClass="p-200" onClose={() => setSettingsOpen(false)}>
      <Show when={graphError()}><p class="mb-150 text-75 text-muted" role="status">{graphError()}</p></Show>
      <Show when={error()}><p class="mb-150 text-75 text-neg" role="alert">{error()}</p></Show>
      <section class={`${panel} p-200 md:p-250`} aria-label="Planning assumptions">
        <div class="flex items-center justify-between gap-150"><div><h2 class="text-200 font-700">Capital and costs</h2><p class="mt-50 text-50 text-muted">Percentages are entered in percent units. Sell fee is all-inclusive.</p></div><a href={TRADING_RULES_SOURCE} target="_blank" rel="noreferrer" class="cursor-pointer text-50 text-accent">IDX trading rules</a></div>
        <div class="mt-200 grid gap-150 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Starting capital (IDR)"><input class={field} type="number" min="1" value={inputs().capital ?? ""} placeholder="Required" onInput={event => updateInputs({ capital: event.currentTarget.value === "" ? null : event.currentTarget.valueAsNumber })} /></Field>
          <Field label="Planning start"><input class={field} type="date" value={inputs().startDate} onInput={event => updateInputs({ startDate: event.currentTarget.value })} /></Field>
          <Field label="Planning end"><input class={field} type="date" value={inputs().endDate} onInput={event => updateInputs({ endDate: event.currentTarget.value })} /></Field>
          <Field label="Maximum holding (sessions)"><input class={field} type="number" min="1" step="1" value={inputs().maxHoldingSessions} onInput={event => updateInputs({ maxHoldingSessions: event.currentTarget.valueAsNumber })} /></Field>
          <PercentField label="Buy fee" value={inputs().buyFee} onChange={value => updateInputs({ buyFee: value })} />
          <PercentField label="All-inclusive sell fee" value={inputs().sellFee} onChange={value => updateInputs({ sellFee: value })} />
          <PercentField label="Slippage per execution" value={inputs().slippage} onChange={value => updateInputs({ slippage: value })} />
          <PercentField label="Dividend tax assumption" value={inputs().dividendTax} onChange={value => updateInputs({ dividendTax: value })} />
        </div>
        <div class="mt-150 rounded-100 bg-surface-2 px-150 py-100 text-50 text-muted"><CalendarDays size={12} class="mr-50 inline" />Sourced 2026 calendar from <a class="cursor-pointer text-accent underline" href={CALENDAR_SOURCE} target="_blank" rel="noreferrer">KSEI</a>. Calculations stop when a required year has no calendar. Calendar includes weekends and the listed exchange holidays.</div>
        <details class="mt-150 rounded-100 border border-line px-150 py-100"><summary class="cursor-pointer text-75 font-700">Add a holiday calendar for another year</summary><div class="mt-150 grid gap-100 md:grid-cols-4"><input class={field} type="number" aria-label="Calendar year" value={calendarYear()} onInput={event => setCalendarYear(event.currentTarget.valueAsNumber)} /><input class={field} value={holidayText()} onInput={event => setHolidayText(event.currentTarget.value)} placeholder="Holidays: YYYY-MM-DD, ..." aria-label="Holiday dates" /><input class={field} value={calendarSource()} onInput={event => setCalendarSource(event.currentTarget.value)} placeholder="Source or notes" aria-label="Calendar source" /><button type="button" onClick={addCalendar} class="cursor-pointer h-10 rounded-100 bg-accent-fill px-150 text-75 font-700 text-on-accent">Add calendar</button></div></details>
      </section>

      <section class="mt-200 rounded-200 border border-line bg-surface-1 p-200 md:p-250" aria-label="Scenario assumptions">
        <div><h2 class="text-200 font-700">Price scenarios</h2><p class="mt-50 text-50 text-muted">Price drop is a multiple of the dividend per share. Recovery is linear by exchange session after ex-date. Blank recovery means no recovery.</p></div>
        <div class="mt-150 grid gap-100 md:grid-cols-3"><For each={SCENARIOS}>{name => { const value = () => inputs().scenarios[name]; return <div class="rounded-100 border border-line bg-surface-2 p-150"><h3 class="text-75 font-700">{SCENARIO_LABEL[name]}</h3><div class="mt-100 grid gap-100"><Field label="Ex-date drop (dividend multiples)"><input class={field} type="number" min="0" step="0.05" value={value().dropMultiple} onInput={event => updateScenario(name, { dropMultiple: event.currentTarget.valueAsNumber })} /></Field><Field label="Recovery sessions, blank for none"><input class={field} type="number" min="0" step="1" value={value().recoverySessions ?? ""} placeholder="No recovery" onInput={event => updateScenario(name, { recoverySessions: event.currentTarget.value === "" ? null : event.currentTarget.valueAsNumber })} /></Field></div></div>; }}</For></div>
        <details class="mt-150 rounded-100 border border-line px-150 py-100"><summary class="cursor-pointer text-75 font-700">Per-stock scenario overrides</summary><div class="mt-100 overflow-x-auto"><table class="min-w-[900px] w-full text-left text-50"><thead class="text-muted"><tr><th class="py-75">Ticker</th><For each={SCENARIOS}>{name => <th>{SCENARIO_LABEL[name]} drop / recovery sessions</th>}</For></tr></thead><tbody class="divide-y divide-line"><For each={tickers()}>{ticker => <tr><td class="py-100 font-700">{ticker}</td><For each={SCENARIOS}>{name => { const scenario = () => inputs().scenarios[name]; const override = () => scenario().overrides[ticker]; return <td class="py-100"><div class="flex items-center gap-50"><input aria-label={`${ticker} ${name} dividend drop multiple`} class={`${field} w-20 px-50`} type="number" min="0" step="0.05" value={override()?.dropMultiple ?? scenario().dropMultiple} onInput={event => updateOverride(ticker, name, { dropMultiple: event.currentTarget.value === "" ? scenario().dropMultiple : event.currentTarget.valueAsNumber })} /><input aria-label={`${ticker} ${name} recovery sessions`} class={`${field} w-20 px-50`} type="number" min="0" step="1" value={override() ? (override()!.recoverySessions ?? "") : (scenario().recoverySessions ?? "")} placeholder="No recovery" onInput={event => updateOverride(ticker, name, { recoverySessions: event.currentTarget.value === "" ? null : event.currentTarget.valueAsNumber })} /><Show when={override()}><button type="button" onClick={() => clearOverride(ticker, name)} aria-label={`Reset ${ticker} ${name} override`} class="cursor-pointer px-50 text-accent">Reset</button></Show></div></td>; }}</For></tr>}</For></tbody></table></div><p class="mt-100 text-50 text-muted">Drop inputs start at each scenario default. A blank recovery field means no recovery. Reset removes the override.</p></details>
      </section>
    </Modal>
    <Modal open={eventsOpen()} title="Dividend events" width="1280px" contentClass="p-200" onClose={() => setEventsOpen(false)}>
      <Show when={dividendStore().mode === "demo"}><div class="mb-150 flex justify-end"><button type="button" class={button} onClick={resetDividendDemo}><RotateCcw size={14} /> Reset demo</button></div></Show>
      <section class={`${panel} overflow-hidden`}>
        <div class="flex flex-wrap items-center justify-between gap-150 border-b border-line px-200 py-200 md:px-250"><div><h2 class="text-200 font-700">Dividend calendar</h2><p class="mt-50 text-50 text-muted">Cum-date is the last regular-market session to buy for the dividend. Ex-date is the first session trading without it. Payment date is when the receivable is paid.</p></div><button type="button" onClick={() => startEvent()} class="cursor-pointer inline-flex h-9 items-center gap-100 rounded-100 bg-accent-fill px-150 text-75 font-700 text-on-accent"><Plus size={14} /> Add event</button></div>
        <div class="overflow-x-auto"><table class="min-w-[1120px] w-full text-left text-50"><thead class="bg-surface-2 text-muted"><tr>{["Ticker / source", "Dividend/share", "Cum-date", "Ex-date", "Recording", "Payment", "Assumed buy price", "Status", ""].map(label => <th class="px-150 py-100 font-700">{label}</th>)}</tr></thead><tbody class="divide-y divide-line"><For each={events()} fallback={<tr><td colSpan={9} class="px-200 py-300 text-center text-muted">No events in this workspace. Add a manual dividend event to begin.</td></tr>}>{event => <tr classList={{ "opacity-50": event.excluded }}><td class="px-150 py-150"><button type="button" onClick={() => startEvent(event)} class="cursor-pointer font-700 text-accent underline decoration-dotted">{event.ticker}</button><div class="mt-50 max-w-56 truncate text-muted" title={event.sourceNotes}>{event.sourceNotes || (event.provenance === "demo" ? "Invented demo data" : "Manual input")}</div></td><td class="px-150">{money(event.dividendPerShare)}</td><td class="px-150">{event.cumDate}</td><td class="px-150">{event.exDate}</td><td class="px-150">{event.recordingDate}</td><td class="px-150">{event.paymentDate}</td><td class="px-150">{money(event.purchasePrice)} <span class="text-muted">assumed</span></td><td class="px-150">{event.excluded ? "Excluded" : event.provenance === "demo" ? "Demo" : "Included"}</td><td class="px-150"><div class="flex gap-100"><button type="button" onClick={() => saveDividendEvent({ ...event, excluded: !event.excluded })} class="cursor-pointer text-accent">{event.excluded ? "Include" : "Exclude"}</button><button type="button" onClick={() => deleteDividendEvent(event.id)} aria-label={`Delete ${event.ticker}`} class="cursor-pointer text-neg"><Trash2 size={14} /></button></div></td></tr>}</For></tbody></table></div>
      </section>

    </Modal>
    <Modal open={modalOpen()} title={editing()?.id.startsWith("demo-") ? "Edit demo event" : "Dividend event"} onClose={() => setModalOpen(false)} footer={<div class="flex justify-end gap-100"><button type="button" onClick={() => setModalOpen(false)} class="cursor-pointer h-9 rounded-100 border border-line px-150 text-75 font-700">Cancel</button><button type="button" onClick={saveEvent} class="cursor-pointer h-9 rounded-100 bg-accent-fill px-200 text-75 font-700 text-on-accent">Save event</button></div>}>
      <Show when={editing()}>{draft => <div class="grid gap-150 p-250 sm:grid-cols-2"><EventField label="Ticker"><input class={field} value={draft().ticker} onInput={event => setEditing({ ...draft(), ticker: event.currentTarget.value.toUpperCase() })} /></EventField><EventField label="Dividend per share (IDR)"><input class={field} type="number" min="0" value={draft().dividendPerShare} onInput={event => setEditing({ ...draft(), dividendPerShare: event.currentTarget.valueAsNumber })} /></EventField><EventField label="Regular-market cum-date"><input class={field} type="date" value={draft().cumDate} onInput={event => setEditing({ ...draft(), cumDate: event.currentTarget.value })} /></EventField><EventField label="Ex-date"><input class={field} type="date" value={draft().exDate} onInput={event => setEditing({ ...draft(), exDate: event.currentTarget.value })} /></EventField><EventField label="Recording date"><input class={field} type="date" value={draft().recordingDate} onInput={event => setEditing({ ...draft(), recordingDate: event.currentTarget.value })} /></EventField><EventField label="Payment date"><input class={field} type="date" value={draft().paymentDate} onInput={event => setEditing({ ...draft(), paymentDate: event.currentTarget.value })} /></EventField><EventField label="Assumed purchase price (IDR)"><input class={field} type="number" min="1" value={draft().purchasePrice} onInput={event => setEditing({ ...draft(), purchasePrice: event.currentTarget.valueAsNumber })} /></EventField><EventField label="Source notes"><input class={field} value={draft().sourceNotes} onInput={event => setEditing({ ...draft(), sourceNotes: event.currentTarget.value })} /></EventField><Show when={error()}><p class="sm:col-span-2 text-75 text-neg" role="alert">{error()}</p></Show></div>}</Show>
    </Modal>

    <Modal open={!!tradeDraft()} title={tradeIndex() === -1 ? "Add trade" : "Trade details"} onClose={closeTrade} footer={<div class="flex items-center justify-between gap-100"><Show when={tradeIndex() !== -1}><button type="button" class={button} onClick={removeTrade}><Trash2 size={14} /> Remove trade</button></Show><div class="ml-auto flex gap-100"><button type="button" class={button} onClick={closeTrade}>Cancel</button><button type="button" class={`${button} bg-accent-fill text-on-accent`} onClick={saveTrade} disabled={!tradeDraft()?.eventId}>Save trade</button></div></div>}>
      <Show when={tradeDraft()}>{draft => <div class="p-250">
        <div class="grid gap-150 sm:grid-cols-2"><Field label="Dividend event"><select class={`${field} cursor-pointer`} value={draft().eventId} onChange={event => { const choice = events().find(item => item.id === event.currentTarget.value); setTradeDraft({ eventId: event.currentTarget.value, purchaseDate: choice?.cumDate ?? draft().purchaseDate }); }}>
          <For each={events().filter(event => event.id === draft().eventId || (!event.excluded && !selectedChain().some((item, index) => item.eventId === event.id && index !== tradeIndex())))}>{event => <option value={event.id} selected={event.id === draft().eventId}>{event.ticker} · {event.exDate}{event.excluded ? " · excluded" : ""}</option>}</For>
          <Show when={!events().some(event => event.id === draft().eventId)}><option value={draft().eventId}>Missing event · {draft().eventId}</option></Show>
        </select></Field><Field label="Purchase date"><input class={field} type="date" value={draft().purchaseDate} onInput={event => setTradeDraft({ ...draft(), purchaseDate: event.currentTarget.value })} /></Field></div>
        <p class="mt-150 text-75 text-muted">{strategy() === "recovery" ? "Wait for recovery" : "Sell on ex-date"} · {SCENARIO_LABEL[scenario()]} · Sale date is calculated.</p>
        <Show when={tradePreview()} fallback={<p class="mt-200 text-75 text-muted">Complete settings to calculate this trade.</p>}>{preview => <Show when={preview().status === "completed" ? preview() : undefined} fallback={<p class="mt-200 rounded-100 bg-surface-2 p-150 text-75 text-neg" role="status">{`Skipped: ${previewReason()}`}</p>}>{row => {
          // The discriminant is preserved by the adapter; narrow it for the detail view.
          const completed = () => { const item = row(); return item.status === "completed" ? item : null; };
          return <Show when={completed()}>{item => <>
            <dl class="mt-200 grid gap-150 sm:grid-cols-2">
              <Detail label="Buy allocation · including fee" value={money(item().trade.buyCost)} />
              <Detail label="Position" value={`${item().trade.lots} lots · ${item().trade.shares} shares`} />
              <Detail label="Available cash before buy" value={money(item().cashBeforePurchase)} />
              <Detail label="Cash left after buy" value={money(item().cashAfterPurchase)} />
              <Detail label="Assumed buy / sell price per share" value={`${money(item().trade.purchasePrice)} / ${money(item().trade.salePrice)}`} />
              <Detail label="Holding period" value={`${item().holdingDays} days · ${item().holdingSessions} exchange sessions`} />
              <Detail label="Sale · net proceeds" value={`${flowDate(item().trade.saleDate)} · ${money(item().trade.netSale)}`} />
              <Detail label="Sale settlement" value={`${item().trade.settlementDate}${item().pendingSale ? " · pending after plan end" : ""}`} />
              <Detail label="Net dividend · payment date" value={`${money(item().trade.netDividend)} · ${item().trade.paymentDate}${item().pendingDividend ? " · pending" : ""}`} />
              <Detail label="Dividend yield on buy cost" value={flowPercent(item().dividendYield)} />
              <Detail label="Buy fee / sell fee / dividend tax" value={`${money(item().trade.buyFee)} / ${money(item().trade.sellFee)} / ${money(item().trade.dividendTax)}`} />
              <Detail label="Net profit · return on buy cost" value={`${money(item().trade.netProfit)} · ${flowPercent(item().returnPercent)}`} />
              <Detail label="Break-even sale price" value={money(item().trade.breakEvenSalePrice)} />
              <Detail label="Cash available from sale" value={item().cashAvailableDate ?? "Add future calendar coverage"} />
            </dl>
            <p class="mt-200 rounded-100 bg-surface-2 p-150 text-75 text-muted">{item().trade.exitReason}</p>
            <p class="mt-150 text-50 text-muted">Sale proceeds and dividends join pooled cash after receipt. Closing receipts can fund purchases from the following exchange session.</p>
          </>}</Show>;
        }}</Show>}</Show>
      </div>}</Show>
    </Modal>
    <Modal open={infoOpen()} title="About these projections" onClose={() => setInfoOpen(false)}><div class="space-y-150 p-250 text-75 text-muted"><p>Demo events, dates, and prices are invented. Manual events and assumed prices are entered by you. Price scenarios are calculation assumptions.</p><p>Net return includes sale proceeds and the net dividend, less buy cost. Dividend yield uses net dividend divided by buy cost. Ending wealth includes pending sale proceeds and dividends.</p><p>Use suggestion ranks chains by base-case ending wealth. Switching scenario recalculates the same selected sequence. No automatic orders are placed.</p></div></Modal>
  </>;
}

function Summary(props: { label: string; value: string; tone?: number }) {
  return <div><dt class="text-50 text-muted">{props.label}</dt><dd class="mt-50 text-100 md:text-400 font-700 tabular-nums tracking-[-.02em]" classList={{ "text-pos": (props.tone ?? 0) > 0, "text-neg": (props.tone ?? 0) < 0 }}>{props.value}</dd></div>;
}
function Detail(props: { label: string; value: string }) {
  return <div><dt class="text-50 text-muted">{props.label}</dt><dd class="mt-50 text-75 font-600 tabular-nums">{props.value}</dd></div>;
}
function Field(props: { label: string; children: JSX.Element }) {
  return <label class="block text-50 font-600 text-muted"><span class="mb-50 block">{props.label}</span>{props.children}</label>;
}
function EventField(props: { label: string; children: JSX.Element }) { return <Field {...props} />; }
function PercentField(props: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <Field label={props.label}><input class={field} type="number" min="0" max="100" step="0.01" value={props.value === null ? "" : (props.value * 100).toString()} placeholder="Required" onInput={event => props.onChange(event.currentTarget.value === "" ? null : event.currentTarget.valueAsNumber / 100)} /></Field>;
}
function blankEvent(): DividendEvent {
  const workspace = dividendWorkspace(); const date = workspace.inputs.startDate || "2026-04-06";
  return { id: `manual-${Date.now().toString(36)}`, ticker: "", dividendPerShare: 0, cumDate: date, exDate: date, recordingDate: date, paymentDate: date, purchasePrice: 0, sourceNotes: "", provenance: "manual", excluded: false };
}
