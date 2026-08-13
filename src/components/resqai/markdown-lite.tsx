/**
 * Tiny, dependency-free markdown renderer for RESQ AI answers.
 * Supports headings, bold, italics, inline code, bullet and numbered lists.
 */
import type { ReactNode } from "react";

function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyBase}-i${index}`;
    index += 1;
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const { ordered, items } = list;
    const key = `list-${blocks.length}`;
    blocks.push(
      ordered ? (
        <ol key={key} className="ml-1 list-decimal space-y-1 pl-4">
          {items.map((item, i) => (
            <li key={`${key}-${i}`}>{inline(item, `${key}-${i}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="ml-1 list-disc space-y-1 pl-4">
          {items.map((item, i) => (
            <li key={`${key}-${i}`}>{inline(item, `${key}-${i}`)}</li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  lines.forEach((raw, lineIndex) => {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ordered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);

    if (bullet) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      return;
    }
    if (ordered) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[2]);
      return;
    }
    flush();
    if (!line.trim()) return;
    if (heading) {
      blocks.push(
        <p key={`h-${lineIndex}`} className="text-sm font-semibold">
          {inline(heading[2], `h-${lineIndex}`)}
        </p>,
      );
      return;
    }
    blocks.push(<p key={`p-${lineIndex}`}>{inline(line, `p-${lineIndex}`)}</p>);
  });
  flush();

  return <div className={`space-y-2 text-sm leading-relaxed ${className ?? ""}`}>{blocks}</div>;
}
