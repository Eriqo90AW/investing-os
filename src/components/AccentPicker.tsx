import { Show } from "solid-js";
import { accentHex, setAccentHex } from "~/lib/accent";

/**
 * The accent axis is open rather than a menu, so this is a colour input and
 * not a set of options. The swatch it shows is the *picked* colour; what the
 * page actually paints is the accent derived from it, which is a different
 * value and is spelled out on the spec page rather than hidden here.
 *
 * When no colour is picked the input still has to show something, so it shows
 * the palette's own fill — and the reset is hidden, because there is nothing
 * to reset to.
 */
export function AccentPicker() {
  const value = () => accentHex() ?? "#99e50b";

  return (
    <div
      class="flex items-center gap-[3px] p-[3px] rounded-100 bg-surface-2 border border-line"
      role="group"
      aria-label="Accent"
    >
      <label
        class="relative grid place-items-center w-7 h-7 rounded-50 cursor-pointer hover:bg-bg-1 transition"
        title="Pick an accent colour"
      >
        <span class="sr-only">Accent colour</span>
        <input
          type="color"
          class="accent-swatch"
          value={value()}
          onInput={e => setAccentHex(e.currentTarget.value.toLowerCase())}
        />
        {/* The input's own swatch is the visual; this ring sits over it so the
            control reads like the other two toggles rather than like a form
            field. `pointer-events-none` keeps the click on the input. */}
        <span
          class="pointer-events-none absolute inset-[6px] rounded-full ring-1 ring-inset"
          classList={{
            "ring-ink/25": accentHex() !== null,
            "ring-black/10": accentHex() === null,
          }}
        />
      </label>

      <Show
        when={accentHex() !== null}
        fallback={<span class="px-100 text-75 font-600 text-caption">Auto</span>}
      >
        <button
          type="button"
          onClick={() => setAccentHex(null)}
          title="Back to the palette's own accent"
          class="px-100 h-7 rounded-50 text-75 font-600 text-muted hover:text-ink transition cursor-pointer"
        >
          Reset
        </button>
      </Show>
    </div>
  );
}
