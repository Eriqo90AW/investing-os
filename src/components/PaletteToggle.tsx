import { For } from "solid-js";
import { PALETTES, palette, setPalette } from "~/lib/palette";

/**
 * Sibling of ThemeToggle, same shape on purpose: the two switches are the two
 * axes of the theme and should read as one control group.
 */
export function PaletteToggle() {
  return (
    <div
      role="group"
      aria-label="Palette"
      class="flex items-center p-[3px] rounded-100 bg-surface-2 border border-line"
    >
      <For each={PALETTES}>
        {p => (
          <button
            type="button"
            aria-pressed={palette() === p.id}
            title={p.note}
            onClick={() => setPalette(p.id)}
            class="px-100 h-7 rounded-50 text-75 font-600 transition cursor-pointer"
            classList={{
              "bg-surface-1 text-ink shadow-tiny": palette() === p.id,
              "text-muted hover:text-ink": palette() !== p.id,
            }}
          >
            {p.label}
          </button>
        )}
      </For>
    </div>
  );
}
