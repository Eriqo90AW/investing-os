export type CalendarDate = string;
export type Strategy = "ex-date" | "recovery";
export type ScenarioName = "downside" | "base" | "upside";
export interface PriceAssumption { dropMultiple: number; recoverySessions: number | null; }
export interface ScenarioAssumption extends PriceAssumption { overrides: Record<string, PriceAssumption>; }
export interface CalendarYear { year: number; holidays: CalendarDate[]; source: string; }
export interface DividendEvent {
  id: string; ticker: string; dividendPerShare: number; cumDate: CalendarDate; exDate: CalendarDate;
  recordingDate: CalendarDate; paymentDate: CalendarDate; purchasePrice: number; sourceNotes: string;
  provenance: "demo" | "manual"; excluded: boolean;
}
export interface PlannerInputs {
  capital: number | null; startDate: CalendarDate; endDate: CalendarDate;
  buyFee: number | null; sellFee: number | null; slippage: number | null; dividendTax: number | null;
  maxHoldingSessions: number; scenarios: Record<ScenarioName, ScenarioAssumption>; calendars: CalendarYear[];
}
export interface ChainTrade { eventId: string; purchaseDate: CalendarDate; }
export interface CashLedgerEntry {
  date: CalendarDate; phase: "open" | "close"; eventId: string;
  kind: "opening" | "purchase" | "entitlement" | "sale" | "settlement" | "dividend";
  cash: number; unsettledSales: number; dividendReceivables: number;
}
export interface ExecutedTrade extends ChainTrade {
  status: "completed"; ticker: string; saleDate: CalendarDate; settlementDate: CalendarDate; paymentDate: CalendarDate;
  lots: number; shares: number; purchasePrice: number; salePrice: number; grossPurchase: number;
  buyCost: number; buyFee: number; sellFee: number; netSale: number; grossDividend: number; dividendTax: number;
  netDividend: number; netProfit: number; breakEvenSalePrice: number; exitReason: string;
}
export interface SkippedTrade extends ChainTrade { status: "skipped"; ticker: string; reason: string; }
export interface ScenarioResult {
  strategy: Strategy; scenario: ScenarioName; trades: (ExecutedTrade | SkippedTrade)[]; ledger: CashLedgerEntry[];
  netProfit: number; returnOnCapital: number; completedCycles: number; availableCash: number;
  unsettledSales: number; dividendReceivables: number; endingWealth: number;
}
export interface ChainSuggestion { chain: ChainTrade[]; result: ScenarioResult; }
export interface DividendWorkspace {
  events: DividendEvent[]; inputs: PlannerInputs; selected: Record<Strategy, ChainTrade[] | null>;
}
export interface DividendStore {
  version: 1; mode: "demo" | "manual"; demo: DividendWorkspace; manual: DividendWorkspace;
}


