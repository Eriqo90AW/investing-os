import { For, Show, createMemo, createSignal } from "solid-js";
import { Bot, ChevronDown, ChevronUp, KeyRound, Send, Sparkles, X } from "lucide-solid";
import { useLocation } from "@solidjs/router";
import { buildAgentContext, compactContext } from "~/lib/agent/context";
import { runLocalAgentAction } from "~/lib/agent/actions";
import {
  addAgentMessage,
  agentApiKey,
  agentBusy,
  agentMessages,
  agentModel,
  agentOpen,
  closeAgent,
  openAgent,
  setAgentBusy,
} from "~/lib/agent/store";

export function InvestingAgent() {
  const location = useLocation();
  const [prompt, setPrompt] = createSignal("");
  const context = createMemo(() => buildAgentContext(location.pathname));

  const submit = async (event: Event) => {
    event.preventDefault();
    const value = prompt().trim();
    if (!value || agentBusy()) return;
    setPrompt("");
    addAgentMessage({ role: "user", content: value });
    const local = runLocalAgentAction(value);
    if (local.handled) return;
    if (!agentApiKey()) {
      addAgentMessage({ role: "assistant", content: "Connect an OpenCode API key in Settings to ask research questions. I can still create a local setup draft from the command bar." });
      return;
    }
    setAgentBusy(true);
    try {
      const response = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: agentApiKey(), model: agentModel(), prompt: value, context: compactContext(context()) }),
      });
      const body = await response.json() as { text?: string; error?: string };
      addAgentMessage({ role: "assistant", content: body.text ?? body.error ?? "The agent did not return a response." });
    } catch {
      addAgentMessage({ role: "assistant", content: "The agent connection failed. Check the OpenCode key and try again." });
    } finally {
      setAgentBusy(false);
    }
  };

  return (
    <>
      <div id="agent-shell" class="fixed bottom-200 right-200 z-[60] w-[min(calc(100vw-2rem),520px)] pointer-events-none">
        <div>
          <div class="pointer-events-auto ml-auto w-full rounded-200 border border-line bg-surface-1/95 shadow-overlay backdrop-blur-xl">
            <div class="flex items-center gap-100 px-150 py-100">
              <span class="grid size-7 place-items-center rounded-100 bg-secondary text-on-secondary"><Bot size={15} /></span>
              <button type="button" class="min-w-0 flex-1 text-left" onClick={() => (agentOpen() ? closeAgent() : openAgent())}>
                <span class="block text-75 font-700 text-ink">Investing OS Agent</span>
                <span class="block text-50 text-muted truncate">{context().page} context · {agentApiKey() ? agentModel() : "local mode"}</span>
              </button>
              <Show when={agentBusy()}><span class="text-50 text-accent">Working</span></Show>
              <button type="button" onClick={() => (agentOpen() ? closeAgent() : openAgent())} class="grid size-7 place-items-center rounded-100 text-muted hover:bg-surface-2 hover:text-ink" aria-label={agentOpen() ? "Collapse agent" : "Expand agent"}>
                <Show when={agentOpen()} fallback={<ChevronDown size={15} />}><ChevronUp size={15} /></Show>
              </button>
            </div>
            <Show when={agentOpen()}>
              <div class="border-t border-line">
                <div class="max-h-[280px] overflow-y-auto px-150 py-150 space-y-100">
                  <Show when={agentMessages().length === 0}>
                    <p class="text-75 text-muted">Ask about this page, or say “Add new setup” to place a draft on the screen.</p>
                  </Show>
                  <For each={agentMessages()}>
                    {message => <div class={message.role === "user" ? "ml-8 rounded-100 bg-accent-fill px-100 py-75 text-75 text-on-accent" : "mr-8 rounded-100 bg-surface-2 px-100 py-75 text-75 text-ink"}>{message.content}</div>}
                  </For>
                </div>
                <form onSubmit={submit} class="flex items-end gap-100 border-t border-line p-100">
                  <textarea value={prompt()} onInput={event => setPrompt(event.currentTarget.value)} rows="2" placeholder="Ask the agent or add a setup..." class="min-w-0 flex-1 resize-none rounded-100 bg-surface-2 px-100 py-75 text-75 text-ink outline-none placeholder:text-caption" />
                  <button type="submit" class="grid size-8 place-items-center rounded-100 bg-accent-fill text-on-accent disabled:opacity-50" disabled={!prompt().trim() || agentBusy()} aria-label="Send to agent"><Send size={14} /></button>
                </form>
                <div class="flex items-center justify-between px-150 pb-100 text-50 text-caption"><span class="inline-flex items-center gap-50"><Sparkles size={11} /> Context: {context().page}</span><Show when={!agentApiKey()}><span class="inline-flex items-center gap-50"><KeyRound size={11} /> Add key in Settings</span></Show></div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
}
