export const INLINE_MARKDOWN_PATTERN = /(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g;

export function parseMarkdownBlocks(value) {
  const lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;
  let quote = [];
  let code = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', content: paragraph.join(' ').trim() });
    paragraph = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) blocks.push({ type: 'quote', content: quote.join('\n').trim() });
    quote = [];
  };
  const flushTextBlocks = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  lines.forEach((line) => {
    const fence = line.match(/^\s*```\s*([^`]*)$/);
    if (fence) {
      if (code) {
        blocks.push({ type: 'code', language: code.language, content: code.lines.join('\n') });
        code = null;
      } else {
        flushTextBlocks();
        code = { language: fence[1].trim(), lines: [] };
      }
      return;
    }
    if (code) {
      code.lines.push(line);
      return;
    }
    if (!line.trim()) {
      flushTextBlocks();
      return;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) {
      flushTextBlocks();
      blocks.push({ type: 'heading', level: heading[1].length, content: heading[2].trim() });
      return;
    }

    const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
    const ordered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      flushQuote();
      const orderedList = Boolean(ordered);
      if (!list || list.ordered !== orderedList) flushList();
      if (!list) list = { type: 'list', ordered: orderedList, items: [] };
      list.items.push({ marker: ordered ? Number(ordered[1]) : null, content: (ordered?.[2] || unordered?.[1] || '').trim() });
      return;
    }

    const blockquote = line.match(/^\s*>\s?(.*)$/);
    if (blockquote) {
      flushParagraph();
      flushList();
      quote.push(blockquote[1]);
      return;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  });

  flushTextBlocks();
  if (code) blocks.push({ type: 'code', language: code.language, content: code.lines.join('\n') });
  return blocks.filter((block) => block.content || block.items?.length);
}

export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMarkdownToHtml(value) {
  return String(value || '').split(INLINE_MARKDOWN_PATTERN).filter(Boolean).map((part) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) return `<a href="${escapeHtml(link[2])}">${escapeHtml(link[1])}</a>`;
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
    if (part.startsWith('~~') && part.endsWith('~~')) return `<del>${escapeHtml(part.slice(2, -2))}</del>`;
    if (part.startsWith('`') && part.endsWith('`')) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) return `<em>${escapeHtml(part.slice(1, -1))}</em>`;
    return escapeHtml(part);
  }).join('');
}

export function markdownToHtml(value) {
  return parseMarkdownBlocks(value).map((block) => {
    if (block.type === 'heading') return `<h${Math.min(block.level + 2, 6)}>${inlineMarkdownToHtml(block.content)}</h${Math.min(block.level + 2, 6)}>`;
    if (block.type === 'list') {
      const tag = block.ordered ? 'ol' : 'ul';
      return `<${tag}>${block.items.map((item) => `<li>${inlineMarkdownToHtml(item.content)}</li>`).join('')}</${tag}>`;
    }
    if (block.type === 'quote') return `<blockquote>${inlineMarkdownToHtml(block.content)}</blockquote>`;
    if (block.type === 'code') return `<pre><code>${escapeHtml(block.content)}</code></pre>`;
    return `<p>${inlineMarkdownToHtml(block.content)}</p>`;
  }).join('');
}

function stripInlineMarkdown(value) {
  return String(value || '')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)\s]+\)/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*|__([^_\n]+)__/g, '$1$2')
    .replace(/~~([^~\n]+)~~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\*([^*\n]+)\*|_([^_\n]+)_/g, '$1$2');
}

export function markdownToPlainText(value) {
  return parseMarkdownBlocks(value).flatMap((block) => {
    if (block.type === 'list') return block.items.map((item, index) => `${block.ordered ? `${item.marker || index + 1}.` : '-'} ${stripInlineMarkdown(item.content)}`);
    return stripInlineMarkdown(block.content);
  }).join('\n');
}
