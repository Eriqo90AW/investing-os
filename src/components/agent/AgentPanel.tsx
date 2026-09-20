import { For, Show, createEffect } from "solid-js";
import { Bot, Eraser, EyeOff, KeyRound, Sparkles, X } from "lucide-solid";
import type { AgentPage } from "~/lib/agent/context";
import { agentBusy, agentMessages } from "~/lib/agent/store";
import { openSettings } from "~/lib/settings-store";
import { AgentComposer } from "./AgentComposer";
import { AgentMessage } from "./AgentMessage";
import { suggestionsFor } from "./suggestions";

interface AgentPanelProps {
  page: AgentPage;
  prompt: string;
  busy: boolean;
  hasKey: boolean;
  model: string;
  textareaRef?: (el: HTMLTextAreaElement) => void;
  onPromptChange: (value: string) => void;
  onSubmit: (value?: string) => void;
  onStop: () => void;
  onClose: () => void;
  onHide: () => void;
  onClear: () => void;
}

function pageLabel(page: AgentPage): string {
  if (page === "unknown") return "Current page";
  return page.charAt(0).toUpperCase() + page.slice(1);
}

/**
 * The open conversation panel. Bottom sheet on mobile (with a scrim behind
 * it, rendered by the shell), floating panel bottom-right on desktop. All
 * surfaces are token-driven, so every theme × palette × accent combination
 * is correct with no per-theme styles.
 */
export function AgentPanel(props: AgentPanelProps) {
  let listRef: HTMLDivElement | undefined;

  // Keep the newest message in view as the thread grows.
  createEffect(() => {
    agentMessages().length;
    agentBusy();
    listRef?.scrollTo({ top: listRef.scrollHeight });
  });

  return (
    <div
      id="agent-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Investing OS Agent"
      class="agent-panel fixed bottom-200 right-200 z-[45] flex max-h-[min(640px,calc(100dvh-140px))] min-h-[min(420px,calc(100dvh-140px))] w-[min(calc(100vw-2rem),440px)] flex-col overflow-hidden rounded-300 border border-line bg-surface-1 shadow-overlay max-md:inset-x-100 max-md:bottom-100 max-md:max-h-[78dvh] max-md:min-h-[60dvh] max-md:w-auto"
    >
      {/* ---- Header ---- */}
      <header class="flex shrink-0 items-center gap-150 border-b border-line px-200 py-150">
        <span class="grid size-8 shrink-0 place-items-center rounded-100 bg-accent-fill text-on-accent">
          <Bot size={16} />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="truncate text-100 font-700 leading-none text-ink">Investing OS Agent</h2>
          <p class="mt-50 flex items-center gap-50 text-50 text-muted">
            <span
              class="size-1.5 shrink-0 rounded-full"
              classList={{ "bg-accent": props.hasKey, "bg-caption": !props.hasKey }}
              aria-hidden="true"
            />
            <span class="truncate">{props.hasKey ? props.model : "Local mode · actions only"}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={props.onClear}
          class="grid size-8 shrink-0 place-items-center rounded-100 text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <Eraser size={14} />
        </button>
        <button
          type="button"
          onClick={props.onClose}
          class="grid size-8 shrink-0 place-items-center rounded-100 text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
          aria-label="Close agent"
          title="Close agent"
        >
          <X size={15} />
        </button>
        <button
          type="button"
          onClick={props.onHide}
          class="grid size-8 shrink-0 place-items-center rounded-100 text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
          aria-label="Hide AI completely"
          title="Hide AI completely — reopen it from the Ask AI button in the navbar"
        >
          <EyeOff size={15} />
        </button>
      </header>

      {/* ---- Thread ---- */}
      <div ref={listRef} role="log" aria-live="polite" class="agent-scroll min-h-0 flex-1 overflow-y-auto px-200 py-150">
        <div class="flex h-full flex-col gap-200">
          <Show when={agentMessages().length === 0 && !props.busy}>
            <div class="flex flex-col items-center px-100 py-200 text-center">
              <span class="grid size-10 shrink-0 place-items-center rounded-200 bg-official-bg text-accent">
                <Sparkles size={18} />
              </span>
              <h3 class="mt-150 text-200 font-700 tracking-[-.01em] text-ink">Your research copilot</h3>
              <p class="mt-50 max-w-[34ch] text-75 leading-[150%] text-muted">
                Ask about this page, or tap a suggestion. Setup drafts and screener rules work instantly — no API key needed.
              </p>
              <div class="mt-200 flex flex-wrap items-center justify-center gap-100">
                <For each={suggestionsFor(props.page)}>
                  {suggestion => (
                    <button
                      type="button"
                      onClick={() => props.onSubmit(suggestion)}
                      class="rounded-100 border border-line bg-surface-2 px-150 py-75 text-75 font-600 text-muted transition-colors hover:border-hairline hover:text-ink cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <For each={agentMessages()}>
            {message => <AgentMessage message={message} onRetry={prompt => props.onSubmit(prompt)} />}
          </For>

          {/* Typing indicator while a relay request is in flight. */}
          <Show when={props.busy}>
            <div class="flex items-start gap-100">
              <span class="mt-[2px] grid size-6 shrink-0 place-items-center rounded-100 bg-accent-fill text-on-accent" aria-hidden="true">
                <Bot size={13} />
              </span>
              <div class="flex items-center gap-50 rounded-200 rounded-bl-50 border border-line bg-surface-2 px-150 py-100">
                <span class="agent-typing-dot size-1.5 rounded-full bg-muted" aria-hidden="true" />
                <span class="agent-typing-dot size-1.5 rounded-full bg-muted" aria-hidden="true" />
                <span class="agent-typing-dot size-1.5 rounded-full bg-muted" aria-hidden="true" />
                <span class="sr-only">Agent is thinking</span>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* ---- Composer ---- */}
      <AgentComposer
        value={props.prompt}
        busy={props.busy}
        textareaRef={props.textareaRef}
        onInput={props.onPromptChange}
        onSubmit={() => props.onSubmit()}
        onStop={props.onStop}
      />

      {/* ---- Footer ---- */}
      <footer class="flex shrink-0 items-center justify-between gap-100 border-t border-line px-200 py-75">
        <span class="inline-flex min-w-0 items-center gap-50 text-50 text-caption">
          <Sparkles size={11} class="shrink-0 text-accent" />
          <span class="truncate">Context: {pageLabel(props.page)}</span>
        </span>
        <span class="flex shrink-0 items-center gap-150">
          <Show when={!props.hasKey}>
            <button
              type="button"
              onClick={() => {
                openSettings();
                props.onClose();
              }}
              class="inline-flex items-center gap-50 text-50 font-700 text-accent transition-colors hover:underline cursor-pointer"
            >
              <KeyRound size={11} /> Connect key
            </button>
          </Show>
          <span class="text-50 text-caption" title="Keyboard shortcut">
            Ctrl+Enter
          </span>
        </span>
      </footer>
    </div>
  );
}