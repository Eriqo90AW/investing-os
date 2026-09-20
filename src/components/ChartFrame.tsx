import { For, Show, type JSX } from "solid-js";

export interface LegendItem {
  label: string;
  /** A CSS color or var() reference — identity is carried by the swatch, not the text. */
  color: string;
  value?: string;
  /** Rendered as a dashed rule instead of a solid chip (baselines, thresholds). */
  dashed?: boolean;
}

export interface ChartFrameProps {
  title: string;
  /** One line on what the chart is for — the spec note, not a caption. */
  note: string;
  /** Headline figure, shown at rest and replaced by the hovered value. */
  hero?: () => JSX.Element;
  legend?: () => LegendItem[];
  /** Column headers for the table view. */
  tableHead?: string[];
  /** Rows for the table view — the non-visual path to the same numbers. */
  tableRows?: () => (string | number)[][];
  children: JSX.Element;
}

/**
 * Shared chart container: surface, title block, legend, hover readout and a
 * `<details>` table view. Every chart on the page goes through this so the
 * anatomy stays identical from one figure to the next.
 */
export function ChartFrame(props: ChartFrameProps) {
  return (
    <figure class="m-0 rounded-200 border border-line bg-surface-1 overflow-hidden">
      <figcaption class="px-250 pt-250 pb-150 flex flex-wrap items-start gap-200 justify-between">
        <div class="min-w-0">
          <h4 class="text-300 font-700 leading-[130%]">{props.title}</h4>
          <p class="mt-50 text-75 text-muted max-w-[52ch]">{props.note}</p>
        </div>
        <Show when={props.hero}>
          <div class="text-right shrink-0 tabular-nums">{props.hero!()}</div>
        </Show>
      </figcaption>

      <Show when={props.legend}>
        <div class="px-250 pb-150 flex flex-wrap gap-x-250 gap-y-100">
          <For each={props.legend!()}>
            {item => (
              <span class="inline-flex items-center gap-100 text-75">
                <Show
                  when={!item.dashed}
                  fallback={
                    <span
                      aria-hidden="true"
                      class="w-4 h-0 border-t-2 border-dashed shrink-0"
                      style={{ "border-color": item.color }}
                    />
                  }
                >
                  <span
                    aria-hidden="true"
                    class="w-[10px] h-[10px] rounded-[3px] shrink-0"
                    style={{ background: item.color }}
                  />
                </Show>
                <span class="text-muted">{item.label}</span>
                <Show when={item.value}>
                  <span class="font-600 text-ink tabular-nums">{item.value}</span>
                </Show>
              </span>
            )}
          </For>
        </div>
      </Show>

      <div class="px-250 pb-200">{props.children}</div>

      <Show when={props.tableHead && props.tableRows}>
        <details class="border-t border-line group">
          <summary class="px-250 py-150 text-75 font-600 text-muted cursor-pointer select-none hover:text-ink transition-colors marker:content-['']">
            <span class="inline-block w-3 transition-transform group-open:rotate-90">›</span>
            Table view
          </summary>
          <div class="px-250 pb-250 overflow-x-auto">
            <table class="w-full text-75 border-collapse tabular-nums">
              <thead>
                <tr class="text-muted border-b border-line">
                  <For each={props.tableHead!}>
                    {(h, i) => (
                      <th
                        scope="col"
                        class="font-500 py-100 pr-200"
                        classList={{ "text-right": i() > 0, "text-left": i() === 0 }}
                      >
                        {h}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={props.tableRows!()}>
                  {row => (
                    <tr class="border-b border-line last:border-0">
                      <For each={row}>
                        {(cell, i) => (
                          <td
                            class="py-100 pr-200"
                            classList={{
                              "text-right": i() > 0,
                              "text-left": i() === 0,
                              "text-muted": i() === 0,
                            }}
                          >
                            {cell}
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </details>
      </Show>
    </figure>
  );
}

/** Reserved-height chart slot — keeps SSR layout identical to the hydrated one. */
export function ChartSurface(props: {
  height: number;
  ref: (el: HTMLDivElement) => void;
  label: string;
}) {
  return (
    <div
      ref={props.ref}
      role="img"
      aria-label={props.label}
      class="w-full"
      style={{ height: `${props.height}px` }}
    />
  );
}
