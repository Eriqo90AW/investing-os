import { addSetup, buildDraftSetup, newSetupId } from "~/lib/setups-store";
import { addAgentMessage } from "./store";
import { addSavedScreen, screenFromPrompt } from "~/lib/screener-store";

export interface LocalActionResult {
  handled: boolean;
  summary?: string;
  action?: string;
}

function extractTicker(prompt: string): string {
  const words = prompt.toUpperCase().match(/\b[A-Z]{2,6}\b/g) ?? [];
  return words.find(word => !["ADD", "NEW", "SETUP", "CREATE", "THE", "FOR", "A", "AN", "LONG", "SHORT"].includes(word)) ?? "";
}

/** Handles deterministic, reversible UI actions before a model is needed. */
export function runLocalAgentAction(prompt: string): LocalActionResult {
  const normalized = prompt.toLowerCase();
  if (/(screener|screening|screen)/.test(normalized) && /(create|make|build|new|best)/.test(normalized)) {
    const screen = screenFromPrompt(prompt);
    addSavedScreen(screen);
    const summary = `Saved ${screen.name}. It is ready to activate on the Screener page.`;
    addAgentMessage({ role: "assistant", content: summary, action: "create_screener" });
    return { handled: true, summary, action: "create_screener" };
  }
  if (!/(add|create|new)\s+(a\s+)?(new\s+)?setup/.test(normalized)) return { handled: false };

  const ticker = extractTicker(prompt);
  const draft = buildDraftSetup(ticker);
  addSetup({ ...draft, id: newSetupId(ticker || "draft") });
  const summary = ticker ? `Created a draft setup for ${ticker}. Open Setups to fill in the thesis and levels.` : "Created a blank setup draft. Open Setups to choose an instrument and add the trade plan.";
  addAgentMessage({ role: "assistant", content: summary, action: "create_setup_draft" });
  return { handled: true, summary, action: "create_setup_draft" };
}
