import { createSignal } from "solid-js";

export type AgentModel = "gpt-6-astra" | "gpt-5.6-terra" | "gpt-5.6-luna" | "claude-sonnet-4-6" | "gemini-3.8-flash";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  action?: string;
}

const [messages, setMessages] = createSignal<AgentMessage[]>([]);
const [open, setOpen] = createSignal(false);
const [busy, setBusy] = createSignal(false);
const [apiKey, setApiKeySignal] = createSignal("");
const [model, setModel] = createSignal<AgentModel>("gpt-5.6-terra");

export const agentMessages = messages;
export const agentOpen = open;
export const agentBusy = busy;
export const agentApiKey = apiKey;
export const agentModel = model;

export function toggleAgent(): void {
  setOpen(value => !value);
}

export function openAgent(): void {
  setOpen(true);
}

export function closeAgent(): void {
  setOpen(false);
}

export function setAgentBusy(value: boolean): void {
  setBusy(value);
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
  ]);
}

export function clearAgentMessages(): void {
  setMessages([]);
}
