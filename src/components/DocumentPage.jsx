import { Fragment } from "react";
import { docPages } from "../docs.js";

function MarkdownLink({ href, children }) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function renderInline(text) {
  const nodes = [];
  const inlinePattern =
    /(`[^`]+`)|\[([^\]]+)\]\(([^)]+)\)|<((?:https?:\/\/)[^>]+)>|(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    }

    if (match[1]) {
      nodes.push(<code key={`code-${match.index}`}>{match[1].slice(1, -1)}</code>);
    } else if (match[2] && match[3]) {
      nodes.push(
        <MarkdownLink key={`link-${match.index}`} href={match[3]}>
          {match[2]}
        </MarkdownLink>
      );
    } else {
      const href = match[4] || match[5];
      nodes.push(
        <MarkdownLink key={`url-${match.index}`} href={href}>
          {href}
        </MarkdownLink>
      );
    }

    lastIndex = inlinePattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`text-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function MarkdownBlocks({ markdown }) {
  const blocks = [];
  const lines = markdown.split("\n");
  let index = 0;

  function startsList(line) {
    return /^-\s+/.test(line) || /^\d+\.\s+/.test(line);
  }

  function startsBlock(line, lineIndex) {
    return (
      !line.trim() ||
      line.startsWith("```") ||
      /^(#{1,4})\s+/.test(line) ||
      startsList(line) ||
      (line.includes("|") && lineIndex + 1 < lines.length && isTableSeparator(lines[lineIndex + 1]))
    );
  }

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push(
        <pre key={blocks.length}>
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const HeadingTag = `h${heading[1].length}`;
      blocks.push(<HeadingTag key={blocks.length}>{renderInline(heading[2])}</HeadingTag>);
      index += 1;
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = parseTableRow(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className="fx-markdown-table" key={blocks.length}>
          <table>
            <thead>
              <tr>
                {headers.map((header, headerIndex) => (
                  <th key={headerIndex}>{renderInline(header)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex}>{renderInline(row[cellIndex] || "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        const itemLines = [lines[index].replace(/^-\s+/, "").trim()];
        index += 1;
        while (index < lines.length && lines[index].startsWith("  ") && lines[index].trim()) {
          itemLines.push(lines[index].trim());
          index += 1;
        }
        items.push(itemLines.join(" "));
      }
      blocks.push(
        <ul key={blocks.length}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        const itemLines = [lines[index].replace(/^\d+\.\s+/, "").trim()];
        index += 1;
        while (index < lines.length && lines[index].startsWith("  ") && lines[index].trim()) {
          itemLines.push(lines[index].trim());
          index += 1;
        }
        items.push(itemLines.join(" "));
      }
      blocks.push(
        <ol key={blocks.length}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !startsBlock(lines[index], index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={blocks.length}>{renderInline(paragraph.join(" "))}</p>);
  }

  return blocks;
}

export function DocumentPage({ page, onNavigate }) {
  return (
    <main className="fx-document-shell">
      <aside className="fx-docnav" aria-label="Document navigation">
        <a href="/" onClick={(event) => onNavigate(event, "/")}>
          Editor
        </a>
        <a href="/style-atlas" onClick={(event) => onNavigate(event, "/style-atlas")}>
          Style Atlas
        </a>
        {docPages.map((docPage) => (
          <a
            key={docPage.path}
            href={docPage.path}
            aria-current={docPage.path === page.path ? "page" : undefined}
            onClick={(event) => onNavigate(event, docPage.path)}
          >
            {docPage.title}
          </a>
        ))}
      </aside>

      <article className="fx-document">
        <header>
          <h1>{page.title}</h1>
          <p>{page.summary}</p>
        </header>
        <MarkdownBlocks markdown={page.markdown} />
      </article>
    </main>
  );
}
