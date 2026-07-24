// HUD Report Renderer - AI Project Intelligence Platform
// Path: src/components/ReportView.tsx
// Turns the Claude-authored markdown report into a Predator/HUD-styled readout
// instead of dumping raw '##', '**', '--' markers on screen.

'use client';

import React from 'react';

// Render inline **bold** spans inside a line of text.
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyBase}-${i}`} className="text-cyan-200 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>;
  });
}

// Split a leading emoji off a heading so we can render it as a HUD glyph.
function splitEmoji(text: string): { glyph: string | null; label: string } {
  const m = text.match(
    /^([\p{Emoji_Presentation}\p{Extended_Pictographic}☀-➿]+)\s*(.*)$/u
  );
  if (m) return { glyph: m[1], label: m[2] };
  return { glyph: null, label: text };
}

export default function ReportView({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return (
      <div className="hud-empty">
        <span className="hud-empty-dot" />
        AWAITING INTEL — run the daily report to populate this feed.
      </div>
    );
  }

  const lines = markdown.split('\n');
  const out: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listKind: 'ul' | 'ol' | null = null;

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={key} className={`hud-list ${listKind === 'ol' ? 'hud-list--num' : ''}`}>
        {listBuffer}
      </ul>
    );
    listBuffer = [];
    listKind = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const t = line.trim();

    // Dividers and blanks — end any open list.
    if (t === '' || /^-{2,}$/.test(t) || /^={2,}$/.test(t) || /^\*{3,}$/.test(t)) {
      flushList(`fl-${idx}`);
      return;
    }

    // H1 — report title
    if (t.startsWith('# ')) {
      flushList(`fl-${idx}`);
      out.push(
        <h2 key={idx} className="hud-title">
          {renderInline(t.replace(/^#\s+/, ''), `t-${idx}`)}
        </h2>
      );
      return;
    }

    // H2 — section header (with optional emoji glyph)
    if (t.startsWith('## ')) {
      flushList(`fl-${idx}`);
      const { glyph, label } = splitEmoji(t.replace(/^##\s+/, ''));
      out.push(
        <div key={idx} className="hud-section">
          {glyph && <span className="hud-glyph">{glyph}</span>}
          <span className="hud-section-label">{renderInline(label, `s-${idx}`)}</span>
          <span className="hud-section-rule" />
        </div>
      );
      return;
    }

    // H3 — sub label
    if (t.startsWith('### ')) {
      flushList(`fl-${idx}`);
      out.push(
        <h4 key={idx} className="hud-sub">
          {renderInline(t.replace(/^###\s+/, ''), `h3-${idx}`)}
        </h4>
      );
      return;
    }

    // Ordered list item
    const ol = t.match(/^(\d+)\.\s+(.*)$/);
    if (ol) {
      if (listKind !== 'ol') flushList(`fl-${idx}`);
      listKind = 'ol';
      listBuffer.push(
        <li key={idx} className="hud-item">
          <span className="hud-index">{ol[1].padStart(2, '0')}</span>
          <span>{renderInline(ol[2], `oli-${idx}`)}</span>
        </li>
      );
      return;
    }

    // Unordered list item
    const ul = t.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listKind !== 'ul') flushList(`fl-${idx}`);
      listKind = 'ul';
      listBuffer.push(
        <li key={idx} className="hud-item">
          <span className="hud-marker" />
          <span>{renderInline(ul[1], `uli-${idx}`)}</span>
        </li>
      );
      return;
    }

    // Bold-only line acts as an inline label (e.g. **In Progress:**)
    if (/^\*\*[^*]+\*\*:?\s*$/.test(t)) {
      flushList(`fl-${idx}`);
      out.push(
        <div key={idx} className="hud-label">
          {t.replace(/\*\*/g, '')}
        </div>
      );
      return;
    }

    // Plain paragraph
    flushList(`fl-${idx}`);
    out.push(
      <p key={idx} className="hud-p">
        {renderInline(t, `p-${idx}`)}
      </p>
    );
  });

  flushList('fl-final');

  return <div className="hud-report">{out}</div>;
}
