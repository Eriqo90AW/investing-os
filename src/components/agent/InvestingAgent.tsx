import { Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { buildAgentContext, compactContext } from "~/lib/agent/context";
import { runLocalAgentAction } from "~/lib/agent/actions";
import {
  addAgentMessage,
  agentApiKey,
  agentBusy,
  agentHidden,
  agentModel,
  agentOpen,
  beginAgentRequest,
  clearAgentMessages,
  closeAgent,
  hideAgentCompletely,
  initAgentPersistence,
  openAgent,
  setAgentBusy,
  stopAgentRequest,
} from "~/lib/agent/store";
import { AgentLauncher } from "./AgentLauncher";
import { AgentPanel } from "./AgentPanel";

/**
 * Investing OS Agent — the persistent assistant mounted above every route.
 * Composes the collapsed launcher, the open conversation panel, the mobile
 * scrim, and all of the chat plumbing: local actions, the OpenCode relay,
 * abort/stop, session persistence, and the keyboard shortcut (Ctrl+Enter).
 * The viewer can hide the AI completely from inside the panel; the navbar
 * button (or Ctrl+Enter) brings it back.
 */
export function InvestingAgent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [prompt, setPrompt] = createSignal("");
  const context = createMemo(() => buildAgentContext(location.pathname));
  let composerRef: HTMLTextAreaElement | undefined;
  let launcherRef: HTMLButtonElement | undefined;
  let hasToggled = false;

  onMount(() => {
    initAgentPersistence();

    const onKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter (Cmd+Enter on macOS) opens the agent; nothing else claims
      // that chord. Open-only so it never steals a compose keystroke.
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!agentOpen()) openAgent();
        return;
      }
      if (event.key === "Escape" && agentOpen()) closeAgent();
    };
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  // Focus management: composer on open, launcher on close. Skip the first
  // run so a fresh page load doesn't steal focus.
  createEffect(() => {
    const isOpen = agentOpen();
    if (!hasToggled) {
      hasToggled = true;
      return;
    }
    queueMicrotask(() => (isOpen ? composerRef?.focus() : launcherRef?.focus()));
  });

  const submit = async (value?: string) => {
    if (agentBusy()) return;
    const text = (value ?? prompt()).trim();
    if (!text) return;
    setPrompt("");
    addAgentMessage({ role: "user", content: text });

    const local = runLocalAgentAction(text);
    if (local.handled) {
      if (local.navigate) navigate(local.navigate);
      return;
    }

    if (!agentApiKey()) {
      addAgentMessage({
        role: "assistant",
        content:
          "I can't answer research questions yet — connect an OpenCode API key from the agent footer or Settings → Agent connection, then ask again. Local actions like setup drafts and screener rules work without a key.",
      });
      return;
    }

    setAgentBusy(true);
    const controller = beginAgentRequest();
    try {
      const response = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: agentApiKey(),
          model: agentModel(),
          prompt: text,
          context: compactContext(context()),
        }),
        signal: controller.signal,
      });
      const body = (await response.json()) as { text?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Request failed.");
      addAgentMessage({ role: "assistant", content: body.text ?? "The agent did not return a response." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        addAgentMessage({ role: "system", content: "Request cancelled." });
      } else {
        addAgentMessage({
          role: "assistant",
          content: "The agent connection failed. Check the OpenCode key in Settings and try again.",
          error: true,
          retryPrompt: text,
        });
      }
    } finally {
      setAgentBusy(false);
    }
  };

  return (
    <Show when={!agentHidden()}>
      <Show when={agentOpen()}>
        {/* Mobile scrim — desktop keeps the panel a floating, non-modal card. */}
        <div
          class="fixed inset-0 z-[44] bg-[var(--c-color-overlay-bg)] md:hidden"
          onClick={closeAgent}
          aria-hidden="true"
        />
        <AgentPanel
          page={context().page}
          prompt={prompt()}
          busy={agentBusy()}
          hasKey={!!agentApiKey()}
          model={agentModel()}
          textareaRef={el => (composerRef = el)}
          onPromptChange={setPrompt}
          onSubmit={submit}
          onStop={stopAgentRequest}
          onClose={closeAgent}
          onHide={hideAgentCompletely}
          onClear={clearAgentMessages}
        />
      </Show>

      <Show when={!agentOpen()}>
        <AgentLauncher busy={agentBusy()} onOpen={openAgent} ref={el => (launcherRef = el)} />
      </Show>
    </Show>
  );
}