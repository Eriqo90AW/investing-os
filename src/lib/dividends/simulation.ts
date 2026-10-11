import { createCalendar, type ExchangeCalendar } from "./calendar.js";
import { validateInputs } from "./assumptions.js";
import type { ChainTrade, DividendEvent, ExecutedTrade, PlannerInputs, ScenarioName, ScenarioResult, SkippedTrade, Strategy } from "./types.js";

export interface SimulationOptions { chain: ChainTrade[]; events: DividendEvent[]; inputs: PlannerInputs; strategy: Strategy; scenario: ScenarioName; }

const LOT_SIZE = 100;
const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

export function simulateChain(options: SimulationOptions): ScenarioResult {
  const { chain, events, inputs, strategy, scenario } = options;
  validateInputs(inputs);
  const startingCapital = inputs.capital;
  if (startingCapital === null) throw new Error("Enter starting capital before calculating.");
  const calendar = createCalendar(inputs.calendars);
  const sessions = calendar.sessions(inputs.startDate, inputs.endDate);
  const sessionIndex = new Map(sessions.map((date, index) => [date, index]));
  const eventMap = new Map(events.map(event => [event.id, event]));
  const ordered = [...chain].sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate) || (eventMap.get(a.eventId)?.ticker ?? "").localeCompare(eventMap.get(b.eventId)?.ticker ?? ""));
  let cash = startingCapital;
  let unsettledSales = 0;
  let dividendReceivables = 0;
  let netProfit = 0;
  const ledger: ScenarioResult["ledger"] = [];
  ledger.push({ date: inputs.startDate, phase: "open", eventId: "", kind: "opening", cash: startingCapital, unsettledSales: 0, dividendReceivables: 0 });
  const trades: (ExecutedTrade | SkippedTrade)[] = [];
  const eligible = events.filter(event => !event.excluded);
  let previousSaleDate = "";
  const releasedSales = new Set<string>();
  const releasedDividends = new Set<string>();

  for (const selection of ordered) {
    const event = eventMap.get(selection.eventId);
    if (!event) { trades.push({ ...selection, status: "skipped", ticker: selection.eventId, reason: "Dividend event no longer exists." }); continue; }
    if (event.excluded) { trades.push({ ...selection, status: "skipped", ticker: event.ticker, reason: "This dividend event is excluded." }); continue; }
    const purchaseDate = selection.purchaseDate || event.cumDate;
    const reason = validateSelection(event, purchaseDate, inputs, calendar, sessionIndex, previousSaleDate);
    if (reason) { trades.push({ ...selection, status: "skipped", ticker: event.ticker, reason }); continue; }

    const buyIndex = sessionIndex.get(purchaseDate)!;
    // A receipt settles at day-end and can fund a buy from the following exchange session.
    for (const prior of trades) {
      if (prior.status !== "completed") continue;
      if (!releasedSales.has(prior.eventId) && prior.settlementDate < purchaseDate && calendar.nextSession(prior.settlementDate, 1) <= purchaseDate) { cash = roundMoney(cash + prior.netSale); releasedSales.add(prior.eventId); }
      if (!releasedDividends.has(prior.eventId) && prior.paymentDate < purchaseDate && calendar.nextSession(prior.paymentDate, 1) <= purchaseDate) { cash = roundMoney(cash + prior.netDividend); releasedDividends.add(prior.eventId); }
    }
    const buyAssumption = inputs.slippage ?? 0;
    const purchasePrice = roundMoney(event.purchasePrice * (1 + buyAssumption));
    const perLotCost = purchasePrice * LOT_SIZE * (1 + inputs.buyFee!);
    const lots = Math.floor((cash + 1e-7) / perLotCost);
    if (lots < 1) { trades.push({ ...selection, purchaseDate, status: "skipped", ticker: event.ticker, reason: "Insufficient available cash for one 100-share lot, including buy costs." }); continue; }
    const shares = lots * LOT_SIZE;
    const grossPurchase = roundMoney(shares * purchasePrice);
    const buyFee = roundMoney(grossPurchase * inputs.buyFee!);
    const buyCost = roundMoney(grossPurchase + buyFee);
    cash = roundMoney(cash - buyCost);
    ledger.push({ date: purchaseDate, phase: "open", eventId: event.id, kind: "purchase", cash: -buyCost, unsettledSales: 0, dividendReceivables: 0 });

    const salePlan = modelSale(event, purchasePrice, buyIndex, strategy, inputs, scenario, sessions);
    const saleDate = salePlan.date;
    const salePrice = roundMoney(Math.max(0, salePlan.price * (1 - buyAssumption)));
    const grossSale = roundMoney(shares * salePrice);
    const sellFee = roundMoney(grossSale * inputs.sellFee!);
    const netSale = roundMoney(grossSale - sellFee);
    const settlementDate = calendar.nextSession(saleDate, 2);
    calendar.assertCovered(settlementDate);
    const grossDividend = roundMoney(shares * event.dividendPerShare);
    const dividendTax = roundMoney(grossDividend * inputs.dividendTax!);
    const netDividend = roundMoney(grossDividend - dividendTax);
    const tradeProfit = roundMoney(netSale - buyCost + netDividend);
    netProfit = roundMoney(netProfit + tradeProfit);
    unsettledSales = roundMoney(unsettledSales + netSale);
    dividendReceivables = roundMoney(dividendReceivables + netDividend);
    ledger.push({ date: saleDate, phase: "close", eventId: event.id, kind: "sale", cash: 0, unsettledSales: netSale, dividendReceivables: 0 });
    ledger.push({ date: event.exDate, phase: "close", eventId: event.id, kind: "entitlement", cash: 0, unsettledSales: 0, dividendReceivables: netDividend });

    const breakEvenSalePrice = (buyCost - netDividend) / (shares * (1 - inputs.sellFee!));
    trades.push({ ...selection, purchaseDate, status: "completed", ticker: event.ticker, saleDate, settlementDate, paymentDate: event.paymentDate, lots, shares, purchasePrice, salePrice, grossPurchase, buyCost, buyFee, sellFee, netSale, grossDividend, dividendTax, netDividend, netProfit: tradeProfit, breakEvenSalePrice: roundMoney(breakEvenSalePrice), exitReason: salePlan.reason });
    previousSaleDate = saleDate;
  }

  // Project all cash movements through the planning end. Receipts land at day-end and
  // become available at the next exchange session, so they cannot fund same-day trades.
  for (const date of sessions) {
    for (const trade of trades) {
      if (trade.status !== "completed") continue;
      if (trade.settlementDate === date) {
        cash = roundMoney(cash + trade.netSale);
        unsettledSales = roundMoney(unsettledSales - trade.netSale);
        ledger.push({ date, phase: "close", eventId: trade.eventId, kind: "settlement", cash: trade.netSale, unsettledSales: -trade.netSale, dividendReceivables: 0 });
      }

    }
  }
  const completed = trades.filter((trade): trade is ExecutedTrade => trade.status === "completed");
  for (const trade of completed) if (trade.paymentDate <= inputs.endDate) ledger.push({ date: trade.paymentDate, phase: "close", eventId: trade.eventId, kind: "dividend", cash: trade.netDividend, unsettledSales: 0, dividendReceivables: -trade.netDividend });
  const pendingSale = completed.filter(trade => trade.settlementDate > inputs.endDate).reduce((sum, trade) => sum + trade.netSale, 0);
  const pendingDividends = completed.filter(trade => trade.paymentDate > inputs.endDate).reduce((sum, trade) => sum + trade.netDividend, 0);
  // Ending balances reflect receipts due by period end. Later-due receipts remain separate.
  const endingCash = roundMoney(startingCapital - completed.reduce((sum, trade) => sum + trade.buyCost, 0) + completed.filter(trade => trade.settlementDate <= inputs.endDate).reduce((sum, trade) => sum + trade.netSale, 0) + completed.filter(trade => trade.paymentDate <= inputs.endDate).reduce((sum, trade) => sum + trade.netDividend, 0));
  const heldOut = cash - endingCash;
  if (Math.abs(heldOut) > 0.01) cash = endingCash;
  unsettledSales = roundMoney(pendingSale);
  dividendReceivables = roundMoney(pendingDividends);
  const endingWealth = roundMoney(cash + unsettledSales + dividendReceivables);
  return {
    strategy, scenario, trades, ledger: ledger.sort((a, b) => a.date.localeCompare(b.date) || (a.phase === b.phase ? 0 : a.phase === "open" ? -1 : 1)), netProfit: roundMoney(endingWealth - startingCapital),
    returnOnCapital: (endingWealth - startingCapital) / startingCapital * 100,
    completedCycles: completed.length, availableCash: roundMoney(cash), unsettledSales, dividendReceivables, endingWealth,
  };
}

function validateSelection(event: DividendEvent, purchaseDate: string, inputs: PlannerInputs, calendar: ExchangeCalendar, sessionIndex: Map<string, number>, previousSaleDate: string): string | undefined {
  if (purchaseDate < inputs.startDate || purchaseDate > event.cumDate) return "Purchase date must be inside the planning period and on or before the regular-market cum-date.";
  if (!calendar.isSession(purchaseDate)) return "Purchase date must be an exchange session.";
  if (!sessionIndex.has(purchaseDate) || !sessionIndex.has(event.exDate)) return "Event dates must fall inside the planning period.";
  if (event.exDate < purchaseDate) return "The ex-date must be on or after the purchase date.";
  if (previousSaleDate && purchaseDate <= previousSaleDate) return "This purchase conflicts with the previous holding period.";
  if (sessionIndex.get(event.exDate)! - sessionIndex.get(purchaseDate)! > inputs.maxHoldingSessions) return "The maximum holding period ends before the ex-date. Increase the holding limit to earn this dividend.";
  return undefined;
}

function modelSale(event: DividendEvent, purchasePrice: number, buyIndex: number, strategy: Strategy, inputs: PlannerInputs, scenario: ScenarioName, sessions: string[]): { date: string; price: number; reason: string } {
  const assumption = inputs.scenarios[scenario];
  const stock = assumption.overrides[event.ticker] ?? assumption;
  const exIndex = sessions.indexOf(event.exDate);
  const exPrice = Math.max(0, purchasePrice - event.dividendPerShare * stock.dropMultiple);
  if (strategy === "ex-date") return { date: event.exDate, price: exPrice, reason: "Sold at modeled ex-date close." };
  const maxIndex = Math.min(sessions.length - 1, buyIndex + inputs.maxHoldingSessions, sessions.findIndex(date => date > inputs.endDate) < 0 ? sessions.length - 1 : Math.max(buyIndex, sessions.findIndex(date => date > inputs.endDate) - 1));
  if (exIndex > maxIndex) return { date: sessions[maxIndex]!, price: purchasePrice, reason: "Holding limit reached before the ex-date; sale price path is not modeled before ex-date." };
  if (exPrice >= purchasePrice) return { date: event.exDate, price: purchasePrice, reason: "The modeled ex-date price is at or above purchase price." };
  if (stock.recoverySessions === null) return { date: sessions[maxIndex]!, price: modelPrice(exPrice, purchasePrice, exIndex, maxIndex, null), reason: "No-recovery assumption; sold at the holding or planning limit." };
  if (stock.recoverySessions === 0) return { date: event.exDate, price: purchasePrice, reason: "Assumed full recovery on the ex-date." };
  const recoveryIndex = Math.min(maxIndex, exIndex + stock.recoverySessions);
  const reached = recoveryIndex === exIndex + stock.recoverySessions && exPrice < purchasePrice;
  return { date: sessions[recoveryIndex]!, price: modelPrice(exPrice, purchasePrice, exIndex, recoveryIndex, stock.recoverySessions), reason: reached ? `Modeled recovery after ${stock.recoverySessions} exchange sessions.` : "Holding or planning limit reached before modeled recovery." };
}
function modelPrice(exPrice: number, purchasePrice: number, exIndex: number, saleIndex: number, recoverySessions: number | null): number {
  if (recoverySessions === null || saleIndex <= exIndex) return exPrice;
  const progress = Math.min(1, (saleIndex - exIndex) / recoverySessions);
  return exPrice + (purchasePrice - exPrice) * progress;
}














