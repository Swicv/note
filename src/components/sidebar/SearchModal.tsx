import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, ArrowRight, CornerDownLeft, Sparkles, X } from 'lucide-react';
import { api } from '../../lib/api';
import { SearchResult } from '../../lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectNote }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.notes.search(query.trim());
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectNote(results[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl relative" onKeyDown={handleKeyDown}>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 blur-xl opacity-60 pointer-events-none" />

        <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d101a] shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <Search className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索笔记标题或内容 (Cmd + K)..."
              className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-base focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-2 text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 hover:bg-slate-200/80 dark:hover:bg-white/10 cursor-pointer"
            >
              ESC
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {loading && (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-sm flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-600 dark:border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>检索星空笔记中...</span>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-sm">
                未检索到与「<span className="text-slate-700 dark:text-zinc-300">{query}</span>」相关的笔记
              </div>
            )}

            {!loading && !query && (
              <div className="py-10 text-center text-slate-400 dark:text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500/60" />
                <span>输入任意关键词以毫秒级穿梭搜索所有笔记</span>
              </div>
            )}

            {!loading &&
              results.map((result, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={result.id}
                    onClick={() => {
                      onSelectNote(result.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-600/15 border border-purple-300 dark:border-purple-500/30 text-purple-950 dark:text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{result.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{result.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {result.snippet}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 shrink-0 self-center">
                        <CornerDownLeft className="w-3.5 h-3.5 mr-1" />
                        <span>打开</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-black/40 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-zinc-300">↑↓</kbd> 切换</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-zinc-300">Enter</kbd> 打开</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-zinc-300">Esc</kbd> 退出</span>
            </div>
            <span>Cosmo Fast Finder</span>
          </div>
        </div>
      </div>
    </div>
  );
};
