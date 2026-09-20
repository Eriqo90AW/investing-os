import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { Bot, Filter, RotateCcw, Target } from "lucide-solid";
import { closeAgent, type AgentMessage as AgentMessageModel } from "~/lib/agent/store";
import { AgentMarkdown } from "./AgentMarkdown";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * One conversation bubble. User messages hug the right in the accent fill;
 * assistant messages sit left with a bot avatar, markdown body, optional
 * action card (setup draft / screener), and a Retry affordance on errors.
 */
export function AgentMessage(props: { message: AgentMessageModel; onRetry: (prompt: string) => void }) {
  const m = () => props.message;

  if (m().role === "system") {
    return <p class="py-50 text-center text-50 italic text-caption">{m().content}</p>;
  }

  const isUser = m().role === "user";

  return (
    <div class="flex items-start gap-100">
      <Show when={!isUser}>
        <span class="mt-[2px] grid size-6 shrink-0 place-items-center rounded-100 bg-accent-fill text-on-accent" aria-hidden="true">
          <Bot size={13} />
        </span>
      </Show>

      <div class="min-w-0 max-w-[85%]" classList={{ "ml-auto": isUser }}>
        <div
          class="rounded-200 px-150 py-100 text-100 leading-[150%]"
          classList={{
            "rounded-br-50 bg-accent-fill text-on-accent": isUser,
            "rounded-bl-50 border border-line bg-surface-2 text-ink": !isUser && !m().error,
            "rounded-bl-50 border border-reminder bg-reminder-bg text-ink": !isUser && m().error,
          }}
        >
          <Show when={isUser} fallback={<AgentMarkdown text={m().content} />}>
            <p class="whitespace-pre-wrap">{m().content}</p>
          </Show>

          {/* Action card: the local action behind this reply, with a jump link. */}
          <Show when={m().action === "create_setup_draft" || m().action === "create_screener"}>
            <div class="mt-100 flex items-center gap-100 rounded-100 border border-line bg-surface-1 px-150 py-100">
              <span class="grid size-7 shrink-0 place-items-center rounded-100 bg-official-bg text-accent">
                {m().action === "create_setup_draft" ? <Target size={13} /> : <Filter size={13} />}
              </span>
              <span class="min-w-0 flex-1 text-75 font-600 text-ink">
                {m().action === "create_setup_draft" ? "Setup draft created" : "Screener saved"}
              </span>
              <A
                href={m().link?.href ?? "#"}
                onClick={closeAgent}
                class="inline-flex h-7 shrink-0 items-center rounded-50 border border-line px-100 text-75 font-700 text-accent transition-colors hover:bg-surface-2"
              >
                {m().link?.label ?? "Open"}
              </A>
            </div>
          </Show>

          {/* Retry on a failed relay request. */}
          <Show when={m().error}>
            <button
              type="button"
              onClick={() => props.onRetry(m().retryPrompt ?? m().content)}
              class="mt-100 inline-flex h-7 items-center gap-50 rounded-50 border border-line bg-surface-1 px-100 text-75 font-700 text-ink transition-colors hover:bg-surface-2 cursor-pointer"
            >
              <RotateCcw size={12} /> Retry
            </button>
          </Show>
        </div>

        <p class="mt-50 text-50 tabular-nums text-caption" classList={{ "text-right": isUser }}>
          {formatTime(m().createdAt)}
        </p>
      </div>
    </div>
  );
}