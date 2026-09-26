import { createMemo, createSignal } from "solid-js";
import type { Currency, Direction, SetupLevels } from "~/lib/investing-types";
import { calculatePositionSize, formatMoney } from "~/lib/risk";

export function PositionSizeCalculator(props: {
  levels: SetupLevels;
  direction: Direction;
  currency: Currency;
}) {
  const defaultEntry = props.levels.entryLow !== null && props.levels.entryHigh !== null
    ? (props.levels.entryLow + props.levels.entryHigh) / 2
    : props.levels.entryLow ?? 0;
  const [accountSize, setAccountSize] = createSignal(props.currency === "IDR" ? 100_000_000 : 25_000);
  const [riskBudget, setRiskBudget] = createSignal(1);
  const [riskMode, setRiskMode] = createSignal<"percent" | "amount">("percent");
  const [entryPrice, setEntryPrice] = createSignal(defaultEntry);
  const [stopPrice, setStopPrice] = createSignal(props.levels.stop ?? 0);
  const [feePercent, setFeePercent] = createSignal(0.1);
  const [quantityStep, setQuantityStep] = createSignal(props.currency === "IDR" ? 100 : 0.0001);

  const result = createMemo(() => calculatePositionSize({
    accountSize: accountSize(),
    riskBudget: riskBudget(),
    riskMode: riskMode(),
    entryPrice: entryPrice(),
    stopPrice: stopPrice(),
    direction: props.direction,
    feePercent: feePercent(),
    quantityStep: quantityStep(),
    currency: props.currency,
  }));

  const numberInput = "h-10 w-full rounded-100 border border-line bg-surface-2 px-150 text-100 text-ink outline-none focus:border-accent tabular-nums";

  return (
    <section class="rounded-200 border border-line bg-surface-1 p-250">
      <h2 class="text-200 font-700">Position size</h2>
      <p class="mt-50 text-75 text-muted">Uses the planned entry and stop. Fees are estimated for entry and exit.</p>
      <div class="mt-200 grid grid-cols-2 gap-150">
        <Field label={`Account size (${props.currency})`}><input type="number" min="0" class={numberInput} value={accountSize()} onInput={event => setAccountSize(event.currentTarget.valueAsNumber || 0)} /></Field>
        <Field label="Risk budget">
          <div class="flex gap-50">
            <input type="number" min="0" step="0.1" class={numberInput} value={riskBudget()} onInput={event => setRiskBudget(event.currentTarget.valueAsNumber || 0)} />
            <select class="h-10 rounded-100 border border-line bg-surface-2 px-100 text-75" value={riskMode()} onChange={event => setRiskMode(event.currentTarget.value as "percent" | "amount")}>
              <option value="percent">%</option><option value="amount">{props.currency}</option>
            </select>
          </div>
        </Field>
        <Field label="Entry used"><input type="number" min="0" step="any" class={numberInput} value={entryPrice()} onInput={event => setEntryPrice(event.currentTarget.valueAsNumber || 0)} /></Field>
        <Field label="Stop"><input type="number" min="0" step="any" class={numberInput} value={stopPrice()} onInput={event => setStopPrice(event.currentTarget.valueAsNumber || 0)} /></Field>
        <Field label="Fee each side (%)"><input type="number" min="0" step="0.01" class={numberInput} value={feePercent()} onInput={event => setFeePercent(event.currentTarget.valueAsNumber || 0)} /></Field>
        <Field label="Quantity step"><input type="number" min="0" step="any" class={numberInput} value={quantityStep()} onInput={event => setQuantityStep(event.currentTarget.valueAsNumber || 0)} /></Field>
      </div>
      {result() ? (
        <dl class="mt-200 grid grid-cols-2 gap-100 rounded-200 bg-surface-2 p-200 text-75">
          <Metric label="Quantity" value={result()!.quantity.toLocaleString("en-US", { maximumFractionDigits: 4 })} />
          <Metric label="Capital required" value={formatMoney(result()!.capitalRequired, props.currency)} />
          <Metric label="Loss at stop" value={formatMoney(result()!.lossAtStop, props.currency)} negative />
          <Metric label="Estimated fees" value={formatMoney(result()!.estimatedFees, props.currency)} />
          <Metric label="Account risk" value={`${result()!.riskPercent.toFixed(2)}%`} />
        </dl>
      ) : <p class="mt-200 rounded-100 bg-reminder-bg px-150 py-100 text-75 text-reminder">Entry, stop, and risk budget must form a valid {props.direction} trade.</p>}
      <p class="mt-150 text-50 text-caption">No FX conversion is applied. All values stay in {props.currency}.</p>
    </section>
  );
}

function Field(props: { label: string; children: unknown }) {
  return <label class="block text-75 font-600 text-muted"><span class="mb-50 block">{props.label}</span>{props.children as never}</label>;
}

function Metric(props: { label: string; value: string; negative?: boolean }) {
  return <div><dt class="text-caption">{props.label}</dt><dd class="mt-50 text-100 font-700 tabular-nums" classList={{ "text-neg": props.negative }}>{props.value}</dd></div>;
}
