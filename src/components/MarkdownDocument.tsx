import { Fragment, type ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded-md border border-foreground/15 bg-background px-1.5 py-0.5 font-mono text-[0.95em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const isExternal = /^https?:\/\//.test(href);
        parts.push(
          <a
            key={match.index}
            href={href}
            className="underline underline-offset-4 transition-colors hover:text-foreground"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
          >
            {label}
          </a>,
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function MarkdownDocument({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={i} className="font-display text-4xl font-black leading-tight sm:text-5xl">
          {renderInline(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={i} className="pt-3 font-display text-2xl font-black leading-tight sm:text-3xl">
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith("- ")) {
        items.push(lines[j].slice(2));
        j++;
      }

      blocks.push(
        <ul key={i} className="space-y-3 pl-6 text-base leading-7 text-foreground/90">
          {items.map((item, index) => (
            <li key={index} className="list-disc">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      i = j;
      continue;
    }

    const paragraphLines: string[] = [];
    let j = i;
    while (
      j < lines.length &&
      lines[j].trim() &&
      !lines[j].startsWith("# ") &&
      !lines[j].startsWith("## ") &&
      !lines[j].startsWith("- ")
    ) {
      paragraphLines.push(lines[j].trim());
      j++;
    }

    const paragraph = paragraphLines.join(" ");
    blocks.push(
      <p key={i} className="text-base leading-7 text-foreground/90">
        {renderInline(paragraph)}
      </p>,
    );
    i = j;
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <Fragment key={index}>{block}</Fragment>
      ))}
    </div>
  );
}
