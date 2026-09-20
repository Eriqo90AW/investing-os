import { Show } from "solid-js";
import { Bot } from "lucide-solid";

interface AgentLauncherProps {
  busy: boolean;
  onOpen: () => void;
  ref?: (el: HTMLButtonElement) => void;
}

/**
 * Collapsed-state entry point: an accent pill that floats above the mobile
 * dock (bottom-[84px] clears the 56px dock + 12px gap) and sits at the
 * bottom-right corner on desktop. One position on every route, so it never
 * jumps between pages.
 */
export function AgentLauncher(props: AgentLauncherProps) {
  return (
    <button
      ref={props.ref}
      type="button"
      onClick={props.onOpen}
      aria-expanded="false"
      aria-controls="agent-panel"
      title="Open agent (Ctrl+Enter)"
      class="fixed right-200 bottom-[84px] z-[45] inline-flex h-12 items-center gap-100 rounded-300 bg-accent-fill px-200 text-on-accent shadow-overlay transition-colors hover:bg-accent-fill-hover cursor-pointer md:bottom-200"
    >
      <span class="relative grid size-6 place-items-center">
        <Bot size={18} />
        <Show when={props.busy}>
          <span class="agent-pulse absolute -right-50 -top-50 size-2 rounded-full bg-on-accent" aria-hidden="true" />
        </Show>
      </span>
      <span
        class="hidden h-5 items-center gap-[2px] rounded-50 border border-on-accent/30 px-100 text-50 font-600 text-on-accent/80 sm:inline-flex"
        aria-hidden="true"
      >
        Ctrl+Enter
      </span>
    </button>
  );
}