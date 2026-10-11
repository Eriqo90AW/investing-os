import { createCalendar, isDate } from "./calendar.js";
export const SCENARIOS = ["downside", "base", "upside"];
export function defaultInputs(demo) {
    return {
        capital: demo ? 100_000_000 : null, startDate: demo ? "2026-04-06" : "", endDate: demo ? "2026-06-04" : "",
        buyFee: demo ? 0.0015 : null, sellFee: demo ? 0.0025 : null, slippage: demo ? 0.001 : null, dividendTax: demo ? 0.1 : null,
        maxHoldingSessions: 20, calendars: [],
        scenarios: {
            downside: { dropMultiple: 1.25, recoverySessions: null, overrides: {} },
            base: { dropMultiple: 1, recoverySessions: 20, overrides: {} },
            upside: { dropMultiple: 0.75, recoverySessions: 10, overrides: {} },
        },
    };
}
export function validPriceAssumption(a) {
    return Number.isFinite(a.dropMultiple) && a.dropMultiple >= 0 &&
        (a.recoverySessions === null || (Number.isInteger(a.recoverySessions) && a.recoverySessions >= 0));
}
export function validateInputs(inputs) {
    if (inputs.capital === null || !Number.isFinite(inputs.capital) || inputs.capital <= 0)
        throw new Error("Enter starting capital greater than zero.");
    if (!isDate(inputs.startDate) || !isDate(inputs.endDate) || inputs.startDate > inputs.endDate)
        throw new Error("Enter valid planning dates, with the end on or after the start.");
    for (const key of ["buyFee", "sellFee", "slippage", "dividendTax"]) {
        const value = inputs[key];
        if (value === null || !Number.isFinite(value) || value < 0 || value > 1 || (key !== "dividendTax" && value === 1)) {
            throw new Error(`Enter an explicit ${key === "dividendTax" ? "dividend tax assumption" : key === "buyFee" ? "buy fee" : key === "sellFee" ? "all-inclusive sell fee" : "slippage assumption"} as a valid percentage. Zero is allowed.`);
        }
    }
    if (!Number.isInteger(inputs.maxHoldingSessions) || inputs.maxHoldingSessions < 1)
        throw new Error("Maximum holding period must be a positive whole number of exchange sessions.");
    for (const name of SCENARIOS) {
        const scenario = inputs.scenarios[name];
        if (!validPriceAssumption(scenario) || Object.values(scenario.overrides).some(a => !validPriceAssumption(a)))
            throw new Error(`Invalid ${name} price-drop or recovery assumption.`);
    }
    const calendar = createCalendar(inputs.calendars);
    if (!calendar.sessions(inputs.startDate, inputs.endDate).length)
        throw new Error("The planning period contains no exchange sessions.");
}
