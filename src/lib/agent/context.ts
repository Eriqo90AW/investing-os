import { dashboardData } from "~/lib/dashboard-data";
import { setups } from "~/lib/setups-store";
import { trades } from "~/lib/trades-store";
import { dividendWorkspace, dividendStore } from "~/lib/dividends/store";

export type AgentPage = "dashboard" | "setups" | "journal" | "review" | "screener" | "dividends" | "unknown";

export interface AgentContext {
  schemaVersion: 1;
  page: AgentPage;
  route: string;
  source: "fixture" | "user-input" | "mixed";
  asOf?: string;
  visible: Record<string, unknown>;
}

export function pageForPath(path: string): AgentPage {
  if (path === "/" || path === "") return "dashboard";
  if (path.startsWith("/setups")) return "setups";
  if (path.startsWith("/journal")) return "journal";
  if (path.startsWith("/review")) return "review";
  if (path.startsWith("/screener")) return "screener";
  if (path.startsWith("/dividends")) return "dividends";
  return "unknown";
}

export function buildAgentContext(path: string): AgentContext {
  const page = pageForPath(path);
  if (page === "dashboard") {
    return {
      schemaVersion: 1,
      page,
      route: path,
      source: "fixture",
      asOf: dashboardData.asOf,
      visible: {
        kpis: dashboardData.kpis,
        markets: dashboardData.markets,
        setups: setups().slice(0, 8),
        signals: dashboardData.signals,
      },
    };
  }
  if (page === "setups") {
    return {
      schemaVersion: 1,
      page,
      route: path,
      source: "fixture",
      asOf: dashboardData.asOf,
      visible: { setupCount: setups().length, setups: setups() },
    };
  }
  if (page === "journal" || page === "review") {
    return {
      schemaVersion: 1,
      page,
      route: path,
      source: "fixture",
      asOf: dashboardData.asOf,
      visible: {
        tradeCount: trades().length,
        trades: trades().map(trade => ({ id: trade.id, setupId: trade.setupId, symbol: trade.symbol, status: trade.status, reviewed: !!trade.review, strategy: trade.strategy })),
      },
    };
  }
  if (page === "dividends") {
    return {
      schemaVersion: 1, page, route: path, source: "mixed", asOf: dashboardData.asOf,
      visible: {
        dataProvenance: "Demo dividend events, dates, and assumed prices are invented. Manual events are user-entered. The planner has no live market or corporate-action feed.",
        scenarioMethod: "Editable downside, base, and upside cases model an ex-date price drop as a dividend multiple, then interpolate linearly toward the assumed purchase price over exchange sessions. These paths are assumptions, not forecasts.",
        illustrativeDefaults: { downside: "1.25 times the dividend drop, no recovery", base: "1 times the dividend drop, 20-session recovery", upside: "0.75 times the dividend drop, 10-session recovery" },
        plannerMethod: "Whole 100-share lots, explicit fees, slippage and dividend tax, T+2 regular-market settlement, separately tracked unsettled sales and dividend receivables, and no win probabilities.",
        suggestions: "The app retains the best 100 chains at each search step. Suggestions are the best chains found, not guaranteed optima. No automatic orders are placed.",
        contextPrivacy: "This assistant summary omits user-entered capital, event records, detailed settings, and selected chains.",
      },
    };
  }
  return {
    schemaVersion: 1,
    page,
    route: path,
    source: "fixture",
    asOf: dashboardData.asOf,
    visible: { screeners: "Built-in quant presets", universes: ["us", "crypto", "ihsg"] },
  };
}

export function compactContext(context: AgentContext): string {
  return JSON.stringify(context);
}




