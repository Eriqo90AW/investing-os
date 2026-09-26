import type { Currency, Direction } from "./investing-types";

export interface PositionSizeInput {
  accountSize: number;
  riskBudget: number;
  riskMode: "percent" | "amount";
  entryPrice: number;
  stopPrice: number;
  direction: Direction;
  feePercent: number;
  quantityStep: number;
  currency: Currency;
}

export interface PositionSizeResult {
  quantity: number;
  capitalRequired: number;
  lossAtStop: number;
  estimatedFees: number;
  riskPercent: number;
}

export function calculatePositionSize(input: PositionSizeInput): PositionSizeResult | null {
  const { accountSize, entryPrice, stopPrice } = input;
  if (accountSize <= 0 || entryPrice <= 0 || stopPrice <= 0 || input.riskBudget <= 0) return null;
  const priceRisk = input.direction === "long" ? entryPrice - stopPrice : stopPrice - entryPrice;
  if (priceRisk <= 0) return null;
  const budget = input.riskMode === "percent"
    ? accountSize * input.riskBudget / 100
    : input.riskBudget;
  const roundTripFeePerUnit = entryPrice * Math.max(0, input.feePercent) / 100 * 2;
  const rawQuantity = budget / (priceRisk + roundTripFeePerUnit);
  const step = input.quantityStep > 0 ? input.quantityStep : 1;
  const quantity = Math.floor(rawQuantity / step) * step;
  if (quantity <= 0) return null;
  const estimatedFees = quantity * roundTripFeePerUnit;
  const lossAtStop = quantity * priceRisk + estimatedFees;
  return {
    quantity,
    capitalRequired: quantity * entryPrice,
    lossAtStop,
    estimatedFees,
    riskPercent: lossAtStop / accountSize * 100,
  };
}

export function formatMoney(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(value);
}
