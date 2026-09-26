import { A, useSearchParams } from "@solidjs/router";
import { Title, Meta } from "@solidjs/meta";
import { For, Show, createMemo, createSignal } from "solid-js";
import { BookOpen, Camera, Plus, Save } from "lucide-solid";
import { AppNavbar } from "~/components/navigation/AppNavbar";
import { MarketPulseStrip } from "~/components/navigation/MarketPulseStrip";
import { dashboardData } from "~/lib/dashboard-data";
import type { Currency, Direction, TradeFill, TradeRecord, TradeReview } from "~/lib/investing-types";
import { formatMoney } from "~/lib/risk";
import { resultForTrade } from "~/lib/trade-analytics";
import { initAccent } from "~/lib/accent";
import { initPalette } from "~/lib/palette";
import { initTheme } from "~/lib/theme";
import { initSetupsStore, setups } from "~/lib/setups-store";
import { addTrade, initTradesStore, newTradeId, reviewTrade, trades } from "~/lib/trades-store";

export default function JournalPage() {
  initTheme(); initPalette(); initAccent(); initSetupsStore(); initTradesStore();
  const [params] = useSearchParams();
  const selected = createMemo(() => typeof params.trade === "string" ? trades().find(trade => trade.id === params.trade) : undefined);

  return (
    <>
      <Title>Investing OS | Trade journal</Title>
      <Meta name="description" content="Record fills, partial exits, fees, screenshots and trade reviews linked to investment setups." />
      <AppNavbar />
      <MarketPulseStrip markets={dashboardData.markets} />
      <main class="mx-auto max-w-[1440px] px-200 pb-800">
        <section class="pt-500">
          <div class="flex items-center gap-100 text-50 font-700 uppercase tracking-[.08em] text-accent"><BookOpen size={13} /> Decision journal</div>
          <h1 class="mt-150 text-800 font-700">Trade journal</h1>
          <p class="mt-100 max-w-[70ch] text-100 text-muted">Record actual execution against the original setup, then close the loop with a short review.</p>
        </section>

        <div class="mt-300 grid gap-200 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section class="rounded-200 border border-line bg-surface-1 overflow-hidden">
            <div class="border-b border-line px-250 py-200"><h2 class="text-200 font-700">Recorded trades</h2><p class="mt-50 text-75 text-muted">{trades().length} total</p></div>
            <div class="divide-y divide-line"><For each={trades()} fallback={<p class="p-250 text-75 text-muted">No trades recorded yet.</p>}>{trade => {
              const result = createMemo(() => resultForTrade(trade));
              return <A href={`/journal?trade=${trade.id}`} class="block px-250 py-200 hover:bg-surface-2"><div class="flex items-center justify-between gap-100"><span><b>{trade.symbol}</b><span class="ml-100 text-50 uppercase text-caption">{trade.direction}</span></span><span class="text-50 font-700 uppercase" classList={{ "text-pos": trade.status === "closed" && result().realizedPnl > 0, "text-neg": trade.status === "closed" && result().realizedPnl <= 0, "text-accent": trade.status === "open" }}>{trade.status}</span></div><div class="mt-100 flex items-center justify-between text-75 text-muted"><span>{trade.fills.length} fills</span><span>{trade.review ? "Reviewed" : trade.status === "closed" ? "Needs review" : "In progress"}</span></div></A>;
            }}</For></div>
          </section>

          <Show when={selected()} fallback={<TradeForm preselectedSetupId={typeof params.setup === "string" ? params.setup : undefined} />}>
            {trade => <TradeDetail trade={trade()} />}
          </Show>
        </div>
      </main>
    </>
  );
}

function TradeForm(props: { preselectedSetupId?: string }) {
  const initialSetupId = props.preselectedSetupId && setups().some(item => item.id === props.preselectedSetupId) ? props.preselectedSetupId : setups()[0]?.id ?? "";
  const [setupId, setSetupId] = createSignal(initialSetupId);
  const chosen = createMemo(() => setups().find(item => item.id === setupId()));
  const [status, setStatus] = createSignal<"open" | "closed">("open");
  const [strategy, setStrategy] = createSignal(chosen()?.strategy ?? "Unclassified");
  const [initialRisk, setInitialRisk] = createSignal(0);
  const [exitReason, setExitReason] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [fills, setFills] = createSignal<TradeFill[]>([newFill("entry", chosen()?.levels?.entryLow ?? 0, chosen()?.currency ?? "USD")]);
  const [screenshotDataUrl, setScreenshotDataUrl] = createSignal<string | undefined>();
  const [screenshotName, setScreenshotName] = createSignal<string | undefined>();
  const [error, setError] = createSignal("");

  const changeSetup = (id: string) => {
    setSetupId(id);
    const setup = setups().find(item => item.id === id);
    if (!setup) return;
    setStrategy(setup.strategy ?? "Unclassified");
    setFills([newFill("entry", setup.levels?.entryLow ?? 0, setup.currency ?? "USD")]);
  };

  const updateFill = (id: string, patch: Partial<TradeFill>) => setFills(current => current.map(fill => fill.id === id ? { ...fill, ...patch } : fill));
  const save = () => {
    const setup = chosen();
    if (!setup || fills().filter(fill => fill.side === "entry").length === 0) { setError("Choose a setup and record at least one entry fill."); return; }
    if (fills().some(fill => fill.price <= 0 || fill.quantity <= 0)) { setError("Every fill needs a positive price and quantity."); return; }
    const entryQuantity = fills().filter(fill => fill.side === "entry").reduce((sum, fill) => sum + fill.quantity, 0);
    const exitQuantity = fills().filter(fill => fill.side === "exit").reduce((sum, fill) => sum + fill.quantity, 0);
    if (status() === "closed" && Math.abs(entryQuantity - exitQuantity) > 0.000001) { setError("A closed trade needs exit fills for the full entered quantity."); return; }
    const now = new Date().toISOString();
    const trade: TradeRecord = {
      id: newTradeId(setup.symbol),
      setupId: setup.id,
      symbol: setup.symbol,
      universe: setup.universe,
      direction: setup.direction,
      currency: setup.currency ?? "USD",
      strategy: strategy().trim() || "Unclassified",
      status: status(),
      initialRiskAmount: initialRisk(),
      plannedStop: setup.levels?.stop ?? null,
      fills: fills(),
      exitReason: exitReason().trim(),
      notes: notes().trim(),
      screenshotDataUrl: screenshotDataUrl(),
      screenshotName: screenshotName(),
      createdAt: now,
      updatedAt: now,
    };
    addTrade(trade);
    window.location.href = `/journal?trade=${trade.id}`;
  };

  const readScreenshot = (file?: File) => {
    setError("");
    if (!file) return;
    if (file.size > 1_500_000) { setError("Screenshot must be smaller than 1.5 MB for local storage."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { setScreenshotDataUrl(reader.result); setScreenshotName(file.name); } };
    reader.readAsDataURL(file);
  };

  const field = "h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-100 outline-none focus:border-accent";
  return (
    <section class="rounded-200 border border-line bg-surface-1 p-250">
      <div class="flex items-center justify-between"><div><h2 class="text-300 font-700">Record a trade</h2><p class="mt-50 text-75 text-muted">New trades stay linked to their prior setup.</p></div><button type="button" onClick={save} class="inline-flex h-10 items-center gap-100 rounded-100 bg-accent-fill px-200 text-75 font-700 text-on-accent"><Save size={15} /> Save trade</button></div>
      <div class="mt-250 grid gap-150 sm:grid-cols-2">
        <Label text="Original setup"><select class={field} value={setupId()} onChange={event => changeSetup(event.currentTarget.value)}><For each={setups()}>{setup => <option value={setup.id}>{setup.symbol} · {setup.thesis.slice(0, 44)}</option>}</For></select></Label>
        <Label text="Strategy"><input class={field} value={strategy()} onInput={event => setStrategy(event.currentTarget.value)} /></Label>
        <Label text="Trade status"><select class={field} value={status()} onChange={event => setStatus(event.currentTarget.value as "open" | "closed")}><option value="open">Open</option><option value="closed">Closed</option></select></Label>
        <Label text={`Initial risk (${chosen()?.currency ?? "USD"})`}><input type="number" min="0" step="any" class={field} value={initialRisk()} onInput={event => setInitialRisk(event.currentTarget.valueAsNumber || 0)} /></Label>
      </div>

      <div class="mt-250 flex items-center justify-between"><h3 class="text-100 font-700">Fills</h3><div class="flex gap-100"><button type="button" onClick={() => setFills(current => [...current, newFill("entry", 0, chosen()?.currency ?? "USD")])} class="h-8 rounded-100 border border-line px-150 text-75 font-700"><Plus size={13} class="inline" /> Entry</button><button type="button" onClick={() => setFills(current => [...current, newFill("exit", 0, chosen()?.currency ?? "USD")])} class="h-8 rounded-100 border border-line px-150 text-75 font-700"><Plus size={13} class="inline" /> Exit</button></div></div>
      <div class="mt-100 space-y-100"><For each={fills()}>{fill => <div class="grid gap-100 rounded-100 border border-line bg-surface-2 p-100 sm:grid-cols-[80px_1fr_1fr_1.3fr_1fr_auto]"><select class="h-9 rounded-50 bg-surface-1 px-100 text-75 font-700" value={fill.side} onChange={event => updateFill(fill.id, { side: event.currentTarget.value as "entry" | "exit" })}><option value="entry">Entry</option><option value="exit">Exit</option></select><input aria-label="Fill price" type="number" min="0" step="any" class="h-9 rounded-50 bg-surface-1 px-100" value={fill.price} onInput={event => updateFill(fill.id, { price: event.currentTarget.valueAsNumber || 0 })} placeholder="Price" /><input aria-label="Fill quantity" type="number" min="0" step="any" class="h-9 rounded-50 bg-surface-1 px-100" value={fill.quantity} onInput={event => updateFill(fill.id, { quantity: event.currentTarget.valueAsNumber || 0 })} placeholder="Quantity" /><input aria-label="Execution time" type="datetime-local" class="h-9 rounded-50 bg-surface-1 px-100 text-75" value={toLocalInput(fill.executedAt)} onInput={event => updateFill(fill.id, { executedAt: new Date(event.currentTarget.value).toISOString() })} /><input aria-label="Fee" type="number" min="0" step="any" class="h-9 rounded-50 bg-surface-1 px-100" value={fill.fee} onInput={event => updateFill(fill.id, { fee: event.currentTarget.valueAsNumber || 0 })} placeholder="Fee" /><button type="button" onClick={() => setFills(current => current.filter(item => item.id !== fill.id))} class="h-9 px-100 text-50 font-700 text-neg">Remove</button></div>}</For></div>

      <div class="mt-250 grid gap-150 sm:grid-cols-2"><Label text="Exit reason"><input class={field} value={exitReason()} onInput={event => setExitReason(event.currentTarget.value)} placeholder="Target, stop, thesis change" /></Label><Label text="Execution notes"><input class={field} value={notes()} onInput={event => setNotes(event.currentTarget.value)} placeholder="What happened during the trade" /></Label></div>
      <label class="mt-200 flex cursor-pointer items-center gap-100 rounded-100 border border-dashed border-line px-150 py-150 text-75 text-muted"><Camera size={16} /><span>{screenshotName() ?? "Attach screenshot, maximum 1.5 MB"}</span><input type="file" accept="image/*" class="sr-only" onChange={event => readScreenshot(event.currentTarget.files?.[0])} /></label>
      <Show when={error()}><p class="mt-150 text-75 font-700 text-neg" role="alert">{error()}</p></Show>
    </section>
  );
}

function TradeDetail(props: { trade: TradeRecord }) {
  const result = createMemo(() => resultForTrade(props.trade));
  const [followedThesis, setFollowedThesis] = createSignal(props.trade.review?.followedThesis ?? true);
  const [respectedRisk, setRespectedRisk] = createSignal(props.trade.review?.respectedRisk ?? true);
  const [worked, setWorked] = createSignal(props.trade.review?.worked ?? "");
  const [failed, setFailed] = createSignal(props.trade.review?.failed ?? "");
  const [lesson, setLesson] = createSignal(props.trade.review?.lesson ?? "");
  const saveReview = () => {
    const review: TradeReview = { reviewedAt: new Date().toISOString(), followedThesis: followedThesis(), respectedRisk: respectedRisk(), worked: worked().trim(), failed: failed().trim(), lesson: lesson().trim() };
    reviewTrade(props.trade.id, review);
  };
  const field = "h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-100 outline-none focus:border-accent";
  return <section class="rounded-200 border border-line bg-surface-1 p-250"><div class="flex flex-wrap items-start justify-between gap-150"><div><div class="flex items-center gap-100"><h2 class="text-600 font-700">{props.trade.symbol}</h2><span class="text-75 font-700 uppercase text-caption">{props.trade.direction}</span></div><p class="mt-50 text-75 text-muted">{props.trade.strategy} · {props.trade.currency}</p></div><A href="/journal" class="h-9 rounded-100 border border-line px-150 py-100 text-75 font-700">New trade</A></div>
    <dl class="mt-250 grid grid-cols-2 gap-100 sm:grid-cols-4"><Stat label="Realized P&L" value={formatMoney(result().realizedPnl, props.trade.currency)} tone={result().realizedPnl >= 0 ? "positive" : "negative"} /><Stat label="Realized R" value={result().realizedR === null ? "-" : `${result().realizedR! >= 0 ? "+" : ""}${result().realizedR!.toFixed(2)}R`} tone={(result().realizedR ?? 0) >= 0 ? "positive" : "negative"} /><Stat label="Average entry" value={result().averageEntry.toLocaleString()} /><Stat label="Average exit" value={result().averageExit ? result().averageExit.toLocaleString() : "Open"} /></dl>
    <div class="mt-250 overflow-x-auto"><table class="w-full text-left text-75"><thead class="text-caption"><tr><th class="pb-100">Side</th><th>Time</th><th>Price</th><th>Quantity</th><th>Fee</th></tr></thead><tbody class="divide-y divide-line"><For each={props.trade.fills}>{fill => <tr><td class="py-100 font-700 capitalize">{fill.side}</td><td>{new Date(fill.executedAt).toLocaleString()}</td><td>{fill.price.toLocaleString()}</td><td>{fill.quantity.toLocaleString()}</td><td>{formatMoney(fill.fee, fill.feeCurrency)}</td></tr>}</For></tbody></table></div>
    <Show when={props.trade.screenshotDataUrl}><img src={props.trade.screenshotDataUrl} alt={props.trade.screenshotName ?? `${props.trade.symbol} trade screenshot`} class="mt-200 max-h-[360px] w-full rounded-200 border border-line object-contain bg-surface-2" /></Show>
    <div class="mt-300 border-t border-line pt-250"><div class="flex items-center justify-between"><div><h3 class="text-300 font-700">Trade review</h3><p class="mt-50 text-75 text-muted">A closed trade remains in the attention queue until this review is saved.</p></div><button type="button" onClick={saveReview} class="inline-flex h-10 items-center gap-100 rounded-100 bg-accent-fill px-200 text-75 font-700 text-on-accent"><Save size={15} /> Save review</button></div>
      <div class="mt-200 flex flex-wrap gap-200"><label class="flex items-center gap-100 text-75 font-600"><input type="checkbox" checked={followedThesis()} onChange={event => setFollowedThesis(event.currentTarget.checked)} /> Followed thesis</label><label class="flex items-center gap-100 text-75 font-600"><input type="checkbox" checked={respectedRisk()} onChange={event => setRespectedRisk(event.currentTarget.checked)} /> Respected risk</label></div>
      <div class="mt-200 grid gap-150"><Label text="What worked"><input class={field} value={worked()} onInput={event => setWorked(event.currentTarget.value)} /></Label><Label text="What failed"><input class={field} value={failed()} onInput={event => setFailed(event.currentTarget.value)} /></Label><Label text="One lesson"><input class={field} value={lesson()} onInput={event => setLesson(event.currentTarget.value)} /></Label></div>
    </div>
  </section>;
}

function newFill(side: "entry" | "exit", price: number, currency: Currency): TradeFill {
  return { id: `fill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, side, executedAt: new Date().toISOString(), price, quantity: 0, fee: 0, feeCurrency: currency };
}

function toLocalInput(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function Label(props: { text: string; children: unknown }) { return <label class="block text-75 font-600 text-muted"><span class="mb-50 block">{props.text}</span>{props.children as never}</label>; }
function Stat(props: { label: string; value: string; tone?: "positive" | "negative" }) { return <div class="rounded-100 bg-surface-2 p-150"><dt class="text-50 text-caption">{props.label}</dt><dd class="mt-50 text-200 font-700 tabular-nums" classList={{ "text-pos": props.tone === "positive", "text-neg": props.tone === "negative" }}>{props.value}</dd></div>; }
