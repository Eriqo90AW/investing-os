import assert from "node:assert/strict";
import test from "node:test";
import { defaultInputs, validateInputs } from "../src/lib/dividends/assumptions.js";
import { demoEvents } from "../src/lib/dividends/events.js";
import { searchChains } from "../src/lib/dividends/search.js";
import { simulateChain } from "../src/lib/dividends/simulation.js";
import type { ChainTrade, DividendEvent, PlannerInputs } from "../src/lib/dividends/types.js";
import { dividendStore, resetDividendDemo, restoreDividendData, saveDividendEvent, setDividendMode } from "../src/lib/dividends/store.js";

function setup(capital = 100_000_000): { events: DividendEvent[]; inputs: PlannerInputs } {
  const inputs = defaultInputs(true);
  inputs.capital = capital;
  return { events: demoEvents(), inputs };
}
const chainFor = (event: DividendEvent, purchaseDate = event.cumDate): ChainTrade[] => [{ eventId: event.id, purchaseDate }];

test("rounds down to whole 100-share lots and leaves the remainder in cash", () => {
  const { events, inputs } = setup(650_000);
  const result = simulateChain({ chain: chainFor(events[0]!), events, inputs, strategy: "ex-date", scenario: "base" });
  const trade = result.trades[0]!;
  assert.equal(trade.status, "completed");
  if (trade.status !== "completed") return;
  assert.equal(trade.lots, 1);
  assert.equal(trade.shares, 100);
  assert.ok(result.availableCash > 200_000);
});

test("skips a buy when capital cannot cover one lot and its buy fee", () => {
  const { events, inputs } = setup(100_000);
  const result = simulateChain({ chain: chainFor(events[0]!), events, inputs, strategy: "ex-date", scenario: "base" });
  assert.equal(result.completedCycles, 0);
  assert.match(result.trades[0]?.status === "skipped" ? result.trades[0].reason : "", /Insufficient available cash/);
  assert.equal(result.endingWealth, inputs.capital);
});

test("rejects purchase after cum-date and sale before ex-date eligibility", () => {
  const { events, inputs } = setup();
  const event = events[0]!;
  const result = simulateChain({ chain: chainFor(event, "2026-04-09"), events, inputs, strategy: "ex-date", scenario: "base" });
  assert.equal(result.completedCycles, 0);
  assert.match(result.trades[0]?.status === "skipped" ? result.trades[0].reason : "", /cum-date/);
});

test("includes fees and tax and shows price losses that exceed the dividend", () => {
  const { events, inputs } = setup();
  const event = events[0]!;
  const result = simulateChain({ chain: chainFor(event), events, inputs, strategy: "ex-date", scenario: "downside" });
  const trade = result.trades[0]!;
  assert.equal(trade.status, "completed");
  if (trade.status !== "completed") return;
  assert.ok(trade.buyFee > 0 && trade.sellFee > 0 && trade.dividendTax > 0);
  assert.ok(trade.netProfit < 0);
  assert.ok(trade.breakEvenSalePrice > trade.salePrice);
});

test("keeps sale settlement and unpaid dividend as separate receivables", () => {
  const { events, inputs } = setup();
  inputs.endDate = "2026-04-10";
  const result = simulateChain({ chain: chainFor(events[0]!), events, inputs, strategy: "ex-date", scenario: "base" });
  const trade = result.trades[0]!;
  assert.equal(trade.status, "completed");
  if (trade.status !== "completed") return;
  assert.equal(trade.settlementDate, "2026-04-13");
  assert.ok(result.unsettledSales > 0);
  assert.ok(result.dividendReceivables > 0);
  assert.equal(result.endingWealth, result.availableCash + result.unsettledSales + result.dividendReceivables);
  const cashDelta = result.ledger.reduce((sum, entry) => sum + entry.cash, 0);
  const unsettledDelta = result.ledger.reduce((sum, entry) => sum + entry.unsettledSales, 0);
  const receivableDelta = result.ledger.reduce((sum, entry) => sum + entry.dividendReceivables, 0);
  assert.ok(Math.abs(cashDelta - result.availableCash) < 0.01);
  assert.ok(Math.abs(unsettledDelta - result.unsettledSales) < 0.01);
  assert.ok(Math.abs(receivableDelta - result.dividendReceivables) < 0.01);
});

test("skips an event when delayed recovery overlaps the next holding", () => {
  const { events, inputs } = setup();
  const chain = [chainFor(events[0]!)[0]!, chainFor(events[1]!)[0]!];
  const result = simulateChain({ chain, events, inputs, strategy: "recovery", scenario: "base" });
  assert.equal(result.trades[0]?.status, "completed");
  assert.equal(result.trades[1]?.status, "skipped");
  assert.match(result.trades[1]?.status === "skipped" ? result.trades[1].reason : "", /conflicts/);
});

test("uses the holiday calendar when computing T+2 settlement", () => {
  const { events, inputs } = setup();
  const event = { ...events[0]!, cumDate: "2026-04-30", exDate: "2026-04-30", recordingDate: "2026-05-04", paymentDate: "2026-05-12" };
  const result = simulateChain({ chain: chainFor(event), events: [event], inputs, strategy: "ex-date", scenario: "base" });
  const trade = result.trades[0]!;
  assert.equal(trade.status, "completed");
  if (trade.status === "completed") assert.equal(trade.settlementDate, "2026-05-05");
});

test("search can choose to stay in cash when the modeled ex-date loss dominates", () => {
  const { events, inputs } = setup();
  const event = { ...events[0]!, dividendPerShare: 1000 };
  const results = searchChains([event], inputs, "ex-date", "downside");
  assert.equal(results[0]?.chain.length, 0);
  assert.equal(results[0]?.result.netProfit, 0);
});

test("holds the ex-date price through the limit when recovery is set to none", () => {
  const { events, inputs } = setup();
  const event = events[0]!;
  inputs.scenarios.base.recoverySessions = null;
  const result = simulateChain({ chain: chainFor(event), events, inputs, strategy: "recovery", scenario: "base" });
  const trade = result.trades[0]!;
  assert.equal(trade.status, "completed");
  if (trade.status !== "completed") return;
  assert.equal(trade.saleDate, "2026-05-07");
  assert.match(trade.exitReason, /No-recovery/);
  assert.ok(trade.salePrice < trade.purchasePrice);
});

test("reuses T+2 sale proceeds only from the next exchange session", () => {
  const { events, inputs } = setup(401_001);
  const third = { ...events[0]!, id: "demo-third", ticker: "TEST", dividendPerShare: 50, purchasePrice: 1000, cumDate: "2026-04-20", exDate: "2026-04-21", recordingDate: "2026-04-22", paymentDate: "2026-05-05" };
  const chain = [
    { eventId: events[0]!.id, purchaseDate: "2026-04-08" },
    { eventId: events[1]!.id, purchaseDate: "2026-04-14" },
    { eventId: third.id, purchaseDate: third.cumDate },
  ];
  const result = simulateChain({ chain, events: [...events, third], inputs, strategy: "ex-date", scenario: "base" });
  assert.equal(result.completedCycles, 3);
  assert.ok(result.trades.every(trade => trade.status === "completed"));
});


test("keeps manual dividend records separate when resetting demo data", () => {
  setDividendMode("manual");
  const manualEvent = { ...demoEvents()[0]!, id: "manual-persisted", ticker: "MINE", provenance: "manual" as const };
  saveDividendEvent(manualEvent);
  setDividendMode("demo");
  resetDividendDemo();
  assert.ok(dividendStore().manual.events.some(event => event.id === manualEvent.id));
  assert.equal(dividendStore().demo.events.length, demoEvents().length);
});

test("ignores unsupported dividend backup versions", () => {
  const before = dividendStore();
  restoreDividendData({ version: 2, mode: "manual", demo: {}, manual: {} });
  assert.equal(dividendStore(), before);
});



test("a legacy backup without dividends leaves the dividend workspace intact", () => {
  setDividendMode("manual");
  const event = { ...demoEvents()[0]!, id: "manual-legacy-check", ticker: "KEEP", provenance: "manual" as const };
  saveDividendEvent(event);
  const before = dividendStore();
  const restored = restoreDividendData(undefined);
  assert.equal(restored, false);
  assert.equal(dividendStore(), before);
  assert.ok(dividendStore().manual.events.some(item => item.id === event.id));
});

test("requires an explicit dividend tax assumption in manual mode", () => {
  const inputs = defaultInputs(false);
  inputs.capital = 1_000_000;
  inputs.startDate = "2026-04-06";
  inputs.endDate = "2026-06-04";
  inputs.buyFee = 0;
  inputs.sellFee = 0;
  inputs.slippage = 0;
  assert.throws(() => validateInputs(inputs), /explicit dividend tax assumption/);
});

test("marks a selected opportunity skipped when its event is excluded", () => {
  const { events, inputs } = setup();
  const excluded = { ...events[0]!, excluded: true };
  const result = simulateChain({ chain: chainFor(excluded), events: [excluded], inputs, strategy: "ex-date", scenario: "base" });
  assert.equal(result.completedCycles, 0);
  assert.match(result.trades[0]?.status === "skipped" ? result.trades[0].reason : "", /excluded/);
});
