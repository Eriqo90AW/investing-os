import { addSetup, buildDraftSetup, newSetupId } from "~/lib/setups-store";
import { addAgentMessage, type AgentActionKind } from "./store";
import { addSavedScreen, screenFromPrompt } from "~/lib/screener-store";

export interface LocalActionResult {
  handled: boolean;
  summary?: string;
  action?: AgentActionKind;
  /** Route to navigate to once the action is applied. */
  navigate?: string;
}

function extractTicker(prompt: string): string {
  const words = prompt.toUpperCase().match(/\b[A-Z]{2,6}\b/g) ?? [];
  return words.find(word => !["ADD", "NEW", "SETUP", "CREATE", "THE", "FOR", "A", "AN", "LONG", "SHORT"].includes(word)) ?? "";
}

/** Handles deterministic, reversible UI actions before a model is needed. */
export function runLocalAgentAction(prompt: string): LocalActionResult {
  const normalized = prompt.toLowerCase();

  if (/\b(what can you do|capabilities|help)\b/.test(normalized)) {
    const content =
      "I work from this page without an API key:\n\n" +
      "- **Create a setup draft** — say “Add new setup NVDA”\n" +
      "- **Build a saved screener** — say “Create an oversold screener”\n" +
      "- **Navigate the workspace** — say “Open the screener”\n\n" +
      "With an OpenCode key connected in Settings, I can also answer research questions about the markets on screen.";
    addAgentMessage({ role: "assistant", content, action: "capabilities" });
    return { handled: true, summary: content, action: "capabilities" };
  }

  const navMatch = normalized.match(/^(go to|open|show|navigate to)\b.*?(dashboard|overview|home|setups?|screener)/);
  if (navMatch) {
    const place = navMatch[2] ?? "";
    const href = /screener/.test(place) ? "/screener" : /setup/.test(place) ? "/setups" : "/";
    const label = href === "/screener" ? "the screener" : href === "/setups" ? "the setup workspace" : "the overview";
    addAgentMessage({ role: "assistant", content: `Opened ${label}.` });
    return { handled: true, navigate: href };
  }

  if (/(screener|screening|screen)/.test(normalized) && /(create|make|build|new|best)/.test(normalized)) {
    const screen = screenFromPrompt(prompt);
    addSavedScreen(screen);
    const summary = `Saved ${screen.name}. It is ready to activate on the Screener page.`;
    addAgentMessage({
      role: "assistant",
      content: summary,
      action: "create_screener",
      link: { href: "/screener", label: "Open Screener" },
    });
    return { handled: true, summary, action: "create_screener" };
  }

  if (!/(add|create|new)\s+(a\s+)?(new\s+)?setup/.test(normalized)) return { handled: false };

  const ticker = extractTicker(prompt);
  const draft = buildDraftSetup(ticker);
  addSetup({ ...draft, id: newSetupId(ticker || "draft") });
  const summary = ticker
    ? `Created a draft setup for ${ticker}. Open Setups to fill in the thesis and levels.`
    : "Created a blank setup draft. Open Setups to choose an instrument and add the trade plan.";
  addAgentMessage({
    role: "assistant",
    content: summary,
    action: "create_setup_draft",
    link: { href: "/setups", label: "Open Setups" },
  });
  return { handled: true, summary, action: "create_setup_draft" };
}