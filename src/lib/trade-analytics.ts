import type { TradeFill, TradeRecord } from "./investing-types";

export interface TradeResult {
  trade: TradeRecord;
  entryQuantity: number;
  exitQuantity: number;
  averageEntry: number;
  averageExit: number;
  fees: number;
  realizedPnl: number;
  realizedR: number | null;
  holdingHours: number | null;
}

function weightedAverage(fills: TradeFill[]): number {
  const quantity = fills.reduce((sum, fill) => sum + fill.quantity, 0);
  return quantity > 0
    ? fills.reduce((sum, fill) => sum + fill.price * fill.quantity, 0) / quantity
    : 0;
}

export function resultForTrade(trade: TradeRecord): TradeResult {
  const entries = trade.fills.filter(fill => fill.side === "entry");
  const exits = trade.fills.filter(fill => fill.side === "exit");
  const entryQuantity = entries.reduce((sum, fill) => sum + fill.quantity, 0);
  const exitQuantity = exits.reduce((sum, fill) => sum + fill.quantity, 0);
  const averageEntry = weightedAverage(entries);
  const averageExit = weightedAverage(exits);
  const matchedQuantity = Math.min(entryQuantity, exitQuantity);
  const gross = trade.direction === "long"
    ? (averageExit - averageEntry) * matchedQuantity
    : (averageEntry - averageExit) * matchedQuantity;
  const fees = trade.fills.reduce((sum, fill) => sum + fill.fee, 0);
  const realizedPnl = gross - fees;
  const firstEntry = entries.map(fill => Date.parse(fill.executedAt)).filter(Number.isFinite).sort()[0];
  const finalExit = exits.map(fill => Date.parse(fill.executedAt)).filter(Number.isFinite).sort((a, b) => b - a)[0];
  return {
    trade,
    entryQuantity,
    exitQuantity,
    averageEntry,
    averageExit,
    fees,
    realizedPnl,
    realizedR: trade.initialRiskAmount > 0 ? realizedPnl / trade.initialRiskAmount : null,
    holdingHours: firstEntry !== undefined && finalExit !== undefined
      ? Math.max(0, finalExit - firstEntry) / 3_600_000
      : null,
  };
}

export interface TradeSummary {
  sampleSize: number;
  wins: number;
  losses: number;
  winRate: number | null;
  totalR: number;
  averageWinR: number | null;
  averageLossR: number | null;
  expectancyR: number | null;
  maxDrawdownR: number;
}

export function summarizeTrades(trades: TradeRecord[]): TradeSummary {
  const results = trades.filter(trade => trade.status === "closed").map(resultForTrade);
  const withR = results.filter(result => result.realizedR !== null);
  const wins = withR.filter(result => (result.realizedR ?? 0) > 0);
  const losses = withR.filter(result => (result.realizedR ?? 0) <= 0);
  const totalR = withR.reduce((sum, result) => sum + (result.realizedR ?? 0), 0);
  let peak = 0;
  let equity = 0;
  let maxDrawdownR = 0;
  for (const result of [...withR].sort((a, b) => Date.parse(a.trade.updatedAt) - Date.parse(b.trade.updatedAt))) {
    equity += result.realizedR ?? 0;
    peak = Math.max(peak, equity);
    maxDrawdownR = Math.min(maxDrawdownR, equity - peak);
  }
  const average = (values: TradeResult[]) => values.length
    ? values.reduce((sum, result) => sum + (result.realizedR ?? 0), 0) / values.length
    : null;
  return {
    sampleSize: withR.length,
    wins: wins.length,
    losses: losses.length,
    winRate: withR.length ? wins.length / withR.length * 100 : null,
    totalR,
    averageWinR: average(wins),
    averageLossR: average(losses),
    expectancyR: withR.length ? totalR / withR.length : null,
    maxDrawdownR,
  };
}
