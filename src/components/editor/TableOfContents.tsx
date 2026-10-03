import React from 'react';
import { extractHeadings } from '../../lib/markdown';
import { ListFilter, X } from 'lucide-react';

interface TableOfContentsProps {
  content: string;
  onClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content, onClose }) => {
  const headings = extractHeadings(content);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-64 border-l border-white/10 bg-[#0a0c14]/90 p-4 shrink-0 flex flex-col justify-between backdrop-blur-xl animate-in slide-in-from-right duration-200">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <ListFilter className="w-3.5 h-3.5" />
            <span>文档大纲 (TOC)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {headings.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center italic">
            尚未检测到标题，使用 # 标示章节
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {headings.map((h, i) => (
              <button
                key={i}
                onClick={() => scrollToHeading(h.id)}
                className="w-full text-left text-xs text-zinc-400 hover:text-purple-300 truncate py-1 transition-colors block"
                style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
              >
                {h.text}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 text-[11px] text-zinc-500 text-center font-mono">
        Cosmo Starlight Navigator
      </div>
    </div>
  );
};
