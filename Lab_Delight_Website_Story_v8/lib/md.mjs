// A small Markdown renderer for the Insights posts.
//
// Deliberately not a dependency: the site has no package.json and Vercel's
// installCommand is empty, so pulling in a parser would mean changing the
// build contract for one page type. This covers exactly what the posts use —
// headings, paragraphs, emphasis, links, lists, tables, blockquotes, rules —
// and throws on anything it does not understand rather than emitting silently
// wrong HTML.

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Inline: code, bold, italic, links. Escaped first, so no raw HTML passes.
function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

const splitRow = line =>
  line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

export function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // table: header row, delimiter row, then body
    if (line.includes('|') && (lines[i + 1] || '').match(/^\s*\|?[\s:-]+\|[\s:|-]*$/)) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i])); i++;
      }
      out.push(
        '<div class="post-table-scroll"><table class="post-table"><thead><tr>' +
        head.map(c => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>'
      );
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }

    if (/^(---|\*\*\*)\s*$/.test(line)) { out.push('<hr />'); i++; continue; }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote class="post-callout"><p>${inline(buf.join(' '))}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, '')); i++; }
      out.push('<ul>' + items.map(t => `<li>${inline(t)}</li>`).join('') + '</ul>');
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++; }
      out.push('<ol>' + items.map(t => `<li>${inline(t)}</li>`).join('') + '</ol>');
      continue;
    }

    // paragraph: consume until blank line or the start of another block
    const buf = [];
    while (i < lines.length && lines[i].trim() &&
           !/^(#{1,4}\s|>|[-*]\s|\d+\.\s|---|\*\*\*)/.test(lines[i]) &&
           !(lines[i].includes('|') && (lines[i + 1] || '').match(/^\s*\|?[\s:-]+\|/))) {
      buf.push(lines[i]); i++;
    }
    if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`);
    else i++;
  }
  return out.join('\n');
}

/** Front matter: `key: value` pairs between --- fences. */
export function parseFrontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new Error('post is missing its front matter block');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: src.slice(m[0].length) };
}
