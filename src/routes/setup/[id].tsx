import { A, useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";
import { For, Show, createMemo, createSignal } from "solid-js";
import { ArrowLeft, BookOpen, CalendarClock, ExternalLink, Plus, Target } from "lucide-solid";
import { AppNavbar } from "~/components/navigation/AppNavbar";
import { MarketPulseStrip } from "~/components/navigation/MarketPulseStrip";
import { PositionSizeCalculator } from "~/components/setups/PositionSizeCalculator";
import { dashboardData } from "~/lib/dashboard-data";
import type { SetupEvidence, SetupStatus } from "~/lib/investing-types";
import { initAccent } from "~/lib/accent";
import { initPalette } from "~/lib/palette";
import { initTheme } from "~/lib/theme";
import { initTradesStore, trades } from "~/lib/trades-store";
import { SETUP_STATUSES, initSetupsStore, setups, statusClasses, transitionSetupStatus, updateSetup } from "~/lib/setups-store";

const SetupChart = clientOnly(() => import("~/components/setups/SetupChartPreviewImpl"));

export default function SetupDetailPage() {
  initTheme();
  initPalette();
  initAccent();
  initSetupsStore();
  initTradesStore();
  const params = useParams<{ id: string }>();
  const setup = createMemo(() => setups().find(item => item.id === params.id));
  const linkedTrades = createMemo(() => trades().filter(trade => trade.setupId === params.id));
  const [statusNote, setStatusNote] = createSignal("");
  const [evidenceKind, setEvidenceKind] = createSignal<SetupEvidence["kind"]>("supporting");
  const [evidenceTitle, setEvidenceTitle] = createSignal("");
  const [evidenceNote, setEvidenceNote] = createSignal("");
  const [evidenceUrl, setEvidenceUrl] = createSignal("");

  const addEvidence = () => {
    const current = setup();
    if (!current || !evidenceTitle().trim()) return;
    const item: SetupEvidence = {
      id: `evidence-${Date.now().toString(36)}`,
      kind: evidenceKind(),
      title: evidenceTitle().trim(),
      note: evidenceNote().trim(),
      sourceUrl: evidenceUrl().trim() || undefined,
      capturedAt: new Date().toISOString(),
    };
    updateSetup(current.id, { evidence: [...(current.evidence ?? []), item] });
    setEvidenceTitle("");
    setEvidenceNote("");
    setEvidenceUrl("");
  };

  return (
    <>
      <AppNavbar />
      <MarketPulseStrip markets={dashboardData.markets} />
      <Show
        when={setup()}
        fallback={<main class="mx-auto max-w-[900px] px-200 py-800 text-center"><h1 class="text-600 font-700">Setup not found</h1><A href="/setups" class="mt-200 inline-flex text-accent">Return to setups</A></main>}
      >
        {current => (
          <>
            <Title>{`Investing OS | ${current().symbol} setup`}</Title>
            <main class="mx-auto max-w-[1440px] px-200 pb-800">
              <section class="pt-400">
                <A href="/setups" class="inline-flex items-center gap-50 text-75 font-700 text-muted hover:text-ink"><ArrowLeft size={14} /> Setups</A>
                <div class="mt-200 flex flex-col gap-200 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div class="flex flex-wrap items-center gap-100">
                      <span class="text-800 font-700">{current().symbol}</span>
                      <span class={`px-100 py-[3px] rounded-10 text-50 font-700 uppercase ${statusClasses(current().status)}`}>{current().status}</span>
                      <span class="text-75 font-700 uppercase" classList={{ "text-pos": current().direction === "long", "text-neg": current().direction === "short" }}>{current().direction}</span>
                    </div>
                    <p class="mt-50 text-200 text-muted">{current().emiten}</p>
                    <p class="mt-150 max-w-[80ch] text-100 leading-[160%]">{current().thesis}</p>
                  </div>
                  <A href={`/journal?setup=${current().id}`} class="inline-flex h-10 items-center gap-100 self-start rounded-100 bg-accent-fill px-200 text-75 font-700 text-on-accent"><BookOpen size={16} /> Record trade</A>
                </div>
              </section>

              <div class="mt-300 grid gap-200 xl:grid-cols-[minmax(0,1.45fr)_420px]">
                <div class="min-w-0 space-y-200">
                  <SetupChart ticker={current().symbol} height={380} annotations={current().annotations ?? []} onAnnotationsChange={annotations => updateSetup(current().id, { annotations })} />
                  <section class="rounded-200 border border-line bg-surface-1 p-250">
                    <div class="flex items-center gap-100"><Target size={17} class="text-accent" /><h2 class="text-200 font-700">Plan and evidence</h2></div>
                    <dl class="mt-200 grid grid-cols-2 gap-150 sm:grid-cols-4">
                      <Metric label="Entry" value={current().entry} />
                      <Metric label="Stop" value={current().stopLoss} negative />
                      <Metric label="Target" value={current().target} positive />
                      <Metric label="Planned R" value={current().riskReward} />
                    </dl>
                    <div class="mt-250 grid gap-200 lg:grid-cols-2">
                      <For each={["supporting", "opposing"] as const}>{kind => (
                        <div>
                          <h3 class="text-75 font-700 uppercase tracking-[.06em] text-caption">{kind} evidence</h3>
                          <div class="mt-100 space-y-100">
                            <For each={(current().evidence ?? []).filter(item => item.kind === kind)} fallback={<p class="text-75 text-muted">No {kind} evidence yet.</p>}>
                              {item => <article class="rounded-100 border border-line bg-surface-2 p-150"><div class="flex items-start justify-between gap-100"><p class="font-700">{item.title}</p><Show when={item.sourceUrl}><a href={item.sourceUrl} target="_blank" rel="noreferrer" class="text-accent" aria-label={`Open source for ${item.title}`}><ExternalLink size={14} /></a></Show></div><Show when={item.note}><p class="mt-50 text-75 text-muted">{item.note}</p></Show><p class="mt-100 text-50 text-caption">{new Date(item.capturedAt).toLocaleString()}</p></article>}
                            </For>
                          </div>
                        </div>
                      )}</For>
                    </div>
                    <div class="mt-250 rounded-200 border border-line bg-surface-2 p-200">
                      <div class="grid gap-100 sm:grid-cols-[130px_1fr_1fr]">
                        <select class="h-10 rounded-100 border border-line bg-surface-1 px-100 text-75" value={evidenceKind()} onChange={event => setEvidenceKind(event.currentTarget.value as SetupEvidence["kind"])}><option value="supporting">Supporting</option><option value="opposing">Opposing</option></select>
                        <input class="h-10 rounded-100 border border-line bg-surface-1 px-150" value={evidenceTitle()} onInput={event => setEvidenceTitle(event.currentTarget.value)} placeholder="Evidence title" />
                        <input class="h-10 rounded-100 border border-line bg-surface-1 px-150" value={evidenceUrl()} onInput={event => setEvidenceUrl(event.currentTarget.value)} placeholder="Source URL, optional" />
                      </div>
                      <div class="mt-100 flex gap-100"><input class="h-10 min-w-0 flex-1 rounded-100 border border-line bg-surface-1 px-150" value={evidenceNote()} onInput={event => setEvidenceNote(event.currentTarget.value)} placeholder="Why this matters" /><button type="button" onClick={addEvidence} disabled={!evidenceTitle().trim()} class="inline-flex h-10 items-center gap-50 rounded-100 bg-accent-fill px-150 text-75 font-700 text-on-accent disabled:opacity-40"><Plus size={14} /> Add</button></div>
                    </div>
                  </section>
                </div>

                <aside class="space-y-200">
                  <PositionSizeCalculator levels={current().levels!} direction={current().direction} currency={current().currency!} />
                  <section class="rounded-200 border border-line bg-surface-1 p-250">
                    <h2 class="text-200 font-700">Setup details</h2>
                    <label class="mt-150 block text-75 font-600 text-muted">Strategy<input class="mt-50 h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-ink" value={current().strategy ?? ""} onChange={event => updateSetup(current().id, { strategy: event.currentTarget.value })} /></label>
                    <label class="mt-150 block text-75 font-600 text-muted">Catalyst date and time<input type="datetime-local" class="mt-50 h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-ink" value={current().catalystAt ? toLocalInput(current().catalystAt!) : ""} onChange={event => updateSetup(current().id, { catalystAt: event.currentTarget.value ? new Date(event.currentTarget.value).toISOString() : undefined })} /></label>
                    <p class="mt-100 text-50 text-caption">{current().catalyst || "No catalyst description"}</p>
                  </section>
                  <section class="rounded-200 border border-line bg-surface-1 p-250">
                    <h2 class="text-200 font-700">Status history</h2>
                    <div class="mt-150 flex gap-100">
                      <select class="h-10 min-w-0 flex-1 rounded-100 border border-line bg-surface-2 px-100 text-75" value={current().status} onChange={event => { transitionSetupStatus(current().id, event.currentTarget.value as SetupStatus, statusNote()); setStatusNote(""); }}><For each={SETUP_STATUSES}>{status => <option value={status}>{status}</option>}</For></select>
                      <input class="h-10 min-w-0 flex-1 rounded-100 border border-line bg-surface-2 px-100 text-75" value={statusNote()} onInput={event => setStatusNote(event.currentTarget.value)} placeholder="Reason, optional" />
                    </div>
                    <ol class="mt-200 space-y-150"><For each={[...(current().statusHistory ?? [])].reverse()}>{event => <li class="border-l-2 border-line pl-150"><p class="text-75 font-700 capitalize">{event.from ? `${event.from} to ` : ""}{event.to}</p><p class="text-50 text-caption">{new Date(event.at).toLocaleString()}</p><Show when={event.note}><p class="mt-50 text-75 text-muted">{event.note}</p></Show></li>}</For></ol>
                  </section>
                  <section class="rounded-200 border border-line bg-surface-1 p-250">
                    <div class="flex items-center gap-100"><CalendarClock size={16} class="text-accent" /><h2 class="text-200 font-700">Linked trades</h2></div>
                    <div class="mt-150 space-y-100"><For each={linkedTrades()} fallback={<p class="text-75 text-muted">No trades recorded for this setup.</p>}>{trade => <A href={`/journal?trade=${trade.id}`} class="flex items-center justify-between rounded-100 border border-line bg-surface-2 px-150 py-100"><span><b>{trade.symbol}</b><span class="ml-100 text-50 uppercase text-caption">{trade.status}</span></span><span class="text-50 text-caption">{trade.review ? "Reviewed" : "Needs review"}</span></A>}</For></div>
                  </section>
                </aside>
              </div>
            </main>
          </>
        )}
      </Show>
    </>
  );
}

function Metric(props: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return <div class="rounded-100 bg-surface-2 p-150"><dt class="text-50 text-caption">{props.label}</dt><dd class="mt-50 font-700 tabular-nums" classList={{ "text-pos": props.positive, "text-neg": props.negative }}>{props.value || "-"}</dd></div>;
}

function toLocalInput(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
