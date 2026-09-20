import { dashboardData } from "~/lib/dashboard-data";
import { setups } from "~/lib/setups-store";

export type AgentPage = "dashboard" | "setups" | "screener" | "unknown";

export interface AgentContext {
  schemaVersion: 1;
  page: AgentPage;
  route: string;
  source: "fixture";
  asOf?: string;
  visible: Record<string, unknown>;
}

export function pageForPath(path: string): AgentPage {
  if (path === "/" || path === "") return "dashboard";
  if (path.startsWith("/setups")) return "setups";
  if (path.startsWith("/screener")) return "screener";
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
