import { Show, type JSX, createEffect, on, onCleanup, onMount } from "solid-js";
import { X } from "lucide-solid";

export interface ModalProps {
  open: boolean;
  title: string;
  /** Close button label for screen readers. */
  closeLabel?: string;
  /** Body scroll lock while open. Defaults to true. */
  lockScroll?: boolean;
  /** Max panel width. Defaults to "760px". */
  width?: string;
  onClose: () => void;
  children: JSX.Element;
  footer?: JSX.Element;
}

/**
 * Shared modal shell — the command-palette pattern promoted to a component.
 * `shadow-overlay` and `radius-300` are the elevation/radius steps the design
 * system reserves for things that genuinely float (§5).
 *
 * Focus is managed the simple, honest way: on open, focus moves to the panel
 * itself (the panel carries `tabindex="-1"`), and on close focus returns to
 * whatever the trigger had. Escape closes. Overlay mousedown closes, so a
 * drag-select inside the panel never dismisses it.
 */
export function Modal(props: ModalProps) {
  let panel: HTMLDivElement | undefined;
  let restoreFocus: HTMLElement | null = null;

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && props.open) {
        event.stopPropagation();
        props.onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  createEffect(
    on(
      () => props.open,
      open => {
        if (!open) return;
        restoreFocus = document.activeElement as HTMLElement | null;
        queueMicrotask(() => panel?.focus());
        if (props.lockScroll !== false) {
          const prev = document.body.style.overflow;
          document.body.style.overflow = "hidden";
          onCleanup(() => {
            document.body.style.overflow = prev;
          });
        }
        onCleanup(() => {
          restoreFocus?.focus?.();
        });
      },
      { defer: true },
    ),
  );

  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-50 overflow-y-auto px-200 py-[6vh] bg-[var(--c-color-overlay-bg)]"
        role="presentation"
        onMouseDown={event => event.target === event.currentTarget && props.onClose()}
      >
        <div
          ref={panel}
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          aria-label={props.title}
          class="mx-auto flex max-h-[86vh] flex-col overflow-hidden rounded-300 border border-line bg-surface-1 shadow-overlay outline-none"
          style={{ width: "100%", "max-width": props.width ?? "760px" }}
        >
          <header class="flex shrink-0 items-center justify-between gap-200 border-b border-line px-250 py-200">
            <h2 class="text-300 font-700 tracking-[-.01em] text-ink">{props.title}</h2>
            <button
              type="button"
              onClick={props.onClose}
              class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-100 text-caption transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label={props.closeLabel ?? "Close dialog"}
            >
              <X size={16} />
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto">{props.children}</div>

          <Show when={props.footer}>
            <div class="shrink-0 border-t border-line bg-surface-2 px-250 py-200">
              {props.footer}
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
