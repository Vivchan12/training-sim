// A tag-balance check for the generated pages.
//
// Browsers silently recover from mismatched tags, so a page can look fine in a
// contrast or landmark audit while its DOM is quietly wrong. That is exactly
// how five <article> elements ended up closed with </button>: each one nested
// inside the last, and nothing failed until it was looked at.

const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

export function checkHtml(html, label = 'document') {
  // Script and style bodies are not markup; neither are comments.
  const src = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '<$1></$1>');

  const stack = [];
  const errors = [];
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = tag.exec(src)) !== null) {
    const [whole, slash, rawName, attrs] = m;
    const name = rawName.toLowerCase();
    if (VOID.has(name) || attrs.trimEnd().endsWith('/')) continue;
    const line = src.slice(0, m.index).split('\n').length;
    if (!slash) {
      stack.push({ name, line });
    } else {
      const open = stack.pop();
      if (!open) errors.push(`line ${line}: </${name}> with nothing open`);
      else if (open.name !== name) {
        errors.push(`line ${line}: </${name}> closes <${open.name}> opened on line ${open.line}`);
        // Keep going from a sane state so one slip does not cascade.
        stack.push(open);
        stack.pop();
      }
    }
  }
  for (const left of stack) errors.push(`line ${left.line}: <${left.name}> is never closed`);

  if (errors.length) {
    throw new Error(`${label}: malformed HTML\n  ` + errors.slice(0, 10).join('\n  ') +
      (errors.length > 10 ? `\n  …and ${errors.length - 10} more` : ''));
  }
}
