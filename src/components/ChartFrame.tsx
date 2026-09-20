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
  /** One line on what the chart is for - the spec note, not a caption. */
  note: string;
  /** Main figure aligned with the title. */
  primaryValue?: () => JSX.Element;
  /** Supporting figure aligned with the note. */
  secondaryValue?: () => JSX.Element;
  legend?: () => LegendItem[];
  children: JSX.Element;
}

/**
 * Shared chart container: surface, title block, legend and hover readout. Every
 * chart on the page goes through this so the anatomy stays identical from one
 * figure to the next.
 *
 * There is no table view. Each chart carries a full `aria-label` naming every
 * series and value instead, so the numbers still reach a screen reader — but a
 * sighted reader who cannot separate two hues no longer has a text fallback.
 * That is a deliberate trade, not an oversight.
 */
export function ChartFrame(props: ChartFrameProps) {
  return (
    <figure class="m-0 rounded-200 border border-line bg-surface-1 overflow-hidden">
      <figcaption class="px-250 pt-250 pb-150 grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-baseline gap-x-250 gap-y-50">
        <h4 class="col-start-1 row-start-1 text-300 font-700 leading-[130%] min-w-0">
          {props.title}
        </h4>
        <Show when={props.primaryValue}>
          <div class="col-start-2 row-start-1 text-right shrink-0">
            {props.primaryValue!()}
          </div>
        </Show>
        <p class="col-start-1 row-start-2 mt-0 text-75 text-muted max-w-[62ch]">
          {props.note}
        </p>
        <Show when={props.secondaryValue}>
          <div class="col-start-2 row-start-2 text-right shrink-0">
            {props.secondaryValue!()}
          </div>
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
