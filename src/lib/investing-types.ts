export type Direction = "long" | "short";
export type Currency = "USD" | "IDR";
export type SetupStatus =
  | "watching"
  | "ready"
  | "active"
  | "won"
  | "lost"
  | "canceled"
  | "expired";

export interface SetupLevels {
  currency: Currency;
  entryLow: number | null;
  entryHigh: number | null;
  stop: number | null;
  invalidation: number | null;
  target: number | null;
}

export interface SetupEvidence {
  id: string;
  kind: "supporting" | "opposing";
  title: string;
  note: string;
  sourceUrl?: string;
  capturedAt: string;
}

export interface ChartAnnotation {
  id: string;
  tool: "entry" | "line" | "fib";
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface SetupStatusEvent {
  id: string;
  from: SetupStatus | null;
  to: SetupStatus;
  at: string;
  note?: string;
}

export interface InvestmentSetup {
  id: string;
  symbol: string;
  name: string;
  direction: Direction;
  status: SetupStatus;
  score: number;
  thesis: string;
  entry: string;
  invalidation: string;
  target: string;
  riskReward: string;
  catalyst: string;
  updated: string;
}

export interface TradeFill {
  id: string;
  side: "entry" | "exit";
  executedAt: string;
  price: number;
  quantity: number;
  fee: number;
  feeCurrency: Currency;
}

export interface TradeReview {
  reviewedAt: string;
  followedThesis: boolean;
  respectedRisk: boolean;
  worked: string;
  failed: string;
  lesson: string;
}

export interface TradeRecord {
  id: string;
  setupId: string | null;
  legacyUnlinked?: boolean;
  symbol: string;
  universe: "us" | "crypto" | "ihsg";
  direction: Direction;
  currency: Currency;
  strategy: string;
  status: "open" | "closed";
  initialRiskAmount: number;
  plannedStop: number | null;
  fills: TradeFill[];
  exitReason: string;
  notes: string;
  screenshotDataUrl?: string;
  screenshotName?: string;
  review?: TradeReview;
  createdAt: string;
  updatedAt: string;
}
