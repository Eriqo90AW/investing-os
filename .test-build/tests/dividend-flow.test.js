import assert from "node:assert/strict";
import test from "node:test";
import { defaultInputs } from "../src/lib/dividends/assumptions.js";
import { demoEvents } from "../src/lib/dividends/events.js";
import { buildDividendFlow, datePosition } from "../src/lib/dividends/flow.js";
import { simulateChain } from "../src/lib/dividends/simulation.js";
function graph(events, inputs, chain, strategy = "ex-date") {
    const result = simulateChain({ chain, events, inputs, strategy, scenario: "base" });
    return { result, flow: buildDividendFlow(result, inputs, chain, events) };
}
const select = (event) => ({ eventId: event.id, purchaseDate: event.cumDate });
test("keeps date spacing linear and independent of local timezone", () => {
    assert.equal(datePosition("2026-04-16", "2026-04-06", "2026-04-26"), 0.5);
    assert.equal(datePosition("2026-04-26", "2026-04-06", "2026-04-26"), 1);
    assert.equal(datePosition("2026-04-06", "2026-04-06", "2026-04-06"), 0);
});
test("maps chronological simulation rows back to their original editable selections", () => {
    const events = demoEvents();
    const chain = [select(events[1]), select(events[0])];
    const { flow } = graph(events, defaultInputs(true), chain);
    assert.deepEqual(flow.trades.map(row => row.selectionIndex), [1, 0]);
    assert.ok(flow.trades[0].purchasePosition < flow.trades[1].purchasePosition);
});
test("uses net profit and dividend over buy cost and preserves actual lot allocation", () => {
    const events = demoEvents();
    const inputs = defaultInputs(true);
    const { flow, result } = graph(events, inputs, [select(events[0])]);
    const row = flow.trades[0];
    assert.equal(row.status, "completed");
    if (row.status !== "completed")
        return;
    assert.equal(row.returnPercent, row.trade.netProfit / row.trade.buyCost * 100);
    assert.equal(row.dividendYield, row.trade.netDividend / row.trade.buyCost * 100);
    assert.equal(row.trade.shares, row.trade.lots * 100);
    assert.equal(row.cashBeforePurchase, inputs.capital);
    assert.ok(Math.abs(row.cashAfterPurchase - (inputs.capital - row.trade.buyCost)) < 0.01);
    assert.ok(Math.abs(result.returnOnCapital - result.netProfit / inputs.capital * 100) < 1e-9);
    assert.ok(row.returnPercent < 0);
    assert.equal(row.holdingDays, 1);
    assert.equal(row.holdingSessions, 1);
});
test("marks unpaid dividends and unsettled sales pending and extends the date axis", () => {
    const events = demoEvents();
    const inputs = defaultInputs(true);
    inputs.endDate = "2026-04-10";
    const { flow } = graph(events, inputs, [select(events[0])]);
    const row = flow.trades[0];
    assert.equal(row.status, "completed");
    if (row.status !== "completed")
        return;
    assert.equal(row.pendingDividend, true);
    assert.equal(row.pendingSale, true);
    assert.equal(row.cashAvailableDate, "2026-04-14");
    assert.equal(flow.endDate, row.trade.paymentDate);
    assert.ok(flow.planningEndPosition < row.paymentPosition);
});
test("same-day settlement cannot fund the next buy even when that buy completes from leftover cash", () => {
    const inputs = defaultInputs(true);
    inputs.capital = 1_000_000;
    inputs.buyFee = 0;
    inputs.sellFee = 0;
    inputs.slippage = 0;
    inputs.dividendTax = 0;
    const first = { ...demoEvents()[0], purchasePrice: 3333, dividendPerShare: 1 };
    const next = { ...demoEvents()[1], purchasePrice: 1, dividendPerShare: 0, cumDate: "2026-04-13", exDate: "2026-04-14" };
    const { flow } = graph([first, next], inputs, [select(first), select(next)]);
    const row = flow.trades[1];
    assert.equal(row.status, "completed");
    if (row.status !== "completed")
        return;
    assert.equal(row.cashBeforePurchase, 100);
    assert.equal(row.trade.lots, 1);
    assert.equal(row.cashAfterPurchase, 0);
});
test("same-day dividend is excluded while earlier settlement joins pooled cash", () => {
    const inputs = defaultInputs(true);
    inputs.capital = 1_000_000;
    inputs.buyFee = 0;
    inputs.sellFee = 0;
    inputs.slippage = 0;
    inputs.dividendTax = 0;
    const first = { ...demoEvents()[0], purchasePrice: 3333, dividendPerShare: 100, paymentDate: "2026-04-14" };
    const next = { ...demoEvents()[1], purchasePrice: 1000 };
    const { flow } = graph([first, next], inputs, [select(first), select(next)]);
    const prior = flow.trades[0];
    const row = flow.trades[1];
    assert.equal(prior.status, "completed");
    assert.equal(row.status, "completed");
    if (prior.status !== "completed" || row.status !== "completed")
        return;
    assert.equal(row.cashBeforePurchase, 100 + prior.trade.netSale);
    assert.notEqual(row.cashBeforePurchase, 100 + prior.trade.netSale + prior.trade.netDividend);
});
test("payments from earlier exchange sessions fund later purchases through pooled cash", () => {
    const inputs = defaultInputs(true);
    const first = { ...demoEvents()[0], paymentDate: "2026-04-13" };
    const next = demoEvents()[1];
    const { flow } = graph([first, next], inputs, [select(first), select(next)]);
    const prior = flow.trades[0];
    const row = flow.trades[1];
    if (prior.status !== "completed" || row.status !== "completed")
        assert.fail("Both trades must complete");
    const expected = Math.round((inputs.capital - prior.trade.buyCost + prior.trade.netSale + prior.trade.netDividend) * 100) / 100;
    assert.equal(row.cashBeforePurchase, expected);
});
test("keeps skipped and deleted-event selections visible with reasons and editable indexes", () => {
    const events = demoEvents();
    const inputs = defaultInputs(true);
    const chain = [select(events[0]), select(events[1]), { eventId: "missing", purchaseDate: "2026-04-15" }];
    const { flow } = graph(events, inputs, chain, "recovery");
    assert.equal(flow.trades[1].status, "skipped");
    assert.equal(flow.trades[2].status, "skipped");
    const row = flow.trades[2];
    if (row.status !== "skipped")
        return;
    assert.equal(row.selectionIndex, 2);
    assert.match(row.trade.reason, /no longer exists/);
    assert.ok(row.purchasePosition >= 0 && row.purchasePosition <= 1);
});
test("supports six-month holdings with monthly ticks on the same linear axis", () => {
    const inputs = defaultInputs(true);
    inputs.endDate = "2026-11-30";
    inputs.maxHoldingSessions = 150;
    const event = { ...demoEvents()[0], cumDate: "2026-04-07", exDate: "2026-04-08" };
    inputs.scenarios.base.recoverySessions = 120;
    const { flow } = graph([event], inputs, [select(event)], "recovery");
    const row = flow.trades[0];
    assert.equal(row.status, "completed");
    if (row.status !== "completed")
        return;
    assert.ok(row.holdingDays > 150);
    assert.ok(flow.ticks.some(tick => tick.month && tick.date === "2026-10-01"));
});
test("renders a covered settlement even when its spendable session needs next year's calendar", () => {
    const inputs = defaultInputs(true);
    inputs.startDate = "2026-12-28";
    inputs.endDate = "2026-12-30";
    const event = { ...demoEvents()[0], cumDate: "2026-12-28", exDate: "2026-12-28", recordingDate: "2026-12-29", paymentDate: "2026-12-30" };
    const { flow } = graph([event], inputs, [select(event)]);
    const row = flow.trades[0];
    assert.equal(row.status, "completed");
    if (row.status !== "completed")
        return;
    assert.equal(row.trade.settlementDate, "2026-12-30");
    assert.equal(row.cashAvailableDate, null);
});
