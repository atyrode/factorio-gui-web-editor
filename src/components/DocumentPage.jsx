import { Fragment, useState } from "react";
import { docPages } from "../docs.js";
import { atomCompletion, atomFieldStates, factorioAtomRegistry } from "../factorioAtomRegistry.js";

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

function AtomStatusBadge({ state }) {
  const status = atomFieldStates[state] ?? atomFieldStates.missing;

  return (
    <span className={`fx-atom-status fx-atom-status--${state}`} title={status.description}>
      {status.label}
    </span>
  );
}

function formatAtomValue(value) {
  if (value === null || value === undefined) {
    return "undefined";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function AtomTrackingSection({ title, items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="fx-atom-tracking__group">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function AtomProgressBar({ atom, compact = false }) {
  const completion = atomCompletion(atom);

  return (
    <div className={`fx-atom-progress ${compact ? "fx-atom-progress--compact" : ""}`}>
      <div
        className="fx-atom-progress__bar"
        aria-label={`${atom.name} overall progress ${completion}%`}
        role="img"
      >
        {atom.progress.map((dimension) => (
          <span
            className={`fx-atom-progress__segment fx-atom-progress__segment--${dimension.id}`}
            key={dimension.id}
            style={{ width: `${dimension.value / atom.progress.length}%` }}
            title={`${dimension.label}: ${dimension.value}% - ${dimension.description}`}
          />
        ))}
      </div>
      {!compact ? (
        <div className="fx-atom-progress__legend">
          {atom.progress.map((dimension) => (
            <span className={`fx-atom-progress__item fx-atom-progress__item--${dimension.id}`} key={dimension.id}>
              <strong>{dimension.value}%</strong>
              <span>{dimension.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AtomCapture({ capture }) {
  return (
    <details className="fx-atom-capture">
      <summary>
        <span>{capture.label}</span>
        <code>{capture.source}</code>
      </summary>
      <dl className="fx-atom-capture__meta">
        {capture.screenTitle ? (
          <div>
            <dt>Screen</dt>
            <dd>{capture.screenTitle}</dd>
          </div>
        ) : null}
        {capture.className ? (
          <div>
            <dt>Class</dt>
            <dd>{capture.className}</dd>
          </div>
        ) : null}
        {capture.style ? (
          <div>
            <dt>Style</dt>
            <dd>{capture.style}</dd>
          </div>
        ) : null}
      </dl>
      <div className="fx-atom-capture__table" role="table" aria-label={`${capture.label} fields`}>
        <div className="fx-atom-capture__row is-heading" role="row">
          <span role="columnheader">Field</span>
          <span role="columnheader">Type</span>
          <span role="columnheader">Example</span>
          <span role="columnheader">Note</span>
        </div>
        {[...capture.rows, ...(capture.children?.length ? [{ name: "children", type: "section", example: "", note: "" }] : []), ...(capture.children ?? [])].map(
          (row, index) => (
            <div
              className={`fx-atom-capture__row ${row.name === "children" ? "is-section" : ""}`}
              key={`${capture.id}-${row.name}-${index}`}
              role="row"
            >
              <span role="cell">{row.name}</span>
              <span role="cell">{row.type}</span>
              <span role="cell">{formatAtomValue(row.example)}</span>
              <span role="cell">{row.note}</span>
            </div>
          )
        )}
      </div>
    </details>
  );
}

function AtomTracker() {
  const [selectedAtomId, setSelectedAtomId] = useState(factorioAtomRegistry[0]?.id ?? null);
  const selectedAtom =
    factorioAtomRegistry.find((atom) => atom.id === selectedAtomId) ?? factorioAtomRegistry[0];

  if (!selectedAtom) {
    return null;
  }

  return (
    <section className="fx-atom-tracker" aria-label="Factorio atom implementation tracker">
      <div className="fx-atom-tracker__header">
        <h2>Atom Implementation Tracker</h2>
        <p>
          Track each Factorio GUI atom across evidence, model, renderer, Lua
          export, and behavior readiness.
        </p>
      </div>
      <div className="fx-atom-tracker__grid">
        <div className="fx-atom-list" role="listbox" aria-label="GUI atoms">
          {factorioAtomRegistry.map((atom) => {
            const selected = atom.id === selectedAtom.id;

            return (
              <button
                aria-selected={selected}
                className={selected ? "is-selected" : ""}
                key={atom.id}
                onClick={() => setSelectedAtomId(atom.id)}
                role="option"
                type="button"
              >
                <span className="fx-atom-list__name">{atom.name}</span>
                <span className="fx-atom-list__meta">{atom.availability}</span>
                <AtomProgressBar atom={atom} compact />
              </button>
            );
          })}
        </div>

        <div className="fx-atom-detail">
          <div className="fx-atom-detail__summary">
            <div>
              <h3>{selectedAtom.name}</h3>
              <p>{selectedAtom.summary}</p>
            </div>
            <div className="fx-atom-detail__completion">
              <strong>{atomCompletion(selectedAtom)}%</strong>
              <span>overall</span>
            </div>
          </div>
          <AtomProgressBar atom={selectedAtom} />
          <dl className="fx-atom-detail__facts">
            <div>
              <dt>Primitive</dt>
              <dd>{selectedAtom.primitive}</dd>
            </div>
            <div>
              <dt>Style</dt>
              <dd>{selectedAtom.style}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>{selectedAtom.availability}</dd>
            </div>
            {selectedAtom.className ? (
              <div>
                <dt>Class</dt>
                <dd>{selectedAtom.className}</dd>
              </div>
            ) : null}
            {selectedAtom.derivedFrom ? (
              <div>
                <dt>Derived from</dt>
                <dd>{selectedAtom.derivedFrom}</dd>
              </div>
            ) : null}
          </dl>
          {selectedAtom.tracking?.document ? (
            <p className="fx-atom-detail__document">{selectedAtom.tracking.document}</p>
          ) : null}
          <div className="fx-atom-tracking">
            <AtomTrackingSection title="Implemented" items={selectedAtom.tracking?.implemented} />
            <AtomTrackingSection title="Assumptions" items={selectedAtom.tracking?.assumptions} />
            <AtomTrackingSection title="Hardcoded" items={selectedAtom.tracking?.hardcoded} />
            <AtomTrackingSection title="Missing" items={selectedAtom.tracking?.missing} />
            <AtomTrackingSection title="Notes" items={selectedAtom.tracking?.notes} />
          </div>
          <div className="fx-atom-fields">
            {selectedAtom.fields.map((entry) => (
              <div className="fx-atom-field" key={`${selectedAtom.id}-${entry.name}`}>
                <div className="fx-atom-field__topline">
                  <strong>{entry.name}</strong>
                  <AtomStatusBadge state={entry.state} />
                </div>
                <div className="fx-atom-field__meta">
                  {entry.type ? <span>type: <code>{entry.type}</code></span> : null}
                  {entry.example !== null && entry.example !== undefined ? (
                    <span>example: <code>{formatAtomValue(entry.example)}</code></span>
                  ) : null}
                  {entry.source ? <span>source: <code>{entry.source}</code></span> : null}
                </div>
                <p>{entry.note}</p>
              </div>
            ))}
          </div>
          {selectedAtom.captures?.length ? (
            <div className="fx-atom-captures">
              <h4>Captures</h4>
              {selectedAtom.captures.map((capture) => (
                <AtomCapture capture={capture} key={capture.id} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
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
        {page.path === "/model-schema" ? <AtomTracker /> : null}
        <MarkdownBlocks markdown={page.markdown} />
      </article>
    </main>
  );
}
