import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";

export type AgentModel = "gpt-6-astra" | "gpt-5.6-terra" | "gpt-5.6-luna" | "claude-sonnet-4-6" | "gemini-3.8-flash";

export type AgentActionKind = "create_setup_draft" | "create_screener" | "capabilities";

export interface AgentLink {
  href: string;
  label: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  /** Local action this assistant message performed, for rendering an action card. */
  action?: AgentActionKind;
  /** Destination for the action card's primary button. */
  link?: AgentLink;
  /** True when the assistant message is an error worth retrying. */
  error?: boolean;
  /** The prompt to resend when the user hits Retry. */
  retryPrompt?: string;
}

const STORAGE_KEY = "ios-agent-messages";
const HIDDEN_KEY = "ios-agent-hidden";
const MAX_MESSAGES = 100;

/** The in-flight relay request, so Stop can abort it. */
let activeController: AbortController | null = null;

const [messages, setMessages] = createSignal<AgentMessage[]>([]);
const [open, setOpen] = createSignal(false);
/** True when the viewer hid the AI completely — launcher and panel both stay unmounted. */
const [hidden, setHidden] = createSignal(false);
const [busy, setBusy] = createSignal(false);
const [apiKey, setApiKeySignal] = createSignal("");
const [model, setModel] = createSignal<AgentModel>("gpt-5.6-terra");

export const agentMessages = messages;
export const agentOpen = open;
export const agentHidden = hidden;
export const agentBusy = busy;
export const agentApiKey = apiKey;
export const agentModel = model;

export function toggleAgent(): void {
  if (hidden()) {
    revealAgent();
    return;
  }
  setOpen(value => !value);
}

export function openAgent(): void {
  if (hidden()) setHidden(false);
  setOpen(true);
  try {
    localStorage.removeItem(HIDDEN_KEY);
  } catch {
    /* private window — the in-memory state still applied */
  }
}

export function closeAgent(): void {
  setOpen(false);
}

/** Hide the AI completely: closes the panel and unmounts the launcher too. */
export function hideAgentCompletely(): void {
  setOpen(false);
  setHidden(true);
  try {
    localStorage.setItem(HIDDEN_KEY, "1");
  } catch {
    /* private window — the in-memory state still applied */
  }
}

/** Bring the AI back after a complete hide. Reopens the chat panel. */
export function revealAgent(): void {
  setHidden(false);
  setOpen(true);
  try {
    localStorage.removeItem(HIDDEN_KEY);
  } catch {
    /* private window — the in-memory state still applied */
  }
}

export function setAgentBusy(value: boolean): void {
  if (!value) activeController = null;
  setBusy(value);
}

/** Register a new relay request; the returned signal aborts the fetch. */
export function beginAgentRequest(): AbortController {
  activeController = new AbortController();
  return activeController;
}

/** Abort whatever relay request is in flight. */
export function stopAgentRequest(): void {
  activeController?.abort();
  activeController = null;
}

export function setAgentApiKey(value: string): void {
  setApiKeySignal(value.trim());
}

export function clearAgentApiKey(): void {
  setApiKeySignal("");
}

export function setAgentModel(value: AgentModel): void {
  setModel(value);
}

export function addAgentMessage(message: Omit<AgentMessage, "id" | "createdAt">): void {
  setMessages(current => [
    ...current,
    { ...message, id: crypto.randomUUID?.() ?? `${Date.now()}-${current.length}`, createdAt: Date.now() },
  ].slice(-MAX_MESSAGES));
}

export function clearAgentMessages(): void {
  setMessages([]);
}

function isAgentMessage(value: unknown): value is AgentMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    (item.role === "user" || item.role === "assistant" || item.role === "system") &&
    typeof item.content === "string" &&
    typeof item.createdAt === "number"
  );
}

/**
 * Session-scoped thread persistence: survives reloads within a tab session,
 * never crosses sessions, and never touches the API key. Call once from the
 * agent shell's onMount.
 */
export function initAgentPersistence(): void {
  if (isServer) return;
  try {
    if (localStorage.getItem(HIDDEN_KEY) === "1") {
      setHidden(true);
      setOpen(false);
    }
  } catch {
    /* blocked storage — start visible */
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) setMessages(parsed.filter(isAgentMessage));
    }
  } catch {
    /* corrupted or blocked storage — start with an empty thread */
  }
  createEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages().slice(-MAX_MESSAGES)));
    } catch {
      /* private tab — in-memory thread stays usable */
    }
  });
}