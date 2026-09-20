import { Show, createEffect } from "solid-js";
import { Send, Square } from "lucide-solid";

interface AgentComposerProps {
  value: string;
  busy: boolean;
  textareaRef?: (el: HTMLTextAreaElement) => void;
  onInput: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
}

const MAX_HEIGHT = 144;

/** Auto-growing composer: Enter sends, Shift+Enter inserts a newline. */
export function AgentComposer(props: AgentComposerProps) {
  let textarea: HTMLTextAreaElement | undefined;

  const grow = () => {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  };

  // Reset the box after a submit clears the prompt.
  createEffect(() => {
    if (!props.value && textarea) textarea.style.height = "auto";
  });

  return (
    <div class="shrink-0 border-t border-line p-100">
      <div class="flex items-end gap-100 rounded-100 border border-line bg-surface-2 px-100 py-75 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
        <textarea
          ref={el => {
            textarea = el;
            props.textareaRef?.(el);
          }}
          value={props.value}
          onInput={event => {
            props.onInput(event.currentTarget.value);
            grow();
          }}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
              event.preventDefault();
              props.onSubmit();
            }
          }}
          rows={1}
          placeholder="Ask the agent, or try a suggestion…"
          aria-label="Message the agent"
          class="min-w-0 flex-1 resize-none bg-transparent px-50 py-50 text-100 text-ink outline-none placeholder:text-caption"
        />
        <button
          type="button"
          onClick={() => (props.busy ? props.onStop() : props.onSubmit())}
          disabled={!props.busy && !props.value.trim()}
          class="grid size-9 shrink-0 place-items-center rounded-100 bg-accent-fill text-on-accent transition-colors hover:bg-accent-fill-hover disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          aria-label={props.busy ? "Stop generating" : "Send message"}
        >
          <Show when={props.busy} fallback={<Send size={15} />}>
            <Square size={13} />
          </Show>
        </button>
      </div>
    </div>
  );
}