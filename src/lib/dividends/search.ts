import { simulateChain } from "./simulation.js";
import type { ChainTrade, ChainSuggestion, DividendEvent, PlannerInputs, ScenarioName, Strategy } from "./types.js";

export const BEAM_WIDTH = 100;

export function searchChains(events: DividendEvent[], inputs: PlannerInputs, strategy: Strategy, scenario: ScenarioName = "base"): ChainSuggestion[] {
  if (inputs.capital === null) return [];
  const candidates = events.filter(event => !event.excluded && event.cumDate >= inputs.startDate && event.cumDate <= inputs.endDate && event.exDate >= inputs.startDate && event.exDate <= inputs.endDate)
    .sort((a, b) => a.cumDate.localeCompare(b.cumDate) || a.ticker.localeCompare(b.ticker));
  let beam: ChainTrade[][] = [[]];
  for (const event of candidates) {
    const choices = beam.flatMap(chain => [chain, ...defaultPurchaseDates(event, inputs).map(purchaseDate => [...chain, { eventId: event.id, purchaseDate }])]);
    const unique = new Map<string, ChainTrade[]>();
    for (const chain of choices) unique.set(chain.map(item => `${item.eventId}@${item.purchaseDate}`).join(","), chain);
    beam = [...unique.values()].map(chain => ({ chain, result: simulateChain({ chain, events, inputs, strategy, scenario }) }))
      .sort((a, b) => b.result.endingWealth - a.result.endingWealth || a.chain.length - b.chain.length || chainTickerKey(a.chain, events).localeCompare(chainTickerKey(b.chain, events)))
      .slice(0, BEAM_WIDTH).map(item => item.chain);
  }
  return beam.map(chain => ({ chain, result: simulateChain({ chain, events, inputs, strategy, scenario }) }))
    .sort((a, b) => b.result.endingWealth - a.result.endingWealth || a.chain.length - b.chain.length || chainTickerKey(a.chain, events).localeCompare(chainTickerKey(b.chain, events)));
}
function defaultPurchaseDates(event: DividendEvent, inputs: PlannerInputs): string[] {
  const date = event.cumDate;
  return date >= inputs.startDate && date <= inputs.endDate ? [date] : [];
}
function chainTickerKey(chain: ChainTrade[], events: DividendEvent[]): string {
  const byId = new Map(events.map(event => [event.id, event.ticker]));
  return chain.map(item => byId.get(item.eventId) ?? "").sort().join(",");
}


