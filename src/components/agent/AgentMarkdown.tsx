import { For, type JSX } from "solid-js";

/**
 * AgentMarkdown — a deliberately small, dependency-free renderer for LLM
 * replies. Handles paragraphs, fenced code, bullet/numbered lists, and inline
 * **bold** / *italic* / `code`. Everything is built as Solid JSX (never
 * innerHTML), so model output is always inert text.
 */

type Block =
  | { kind: "code"; text: string }
  | { kind: "text"; text: string };

type Paragraph =
  | { kind: "list"; items: string[] }
  | { kind: "p"; text: string };

const LIST_LINE = /^\s*(?:[-*]|\d+\.)\s+/;

function renderInline(text: string): JSX.Element[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return <strong>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code class="rounded-10 border border-line bg-surface-1 px-50 py-[1px] font-mono text-75">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

function TextBlocks(props: { text: string }) {
  const blocks = (): Paragraph[] => {
    const result: Paragraph[] = [];
    for (const rawBlock of props.text.split(/\n\s*\n/)) {
      const lines = rawBlock.split("\n").map(line => line.trim()).filter(Boolean);
      let index = 0;
      while (index < lines.length) {
        if (LIST_LINE.test(lines[index]!)) {
          const items: string[] = [];
          while (index < lines.length && LIST_LINE.test(lines[index]!)) {
            items.push(lines[index]!.replace(LIST_LINE, ""));
            index += 1;
          }
          result.push({ kind: "list", items });
        } else {
          const paragraphLines: string[] = [];
          while (index < lines.length && !LIST_LINE.test(lines[index]!)) {
            paragraphLines.push(lines[index]!);
            index += 1;
          }
          result.push({ kind: "p", text: paragraphLines.join(" ") });
        }
      }
    }
    return result;
  };

  return (
    <For each={blocks()}>
      {block =>
        block.kind === "list" ? (
          <ul class="list-disc space-y-50 pl-200">
            <For each={block.items}>{item => <li>{renderInline(item)}</li>}</For>
          </ul>
        ) : (
          <p>{renderInline(block.text)}</p>
        )
      }
    </For>
  );
}

export function AgentMarkdown(props: { text: string }) {
  const blocks = (): Block[] => {
    const raw = props.text.replace(/\r\n/g, "\n");
    const parts: Block[] = [];
    const fence = /```\w*\r?\n([\s\S]*?)```/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = fence.exec(raw)) !== null) {
      if (match.index > last) parts.push({ kind: "text", text: raw.slice(last, match.index) });
      parts.push({ kind: "code", text: (match[1] ?? "").replace(/\n$/, "") });
      last = fence.lastIndex;
    }
    if (last < raw.length) parts.push({ kind: "text", text: raw.slice(last) });
    return parts;
  };

  return (
    <div class="space-y-100">
      <For each={blocks()}>
        {block =>
          block.kind === "code" ? (
            <pre class="overflow-x-auto rounded-100 border border-line bg-surface-1 px-150 py-100 text-75">
              <code class="font-mono">{block.text}</code>
            </pre>
          ) : (
            <TextBlocks text={block.text} />
          )
        }
      </For>
    </div>
  );
}