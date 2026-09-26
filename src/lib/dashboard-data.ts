/**
 * Dashboard fixtures for the first product pass.
 *
 * Components consume the typed `dashboardData` object instead of importing
 * individual constants. A live adapter can later return the same shape from
 * an API without changing the dashboard component tree.
 */

import type { Direction, InvestmentSetup, SetupStatus } from "./investing-types";
export type { Direction, InvestmentSetup, SetupStatus } from "./investing-types";
export type SignalImpact = "bullish" | "bearish" | "mixed";
export type SignalCategory =
  | "macro"
  | "earnings"
  | "flow"
  | "technical"
  | "regulatory"
  | "on-chain";

export interface DashboardKpi {
  label: string;
  value: string;
  detail: string;
  change: number;
  spark: number[];
}

export interface MarketSnapshot {
  symbol: string;
  label: string;
  value: string;
  change: number;
}

export interface SignalEvent {
  id: string;
  headline: string;
  whyItMatters: string;
  category: SignalCategory;
  impact: SignalImpact;
  relevance: number;
  confidence: number;
  horizon: string;
  symbols: string[];
  sourceType: string;
  publishedAt: string;
  linkedSetupIds: string[];
}

export interface AgentSuggestion {
  label: string;
  prompt: string;
}

export interface DashboardData {
  asOf: string;
  kpis: DashboardKpi[];
  markets: MarketSnapshot[];
  setups: InvestmentSetup[];
  signals: SignalEvent[];
  agentSuggestions: AgentSuggestion[];
}

const spark = (...values: number[]) => values;

export const dashboardData: DashboardData = {
  asOf: "20 Sep 2026, 17:42 WIB",
  kpis: [
    {
      label: "Active setups",
      value: "12",
      detail: "5 ready, 7 in play",
      change: 9.1,
      spark: spark(4, 5, 5, 7, 6, 8, 8, 9, 11, 10, 12),
    },
    {
      label: "Win rate",
      value: "64.8%",
      detail: "35 wins / 19 losses",
      change: 4.6,
      spark: spark(56, 58, 57, 60, 61, 59, 63, 62, 64, 63, 65),
    },
    {
      label: "Net performance",
      value: "+18.6R",
      detail: "Last 90 days",
      change: 12.4,
      spark: spark(2, 4, 3, 7, 6, 9, 11, 10, 14, 16, 19),
    },
    {
      label: "Fear & Greed",
      value: "74",
      detail: "Greed · up from 52 last week",
      change: 42.3,
      spark: spark(52, 48, 55, 61, 65, 68, 74),
    },
  ],
  markets: [
    { symbol: "SPX", label: "S&P 500", value: "6,621.18", change: 0.42 },
    { symbol: "NDX", label: "Nasdaq 100", value: "24,318.72", change: 0.81 },
    { symbol: "BTC", label: "Bitcoin", value: "$109,482", change: 2.41 },
    { symbol: "DXY", label: "US Dollar", value: "97.14", change: -0.28 },
    { symbol: "US10Y", label: "US 10Y", value: "4.08%", change: 0.05 },
    { symbol: "VIX", label: "Volatility", value: "15.82", change: -3.12 },
  ],
  setups: [
    {
      id: "setup-nvda",
      symbol: "NVDA",
      name: "Nvidia",
      direction: "long",
      status: "ready",
      score: 92,
      thesis: "AI capex remains firm while price reclaims the 20-day range.",
      entry: "$176.20–178.00",
      invalidation: "$169.40",
      target: "$196.00",
      riskReward: "2.7R",
      catalyst: "GTC product update",
      updated: "12m ago",
    },
    {
      id: "setup-btc",
      symbol: "BTC",
      name: "Bitcoin",
      direction: "long",
      status: "active",
      score: 88,
      thesis: "Spot demand is absorbing supply above the prior weekly high.",
      entry: "$106.8K",
      invalidation: "$101.9K",
      target: "$121.0K",
      riskReward: "2.9R",
      catalyst: "ETF flow persistence",
      updated: "28m ago",
    },
    {
      id: "setup-tsla",
      symbol: "TSLA",
      name: "Tesla",
      direction: "short",
      status: "watching",
      score: 76,
      thesis: "Failed breakout meets a crowded options position into deliveries.",
      entry: "$428.00–432.00",
      invalidation: "$441.50",
      target: "$391.00",
      riskReward: "2.5R",
      catalyst: "Quarterly deliveries",
      updated: "1h ago",
    },
    {
      id: "setup-eth",
      symbol: "ETH",
      name: "Ethereum",
      direction: "long",
      status: "won",
      score: 84,
      thesis: "Relative strength improved after the staking queue normalized.",
      entry: "$3,780",
      invalidation: "$3,590",
      target: "$4,180",
      riskReward: "+2.1R",
      catalyst: "Network upgrade",
      updated: "Yesterday",
    },
    {
      id: "setup-xau",
      symbol: "XAU",
      name: "Gold",
      direction: "long",
      status: "lost",
      score: 69,
      thesis: "Real yields were expected to roll over after the inflation print.",
      entry: "$3,645",
      invalidation: "$3,598",
      target: "$3,740",
      riskReward: "-1.0R",
      catalyst: "US CPI",
      updated: "2d ago",
    },
  ],
  signals: [
    {
      id: "signal-1",
      headline: "Semiconductor momentum broadens before the next product cycle",
      whyItMatters: "Four of six tracked chip names now confirm the NVDA breakout. Breadth reduces single-name risk in the saved long setup.",
      category: "flow",
      impact: "bullish",
      relevance: 96,
      confidence: 88,
      horizon: "1–5 days",
      symbols: ["NVDA", "AVGO", "AMD"],
      sourceType: "Market breadth model",
      publishedAt: "9m ago",
      linkedSetupIds: ["setup-nvda"],
    },
    {
      id: "signal-2",
      headline: "Dollar weakness lifts risk assets, but yields remain sticky",
      whyItMatters: "The softer dollar helps BTC and gold. A firm 10-year yield limits conviction, so position size should stay below the full-risk tier.",
      category: "macro",
      impact: "mixed",
      relevance: 91,
      confidence: 82,
      horizon: "Today",
      symbols: ["BTC", "XAU", "DXY"],
      sourceType: "Macro calendar",
      publishedAt: "21m ago",
      linkedSetupIds: ["setup-btc", "setup-xau"],
    },
    {
      id: "signal-3",
      headline: "Large BTC spot bids persist above the weekly breakout level",
      whyItMatters: "Repeated absorption near $107K supports the active setup. A close below that area would weaken the flow signal.",
      category: "on-chain",
      impact: "bullish",
      relevance: 89,
      confidence: 79,
      horizon: "6–24 hours",
      symbols: ["BTC"],
      sourceType: "Exchange flow model",
      publishedAt: "34m ago",
      linkedSetupIds: ["setup-btc"],
    },
    {
      id: "signal-4",
      headline: "Options skew prices more downside protection into deliveries",
      whyItMatters: "Put demand agrees with the TSLA short thesis, but elevated implied volatility makes a late entry expensive.",
      category: "technical",
      impact: "bearish",
      relevance: 84,
      confidence: 75,
      horizon: "2–7 days",
      symbols: ["TSLA"],
      sourceType: "Options monitor",
      publishedAt: "52m ago",
      linkedSetupIds: ["setup-tsla"],
    },
  ],
  agentSuggestions: [
    {
      label: "Rank my setups",
      prompt: "Rank my saved setups by risk-adjusted quality and explain the top two.",
    },
    {
      label: "Check thesis drift",
      prompt: "What changed since I saved the NVDA thesis?",
    },
    {
      label: "Scan catalysts",
      prompt: "Which setups are exposed to this week's macro and earnings events?",
    },
  ],
};
