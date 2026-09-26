import { For, Show, createSignal } from "solid-js";
import { Modal } from "~/components/ui/Modal";
import { PALETTES, palette, setPalette } from "~/lib/palette";
import { mode, resolved, setMode, type ThemeMode } from "~/lib/theme";
import { accentHex, derived, setAccentHex } from "~/lib/accent";
import { agentApiKey, agentModel, clearAgentApiKey, setAgentApiKey, setAgentModel, type AgentModel } from "~/lib/agent/store";
import { downloadBackup, importBackup } from "~/lib/data-backup";
import { replaceSetups, resetDemoSetups } from "~/lib/setups-store";
import { replaceTrades, resetDemoTrades } from "~/lib/trades-store";
import {
  displayTimezone,
  fxAsOf,
  initPreferences,
  reportingCurrency,
  setDisplayTimezone,
  setFxAsOf,
  setReportingCurrency,
  setUsdIdrRate,
  usdIdrRate,
} from "~/lib/preferences-store";

const MODES: { value: ThemeMode; label: string; detail: string }[] = [
  { value: "light", label: "Light", detail: "Bright grounds" },
  { value: "system", label: "Auto", detail: "Follows system" },
  { value: "dark", label: "Dark", detail: "Dim grounds" },
];

function resetAll(): void {
  // Defaults mirror DEFAULT_PALETTE ("rustic") in palette.ts,
  // DEFAULT_THEME ("system"/auto) in theme.ts, and null accent (the shared app
  // accent — the same lime set for every style — is in charge).
  setPalette("rustic");
  setMode("system");
  setAccentHex(null);
}

export function SettingsModal(props: { open: boolean; onClose: () => void }) {
  initPreferences();
  const accentValue = () => accentHex() ?? "#99e50b";
  const [backupMessage, setBackupMessage] = createSignal("");

  const restoreBackup = async (file?: File) => {
    if (!file) return;
    if (!window.confirm("Replace the current setups and trades with this backup?")) return;
    try {
      const counts = await importBackup(file);
      setBackupMessage(`Imported ${counts.setups} setups and ${counts.trades} trades.`);
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "The backup could not be imported.");
    }
  };

  return (
    <Modal
      open={props.open}
      title="Settings"
      width="520px"
      onClose={props.onClose}
      footer={
        <div class="flex items-center justify-between gap-200">
          <button
            type="button"
            onClick={resetAll}
            class="h-9 px-150 rounded-100 text-75 font-700 text-muted hover:text-ink hover:bg-surface-1 border border-line transition-colors cursor-pointer"
          >
            Reset all to defaults
          </button>
          <button
            type="button"
            onClick={props.onClose}
            class="h-9 px-200 rounded-100 bg-accent-fill text-on-accent text-75 font-700 hover:bg-accent-fill-hover transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      <div class="px-250 py-200">
        {/* ---- Style (palette) ---- */}
        <section aria-labelledby="settings-style">
          <h3 id="settings-style" class="text-50 font-700 uppercase tracking-[.08em] text-caption">
            Style
          </h3>
          <div role="radiogroup" aria-label="Style" class="mt-150 grid gap-100">
            <For each={PALETTES}>
              {p => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={palette() === p.id}
                  title={p.note}
                  onClick={() => setPalette(p.id)}
                  class="w-full px-150 py-150 flex items-center gap-150 rounded-200 border text-left transition-colors cursor-pointer"
                  classList={{
                    "border-accent bg-official-bg/50": palette() === p.id,
                    "border-line bg-surface-2 hover:border-hairline": palette() !== p.id,
                  }}
                >
                  <span
                    aria-hidden="true"
                    class="grid place-items-center w-8 h-8 rounded-full border border-line shrink-0"
                    style={{ background: p.source[0]?.hex ?? "transparent" }}
                  />
                  <span class="min-w-0">
                    <span class="block text-100 font-700 text-ink">
                      {p.label}
                      <Show when={palette() === p.id}>
                        <span class="ml-100 text-50 font-700 uppercase tracking-[.06em] text-accent">
                          Active
                        </span>
                      </Show>
                    </span>
                    <span class="block mt-[2px] text-75 text-muted leading-snug">{p.note}</span>
                  </span>
                </button>
              )}
            </For>
          </div>
        </section>

        {/* ---- Appearance (mode) ---- */}
        <section aria-labelledby="settings-appearance" class="mt-250 pt-250 border-t border-line">
          <h3 id="settings-appearance" class="text-50 font-700 uppercase tracking-[.08em] text-caption">
            Appearance
          </h3>
          <div
            role="radiogroup"
            aria-label="Appearance"
            class="mt-150 flex items-center p-[3px] rounded-100 bg-surface-2 border border-line"
          >
            <For each={MODES}>
              {m => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode() === m.value}
                  title={m.detail}
                  onClick={() => setMode(m.value)}
                  class="flex-1 px-100 h-9 rounded-50 text-75 font-600 transition cursor-pointer"
                  classList={{
                    "bg-surface-1 text-ink shadow-tiny": mode() === m.value,
                    "text-muted hover:text-ink": mode() !== m.value,
                  }}
                >
                  {m.label}
                </button>
              )}
            </For>
          </div>
          <Show when={mode() === "system"}>
            <p class="mt-100 text-75 text-muted">
              Following the system — currently <b class="text-ink">{resolved()}</b>.
            </p>
          </Show>
        </section>

        {/* ---- Accent (secondary color) ---- */}
        <section aria-labelledby="settings-accent" class="mt-250 pt-250 border-t border-line">
          <h3 id="settings-accent" class="text-50 font-700 uppercase tracking-[.08em] text-caption">
            Accent
          </h3>
          <p class="mt-100 text-75 text-muted">
            The secondary color for buttons, links, and highlights — shared by all
            three styles, so it stays the same when you switch styles. Any color
            works; a contrast-safe ramp is derived from it automatically.
          </p>
          <div class="mt-150 flex items-center gap-150">
            <label
              class="relative grid place-items-center w-11 h-11 rounded-200 border border-line bg-surface-2 cursor-pointer hover:border-hairline transition shrink-0"
              title="Pick an accent color"
            >
              <span class="sr-only">Accent color</span>
              <input
                type="color"
                class="accent-swatch"
                value={accentValue()}
                onInput={e => setAccentHex(e.currentTarget.value.toLowerCase())}
              />
              <span class="pointer-events-none absolute inset-[6px] rounded-full ring-1 ring-inset ring-ink/25" />
            </label>
            <div class="min-w-0">
              <p class="text-100 font-700 text-ink tabular-nums">
                {accentHex() ?? "Auto — palette default"}
              </p>
              <Show
                when={accentHex() !== null}
                fallback={<p class="text-75 text-muted">Using the shared accent (electric lime).</p>}
              >
                <button
                  type="button"
                  onClick={() => setAccentHex(null)}
                  class="mt-50 h-7 px-100 rounded-50 text-75 font-600 text-muted hover:text-ink border border-line transition cursor-pointer"
                >
                  Reset to style default
                </button>
              </Show>
            </div>
            <Show when={derived()}>
              {d => (
                <span
                  aria-hidden="true"
                  class="ml-auto grid place-items-center w-11 h-11 rounded-200 shrink-0 text-100 font-900"
                  style={{ background: d().fill, color: d().onAccent }}
                  title={`Derived fill ${d().fill}`}
                >
                  Aa
                </span>
              )}
            </Show>
          </div>
          <Show when={derived()?.reserved}>
            <p class="mt-150 px-150 py-100 rounded-100 bg-reminder-bg text-reminder text-75 font-600">
              This hue reads as {derived()?.reserved} — links and buttons may look like
              gains or losses. It still passes contrast.
            </p>
          </Show>
          <Show when={derived()?.displaces}>
            <p class="mt-100 text-75 text-muted">
              This hue takes over chart color {derived()?.displaces} so series stay
              distinguishable.
            </p>
          </Show>
        </section>

        <section aria-labelledby="settings-reporting" class="mt-250 pt-250 border-t border-line">
          <h3 id="settings-reporting" class="text-50 font-700 uppercase tracking-[.08em] text-caption">Reporting</h3>
          <div class="mt-150 grid grid-cols-2 gap-100">
            <label class="text-75 font-600 text-muted">Reporting currency<select class="mt-50 h-10 w-full rounded-100 border border-line bg-surface-2 px-100 text-ink" value={reportingCurrency()} onChange={event => setReportingCurrency(event.currentTarget.value as "USD" | "IDR")}><option value="USD">USD</option><option value="IDR">IDR</option></select></label>
            <label class="text-75 font-600 text-muted">Display timezone<input class="mt-50 h-10 w-full rounded-100 border border-line bg-surface-2 px-100 text-ink" value={displayTimezone()} onInput={event => setDisplayTimezone(event.currentTarget.value)} /></label>
            <label class="text-75 font-600 text-muted">USD to IDR rate<input type="number" min="0" class="mt-50 h-10 w-full rounded-100 border border-line bg-surface-2 px-100 text-ink" value={usdIdrRate()} onInput={event => setUsdIdrRate(event.currentTarget.valueAsNumber || 0)} /></label>
            <label class="text-75 font-600 text-muted">FX rate date<input type="date" class="mt-50 h-10 w-full rounded-100 border border-line bg-surface-2 px-100 text-ink" value={fxAsOf()} onInput={event => setFxAsOf(event.currentTarget.value)} /></label>
          </div>
          <p class="mt-100 text-50 text-caption">The FX rate is manual. Analytics continue to use R for cross-market comparisons.</p>
        </section>

        <section class="mt-250 pt-250 border-t border-line">
          <h3 class="text-50 font-700 uppercase tracking-[.08em] text-caption">Backup and demo data</h3>
          <p class="mt-100 text-75 text-muted">Export before clearing browser storage. Screenshot data is included in the backup.</p>
          <div class="mt-150 flex flex-wrap gap-100">
            <button type="button" onClick={downloadBackup} class="h-9 rounded-100 border border-line px-150 text-75 font-700 text-ink">Export JSON</button>
            <label class="inline-flex h-9 cursor-pointer items-center rounded-100 border border-line px-150 text-75 font-700 text-ink">Import JSON<input type="file" accept="application/json" class="sr-only" onChange={event => restoreBackup(event.currentTarget.files?.[0])} /></label>
            <button type="button" onClick={() => { if (window.confirm("Restore the original demo setups and trades?")) { resetDemoSetups(); resetDemoTrades(); setBackupMessage("Demo data restored."); } }} class="h-9 rounded-100 border border-line px-150 text-75 font-700 text-muted">Reset demo data</button>
            <button type="button" onClick={() => { if (window.confirm("Delete every local setup and trade? Export a backup first if you need one.")) { replaceSetups([]); replaceTrades([]); setBackupMessage("Local records deleted."); } }} class="h-9 rounded-100 border border-neg bg-neg-bg px-150 text-75 font-700 text-neg">Delete my records</button>
          </div>
          <Show when={backupMessage()}><p class="mt-100 text-75 text-muted">{backupMessage()}</p></Show>
        </section>

        <section aria-labelledby="settings-agent" class="mt-250 pt-250 border-t border-line">
          <h3 id="settings-agent" class="text-50 font-700 uppercase tracking-[.08em] text-caption">
            Agent connection
          </h3>
          <p class="mt-100 text-75 text-muted">
            Your OpenCode key stays in memory for this browser session and is sent only when you ask the agent a question.
          </p>
          <label class="mt-150 block text-75 font-600 text-muted" for="opencode-key">OpenCode API key</label>
          <div class="mt-50 flex gap-100">
            <input
              id="opencode-key"
              type="password"
              autocomplete="off"
              value={agentApiKey()}
              onInput={event => setAgentApiKey(event.currentTarget.value)}
              placeholder="Paste your OpenCode key"
              class="h-10 min-w-0 flex-1 rounded-100 border border-line bg-surface-2 px-150 text-75 text-ink outline-none focus:border-accent"
            />
            <Show when={agentApiKey()}>
              <button type="button" onClick={clearAgentApiKey} class="h-10 shrink-0 rounded-100 border border-line px-150 text-75 font-700 text-muted hover:text-ink">Disconnect</button>
            </Show>
          </div>
          <label class="mt-150 block text-75 font-600 text-muted" for="agent-model">Model</label>
          <select id="agent-model" value={agentModel()} onChange={event => setAgentModel(event.currentTarget.value as AgentModel)} class="mt-50 h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-75 text-ink outline-none focus:border-accent">
            <option value="gpt-6-astra">GPT 6 Astra</option>
            <option value="gpt-5.6-terra">GPT 5.6 Terra</option>
            <option value="gpt-5.6-luna">GPT 5.6 Luna</option>
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
          </select>
        </section>
      </div>
    </Modal>
  );
}
