import hljs from 'highlight.js';
import katex from 'katex';

export function renderMarkdown(content: string): string {
  if (!content) return '';

  let html = content;

  // 1. Math formulas ($$ ... $$ block math)
  html = html.replace(/(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$/g, (_, math) => {
    try {
      return `<div class="my-5 text-center overflow-x-auto py-2 px-4 rounded-xl bg-purple-500/5 border border-purple-500/10">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<pre class="text-rose-400 font-mono text-xs"><code>${math}</code></pre>`;
    }
  });

  // 2. Inline math ($ ... $)
  html = html.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<code>${math}</code>`;
    }
  });

  // 3. Fenced Code blocks (```lang ... ```)
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    let highlighted = '';
    try {
      if (validLang !== 'plaintext') {
        highlighted = hljs.highlight(code.trimEnd(), { language: validLang }).value;
      } else {
        highlighted = hljs.highlightAuto(code.trimEnd()).value;
      }
    } catch {
      highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    return `
      <div class="relative group my-5 rounded-xl overflow-hidden border border-white/10 bg-[#0b0e17] shadow-xl">
        <div class="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5 text-xs text-zinc-400">
          <span class="font-mono uppercase tracking-wider text-[11px] text-purple-400 font-semibold">${validLang}</span>
          <button class="copy-code-btn px-2.5 py-1 rounded-md text-[11px] bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1" data-code="${encodeURIComponent(code.trimEnd())}">
            <span>复制</span>
          </button>
        </div>
        <pre class="p-4 overflow-x-auto text-sm font-mono leading-relaxed"><code class="hljs ${validLang}">${highlighted}</code></pre>
      </div>
    `;
  });

  // 4. GitHub-style Callouts (> [!NOTE] ...)
  html = html.replace(
    /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)(?=(?:\n\n|\n(?!>)|$))/gm,
    (_, type, text) => {
      const t = type.toLowerCase();
      const labels: Record<string, { title: string; color: string; bg: string; icon: string }> = {
        note: { title: '注意 (Note)', color: 'text-blue-700 dark:text-blue-400', bg: 'border-blue-500 bg-blue-500/10 dark:border-blue-500/40 dark:bg-blue-500/5', icon: 'ℹ️' },
        tip: { title: '提示 (Tip)', color: 'text-emerald-700 dark:text-emerald-400', bg: 'border-emerald-500 bg-emerald-500/10 dark:border-emerald-500/40 dark:bg-emerald-500/5', icon: '💡' },
        important: { title: '重要 (Important)', color: 'text-purple-700 dark:text-purple-400', bg: 'border-purple-500 bg-purple-500/10 dark:border-purple-500/40 dark:bg-purple-500/5', icon: '⚡' },
        warning: { title: '警告 (Warning)', color: 'text-amber-800 dark:text-amber-400', bg: 'border-amber-500 bg-amber-500/10 dark:border-amber-500/40 dark:bg-amber-500/5', icon: '⚠️' },
        caution: { title: '警惕 (Caution)', color: 'text-rose-700 dark:text-rose-400', bg: 'border-rose-500 bg-rose-500/10 dark:border-rose-500/40 dark:bg-rose-500/5', icon: '🛑' },
      };

      const meta = labels[t] || labels.note;
      const cleanContent = text
        .split('\n')
        .map((line: string) => line.replace(/^>\s?/, ''))
        .join('<br/>');

      return `
        <div class="callout my-4 rounded-xl border-l-4 p-4 ${meta.bg}">
          <div class="flex items-center gap-2 font-semibold text-sm ${meta.color} mb-1.5">
            <span>${meta.icon}</span>
            <span>${meta.title}</span>
          </div>
          <div class="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-normal">${cleanContent}</div>
        </div>
      `;
    }
  );

  // 5. Standard Blockquotes (> text)
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="border-l-4 border-purple-500/60 bg-purple-500/5 pl-4 py-1.5 my-3 text-slate-700 dark:text-zinc-300 italic rounded-r-lg">$1</blockquote>');

  // 6. Headers (# Heading)
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-bold text-slate-700 dark:text-zinc-300 mt-4 mb-2">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-base font-bold text-slate-800 dark:text-zinc-200 mt-5 mb-2">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-lg font-bold text-slate-800 dark:text-zinc-100 mt-6 mb-2">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, (_, title) => {
    const id = title.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
    return `<h3 id="${id}" class="text-xl font-bold text-slate-900 dark:text-zinc-50 mt-7 mb-3 tracking-tight flex items-center group">${title}</h3>`;
  });
  html = html.replace(/^##\s+(.+)$/gm, (_, title) => {
    const id = title.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
    return `<h2 id="${id}" class="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight border-b border-slate-200 dark:border-white/10 pb-2">${title}</h2>`;
  });
  html = html.replace(/^#\s+(.+)$/gm, (_, title) => {
    const id = title.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
    return `<h1 id="${id}" class="text-3xl font-extrabold text-slate-900 dark:text-white mt-9 mb-5 tracking-tight">${title}</h1>`;
  });

  // 7. Horizontal Rules (--- or ***)
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="my-8 border-slate-200 dark:border-white/10" />');

  // 8. Task lists (- [ ] or - [x])
  html = html.replace(
    /^-\s*\[([ xX])\]\s*(.+)$/gm,
    (_, checked, text) => {
      const isChecked = checked.toLowerCase() === 'x';
      return `<li class="task-list-item my-1.5 flex items-start gap-2.5">
        <input type="checkbox" ${isChecked ? 'checked' : ''} disabled class="mt-1 rounded accent-purple-600 cursor-default" />
        <span class="${isChecked ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-200'}">${text}</span>
      </li>`;
    }
  );

  // 9. Unordered Lists (- or *)
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-4 list-disc text-slate-800 dark:text-zinc-200 my-1 leading-relaxed">$1</li>');

  // 10. Ordered Lists (1. Item)
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal text-slate-800 dark:text-zinc-200 my-1 leading-relaxed">$1</li>');

  // 11. Inline formatting: bold, italic, strikethrough, highlights
  html = html.replace(/==([^=]+)==/g, '<mark class="bg-amber-100 text-amber-900 dark:bg-purple-500/25 dark:text-purple-200 px-1 py-0.5 rounded font-medium">$1</mark>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-800 dark:text-zinc-200">$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del class="line-through text-slate-400 dark:text-zinc-500">$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code class="font-mono text-[0.875em] bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-200/60 dark:border-transparent">$1</code>');

  // 12. Links & Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-4 rounded-xl max-w-full h-auto border border-slate-200 dark:border-white/10 shadow-lg" />');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-cyan-400 hover:text-indigo-500 dark:hover:text-cyan-300 underline underline-offset-4 transition-colors font-medium">$1</a>');

  // 13. Paragraphs (lines separated by double newlines)
  const blocks = html.split(/\n\n+/);
  html = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<pre') || 
        trimmed.startsWith('<hr') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li') ||
        trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
      return trimmed;
    }
    return `<p class="my-3 leading-relaxed text-slate-800 dark:text-zinc-200">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
      headings.push({ id, text, level });
    }
  }

  return headings;
}

// Global click delegation for code copy button
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLElement | null;
    if (target) {
      const encodedCode = target.getAttribute('data-code');
      if (encodedCode) {
        const code = decodeURIComponent(encodedCode);
        navigator.clipboard.writeText(code).then(() => {
          const original = target.innerHTML;
          target.innerHTML = '<span>已复制!</span>';
          target.classList.add('text-emerald-400');
          setTimeout(() => {
            target.innerHTML = original;
            target.classList.remove('text-emerald-400');
          }, 1500);
        });
      }
    }
  });
}
