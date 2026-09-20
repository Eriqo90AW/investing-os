import type { AgentPage } from "~/lib/agent/context";

/**
 * Route-aware one-click prompts for the agent's empty state. The phrasings are
 * deliberately shaped to hit the local-action intents in actions.ts, so every
 * dashboard/setups/screener chip works with no API key connected.
 */
export function suggestionsFor(page: AgentPage): string[] {
  switch (page) {
    case "dashboard":
      return [
        "Summarize the market regime",
        "What setups are ready?",
        "Add new setup",
        "Create a momentum screener",
      ];
    case "setups":
      return ["Add new setup NVDA", "Create an oversold screener", "What should a thesis include?"];
    case "screener":
      return [
        "Create a quality leaders screen",
        "Create an oversold reversal screen",
        "Explain the quant score",
      ];
    default:
      return ["What can you do?", "Add new setup"];
  }
}