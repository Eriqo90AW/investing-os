import { For } from "solid-js";
import { mode, setMode, type ThemeMode } from "~/lib/theme";

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "system", label: "Auto" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle() {
  return (
    <div
      role="group"
      aria-label="Theme"
      class="flex items-center p-[3px] rounded-100 bg-surface-2 border border-line"
    >
      <For each={MODES}>
        {m => (
          <button
            type="button"
            aria-pressed={mode() === m.value}
            onClick={() => setMode(m.value)}
            class="px-100 h-7 rounded-50 text-75 font-600 transition cursor-pointer"
            classList={{
              "bg-surface-1 text-ink shadow-tiny": mode() === m.value,
              "text-muted hover:text-ink": mode() !== m.value,
            }}
          >
            {m.label}
          </button>
        )}
      </For>
    </div>
  );
}
