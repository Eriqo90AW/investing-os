import { createCalendar, isDate } from "./calendar.js";
const day = (date) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;
const rounded = (amount) => Math.round(amount * 100) / 100;
/** Calendar-day position. Date-only values must never shift with the host timezone. */
export function datePosition(date, start, end) {
    return (day(date) - day(start)) / Math.max(1, day(end) - day(start));
}
/** The graph reads the simulator's cash ledger; it never estimates buy sizing. */
export function buildDividendFlow(result, inputs, chain, events) {
    const calendar = createCalendar(inputs.calendars);
    const eventMap = new Map(events.map(event => [event.id, event]));
    const dates = [inputs.startDate, inputs.endDate];
    const availability = new Map();
    for (const trade of result.trades) {
        if (isDate(trade.purchaseDate))
            dates.push(trade.purchaseDate);
        if (trade.status !== "completed")
            continue;
        dates.push(trade.saleDate, trade.settlementDate, trade.paymentDate);
        // A missing future calendar must not hide an otherwise valid simulation.
        let availableDate = null;
        try {
            availableDate = calendar.nextSession(trade.settlementDate);
        }
        catch { /* Show settlement until coverage is added. */ }
        availability.set(trade, availableDate);
        if (availableDate)
            dates.push(availableDate);
    }
    dates.sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const position = (date) => datePosition(isDate(date) ? date : startDate, startDate, endDate);
    const usedSelections = new Set();
    const usedPurchases = new Set();
    const trades = result.trades.map((trade, index) => {
        const selectionIndex = chain.findIndex((item, i) => !usedSelections.has(i) && item.eventId === trade.eventId &&
            (item.purchaseDate === trade.purchaseDate || (!item.purchaseDate && eventMap.get(item.eventId)?.cumDate === trade.purchaseDate)));
        if (selectionIndex >= 0)
            usedSelections.add(selectionIndex);
        const selection = { key: `${trade.eventId}:${index}`, selectionIndex, purchasePosition: position(trade.purchaseDate) };
        if (trade.status === "skipped")
            return { ...selection, status: "skipped", trade };
        const purchaseIndex = result.ledger.findIndex((entry, i) => !usedPurchases.has(i) && entry.kind === "purchase" && entry.eventId === trade.eventId && entry.date === trade.purchaseDate);
        if (purchaseIndex >= 0)
            usedPurchases.add(purchaseIndex);
        // The ledger orders opening/purchases before same-day closing receipts.
        const cashBeforePurchase = rounded(result.ledger.slice(0, Math.max(0, purchaseIndex)).reduce((cash, entry) => cash + entry.cash, 0));
        const cashAvailableDate = availability.get(trade) ?? null;
        return {
            ...selection, status: "completed", trade,
            salePosition: position(trade.saleDate), entitlementPosition: position(eventMap.get(trade.eventId)?.exDate ?? trade.saleDate),
            paymentPosition: position(trade.paymentDate), settlementPosition: position(trade.settlementDate),
            cashAvailableDate, cashAvailablePosition: position(cashAvailableDate ?? trade.settlementDate),
            holdingDays: day(trade.saleDate) - day(trade.purchaseDate),
            holdingSessions: calendar.sessions(trade.purchaseDate, trade.saleDate).length - 1,
            returnPercent: trade.buyCost > 0 ? trade.netProfit / trade.buyCost * 100 : 0,
            dividendYield: trade.buyCost > 0 ? trade.netDividend / trade.buyCost * 100 : 0,
            cashBeforePurchase, cashAfterPurchase: rounded(cashBeforePurchase - trade.buyCost),
            pendingDividend: trade.paymentDate > inputs.endDate,
            pendingSale: trade.settlementDate > inputs.endDate,
        };
    });
    const ticks = [{ date: startDate, position: 0, month: false }];
    const span = day(endDate) - day(startDate);
    if (span <= 100) {
        for (let offset = 7; offset < span; offset += 7) {
            const date = new Date((day(startDate) + offset) * 86_400_000).toISOString().slice(0, 10);
            ticks.push({ date, position: position(date), month: false });
        }
    }
    else {
        const cursor = new Date(`${startDate}T00:00:00Z`);
        cursor.setUTCDate(1);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        while (cursor.toISOString().slice(0, 10) < endDate) {
            const date = cursor.toISOString().slice(0, 10);
            ticks.push({ date, position: position(date), month: true });
            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }
    }
    return { startDate, endDate, planningEndPosition: position(inputs.endDate), trades, ticks };
}
