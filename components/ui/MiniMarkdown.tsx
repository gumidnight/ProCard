import { Fragment, type ReactNode } from "react";

/**
 * Tiny, safe inline-Markdown renderer for short user text (bios, etc.).
 *
 * Supports the Discord-style subset people actually use in a one-liner:
 *   **bold**  *italic*  _italic_  ~~strike~~  `code`
 *   [label](https://…)   bare https:// links   newlines → <br/>
 *
 * Security: output is built as React nodes (text is auto-escaped, never
 * dangerouslySetInnerHTML) and link hrefs are restricted to http(s)/mailto,
 * so there is no HTML/script injection surface.
 */

// Ordered alternation. Group index → token type:
//  1 code · 2 link · 3 bold · 4 strike · 5 italic(*) · 6 italic(_) · 7 autolink
// Emphasis bodies prefer the shortest match (single \S first) so one stray
// marker can't swallow the rest of the line. `_` italics require word
// boundaries (Discord-style) so snake_case / file_names / URLs stay literal.
const INLINE_RE =
  /(`[^`]+?`)|(\[[^\]]+?\]\((?:https?:\/\/|mailto:)[^\s)]+?\))|(\*\*(?:\S|\S[\s\S]*?\S)\*\*)|(~~(?:\S|\S[\s\S]*?\S)~~)|(\*(?:\S|\S[\s\S]*?\S)\*)|((?<!\w)_(?:\S|\S[\s\S]*?\S)_(?!\w))|(https?:\/\/[^\s]+)/;

const LINK_RE = /^\[([^\]]+?)\]\(([^\s)]+?)\)$/;
const TRAILING_PUNCT_RE = /[.,!?;:]+$/;

function sanitizeUrl(url: string): string | null {
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u)) return u;
  return null;
}

const linkClass =
  "text-accent-hover underline underline-offset-2 transition-colors hover:text-accent";

function anchor(href: string, children: ReactNode, key: string) {
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={linkClass}
    >
      {children}
    </a>
  );
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let i = 0;

  while (remaining) {
    const m = INLINE_RE.exec(remaining);
    if (!m) {
      nodes.push(remaining);
      break;
    }
    if (m.index > 0) nodes.push(remaining.slice(0, m.index));

    const token = m[0];
    const key = `${keyPrefix}-${i++}`;

    if (m[1]) {
      // `code` — inner is literal (no nested markdown)
      nodes.push(
        <code
          key={key}
          className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-text-primary"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (m[2]) {
      // [label](url)
      const lm = LINK_RE.exec(token);
      const href = lm ? sanitizeUrl(lm[2]) : null;
      nodes.push(lm && href ? anchor(href, parseInline(lm[1], key), key) : token);
    } else if (m[3]) {
      nodes.push(
        <strong key={key} className="font-semibold text-text-primary">
          {parseInline(token.slice(2, -2), key)}
        </strong>,
      );
    } else if (m[4]) {
      nodes.push(<s key={key}>{parseInline(token.slice(2, -2), key)}</s>);
    } else if (m[5] || m[6]) {
      nodes.push(<em key={key}>{parseInline(token.slice(1, -1), key)}</em>);
    } else if (m[7]) {
      // Bare URL — keep trailing sentence punctuation outside the link.
      let url = token;
      let trail = "";
      const tp = TRAILING_PUNCT_RE.exec(url);
      if (tp) {
        trail = tp[0];
        url = url.slice(0, -trail.length);
      }
      const href = sanitizeUrl(url);
      nodes.push(href ? anchor(href, url, key) : url);
      if (trail) nodes.push(trail);
    }

    remaining = remaining.slice(m.index + token.length);
  }

  return nodes;
}

export function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {parseInline(line, `l${i}`)}
        </Fragment>
      ))}
    </>
  );
}
