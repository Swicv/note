import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SharedNoteContent, SharedNoteMeta } from '../../lib/types';
import { renderMarkdown, extractHeadings } from '../../lib/markdown';
import { CosmoLogo } from '../brand/CosmoLogo';
import { 
  Lock, ArrowRight, Eye, Calendar, Clock, Copy, Check, 
  Printer, Sun, Moon, ListFilter, AlertCircle, Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublicReaderProps {
  slug: string;
}

export const PublicReader: React.FC<PublicReaderProps> = ({ slug }) => {
  const [meta, setMeta] = useState<SharedNoteMeta | null>(null);
  const [content, setContent] = useState<SharedNoteContent | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cosmo_theme');
      if (saved) return saved === 'dark';
    }
    return true;
  });
  const [showToc, setShowToc] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cosmo_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    loadMeta();
  }, [slug]);

  const loadMeta = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.share.getMeta(slug);
      setMeta(data);
      if (!data.is_protected) {
        // If not password protected, load content directly
        const noteContent = await api.share.view(slug);
        setContent(noteContent);
      }
    } catch (err: any) {
      setError(err.message || '分享笔记不存在或已关闭');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setUnlocking(true);
    setError(null);

    try {
      const res = await api.share.view(slug, password.trim());
      setContent(res);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#8b5cf6', '#ec4899'],
      });
    } catch (err: any) {
      setError(err.message || '密码错误，请重新输入');
    } finally {
      setUnlocking(false);
    }
  };

  const copyMarkdown = () => {
    if (!content?.content) return;
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const headings = content ? extractHeadings(content.content) : [];
  const wordsCount = content?.content ? content.content.length : 0;
  const readMinutes = Math.max(1, Math.ceil(wordsCount / 400));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-zinc-500">正在链接知识星脉...</span>
        </div>
      </div>
    );
  }

  if (error && !meta) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/10 bg-[#0d101a]">
          <CosmoLogo size="md" className="justify-center mb-2" />
          <h2 className="text-xl font-bold text-white">404 · 笔记未找到</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            该分享链接可能已失效、被作者删除或关闭了外部公网访问。
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs transition-colors"
          >
            返回 Cosmo Note 主页
          </a>
        </div>
      </div>
    );
  }

  // Password Protected Gate Screen
  if (meta?.is_protected && !content) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center p-4 selection:bg-purple-500/30 selection:text-purple-200">
        <div className="w-full max-w-md relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 blur-xl opacity-75" />

          <div className="relative rounded-2xl border border-white/10 bg-[#0d101a] p-8 shadow-2xl backdrop-blur-2xl text-center">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 inline-flex mb-4">
              <span className="text-4xl">{meta.icon || '📄'}</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1.5">{meta.title}</h1>
            <p className="text-xs text-purple-400 font-medium flex items-center justify-center gap-1.5 mb-6">
              <Lock className="w-3.5 h-3.5" />
              <span>此笔记受作者专属密码保护</span>
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入访问密码以解锁阅读..."
                  autoFocus
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-center tracking-widest"
                />
              </div>

              {error && (
                <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={unlocking || !password.trim()}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {unlocking ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>解密阅读正文</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-white/5 text-[11px] text-zinc-500">
              Powered by Cosmo Note · 极度私密的个人知识星图
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Shared Article
  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#07080d] text-zinc-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      {/* Floating Reader Top Nav */}
      <header className={`sticky top-0 z-30 px-6 py-3.5 border-b backdrop-blur-xl flex items-center justify-between ${
        isDark ? 'bg-[#07080d]/80 border-white/10' : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <CosmoLogo size="sm" />
          <span className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 tracking-wider font-mono uppercase">
            Public Reader
          </span>
        </div>

        <div className="flex items-center gap-2">
          {headings.length > 0 && (
            <button
              onClick={() => setShowToc(!showToc)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                showToc
                  ? 'bg-purple-600/10 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                  : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>目录大纲</span>
            </button>
          )}

          <button
            onClick={copyMarkdown}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="复制 Markdown 原文"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制' : '复制原文'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            title="打印 / 导出 PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            title="切换阅读明暗模式"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
          </button>
        </div>
      </header>

      {/* Main Reading Canvas */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex gap-10">
        <article className="flex-1 min-w-0 bg-white dark:bg-transparent p-6 sm:p-10 rounded-2xl border border-slate-200/80 dark:border-transparent shadow-sm dark:shadow-none">
          {/* Note Title & Meta Header */}
          <div className="mb-10 pb-6 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{content?.icon || '📄'}</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {content?.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{content ? new Date(content.updated_at).toLocaleDateString('zh-CN') : ''}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>阅读约 {readMinutes} 分钟</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{content?.views || 1} 次浏览</span>
              </span>
            </div>
          </div>

          {/* Rendered Prose */}
          <div
            className="cosmo-prose text-[15px] sm:text-[16px] leading-[1.8]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content?.content || '') }}
          />
        </article>

        {/* Floating Table of Contents */}
        {showToc && headings.length > 0 && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0d101a]/70 backdrop-blur-xl shadow-sm">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5" />
                <span>章节大纲</span>
              </div>
              <div className="space-y-1.5 max-h-[70vh] overflow-y-auto text-xs text-slate-600 dark:text-zinc-400">
                {headings.map((h, i) => (
                  <a
                    key={i}
                    href={`#${h.id}`}
                    className="block truncate py-1 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                    style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                  >
                    {h.text}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Reader Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-white/5 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
        <p>Cosmo Note · 星脉私有化笔记系统</p>
      </footer>
    </div>
  );
};
