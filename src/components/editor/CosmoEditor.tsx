import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NoteDetail, NoteMeta } from '../../lib/types';
import { api } from '../../lib/api';
import { renderMarkdown } from '../../lib/markdown';
import { TableOfContents } from './TableOfContents';
import { 
  Pin, Share2, ListFilter, Columns, Eye, Edit3, 
  Bold, Italic, Strikethrough, Code, Quote, List, 
  CheckSquare, Table, Heading1, Heading2, Sparkles, 
  Sigma, Info, Download, Check, Shield, Globe, Menu
} from 'lucide-react';

interface CosmoEditorProps {
  noteId: string;
  onNoteUpdated: (updated: Partial<NoteMeta>) => void;
  onOpenShare: (note: NoteMeta) => void;
  onToggleMobileSidebar?: () => void;
}

export const CosmoEditor: React.FC<CosmoEditorProps> = ({
  noteId,
  onNoteUpdated,
  onOpenShare,
  onToggleMobileSidebar,
}) => {
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [icon, setIcon] = useState('📄');
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [showToc, setShowToc] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'dirty'>('synced');
  const [loading, setLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emojiList = ['📄', '🪐', '⚡', '💡', '🌌', '🚀', '🎯', '🔮', '✨', '🧠', '📘', '🎨', '💼', '🔬', '🌲', '📁'];

  // Handle responsive default mode
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMode('edit');
    }
  }, []);

  // Load Note
  useEffect(() => {
    let isCurrent = true;
    const fetchNote = async () => {
      setLoading(true);
      try {
        const data = await api.notes.get(noteId);
        if (isCurrent) {
          setNote(data);
          setTitle(data.title);
          setContent(data.content);
          setIcon(data.icon || '📄');
          setSaveStatus('synced');
        }
      } catch (err) {
        console.error('Failed to load note:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchNote();
    return () => {
      isCurrent = false;
    };
  }, [noteId]);

  // Debounced Auto-save
  const persistChanges = useCallback(
    async (newTitle: string, newContent: string, newIcon: string) => {
      setSaveStatus('saving');
      try {
        const updated = await api.notes.update(noteId, {
          title: newTitle,
          content: newContent,
          icon: newIcon,
        });

        setNote(updated);
        setSaveStatus('synced');
        onNoteUpdated({
          id: noteId,
          title: updated.title,
          icon: updated.icon,
          updated_at: updated.updated_at,
        });
      } catch (err) {
        console.error('Failed to save note:', err);
        setSaveStatus('dirty');
      }
    },
    [noteId, onNoteUpdated]
  );

  const triggerAutoSave = (newTitle: string, newContent: string, newIcon: string) => {
    setSaveStatus('dirty');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistChanges(newTitle, newContent, newIcon);
    }, 800);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAutoSave(val, content, icon);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerAutoSave(title, val, icon);
  };

  const handleIconSelect = (selectedIcon: string) => {
    setIcon(selectedIcon);
    setShowIconPicker(false);
    triggerAutoSave(title, content, selectedIcon);
  };

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        persistChanges(title, content, icon);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, icon, persistChanges]);

  // Quick insertion helpers for Markdown
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previous = textarea.value;
    const selected = previous.substring(start, end);
    const replacement = `${before}${selected || '内容'}${after}`;

    const newContent = previous.substring(0, start) + replacement + previous.substring(end);
    setContent(newContent);
    triggerAutoSave(title, newContent, icon);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 2));
    }, 10);
  };

  const exportMarkdownFile = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#07080d] text-zinc-500 text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>正在提取知识星轨...</span>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#07080d] text-zinc-500 text-xs">
        笔记已不存在
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#07080d] relative">
      {/* Top Header Toolbar */}
      <header className="h-14 border-b border-white/10 px-4 sm:px-5 flex items-center justify-between bg-[#0a0c14]/60 backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Menu Button */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
              title="打开目录"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

            {/* Note Icon with Selector */}
            <div className="relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-2xl p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer select-none flex items-center justify-center"
                title="更换笔记图标"
              >
                {icon}
              </button>
              {showIconPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowIconPicker(false)} />
                  <div className="absolute left-0 top-full mt-2 w-52 p-2.5 bg-[#0f121d]/95 border border-white/10 rounded-2xl shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[11px] font-medium text-zinc-400 px-1 pb-2 border-b border-white/5 mb-2 flex items-center justify-between">
                      <span>选择笔记图标</span>
                      <span className="text-[10px] text-zinc-500 font-mono">ICONS</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {emojiList.map((em) => (
                        <button
                          key={em}
                          onClick={() => handleIconSelect(em)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl transition-all cursor-pointer select-none ${
                            em === icon
                              ? 'bg-purple-600/30 border border-purple-500/50 shadow-inner'
                              : 'hover:bg-white/10 hover:scale-105 active:scale-95'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'synced' && (
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">已同步</span>
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-purple-400 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                <span className="hidden sm:inline">保存中...</span>
              </span>
            )}
            {saveStatus === 'dirty' && (
              <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">有未保存变更</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Mode Segmented Controls */}
          <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/5 text-xs text-zinc-400">
            <button
              onClick={() => setMode('edit')}
              className={`px-2 py-1 sm:px-2.5 rounded-md transition-colors cursor-pointer ${
                mode === 'edit' ? 'bg-white/10 text-white font-medium' : 'hover:text-zinc-200'
              }`}
              title="仅编辑模式"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer hidden md:block ${
                mode === 'split' ? 'bg-white/10 text-white font-medium' : 'hover:text-zinc-200'
              }`}
              title="双栏实时对照"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-2 py-1 sm:px-2.5 rounded-md transition-colors cursor-pointer ${
                mode === 'preview' ? 'bg-white/10 text-white font-medium' : 'hover:text-zinc-200'
              }`}
              title="沉浸阅读预览"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Share Button (Core Requirement) */}
          <button
            onClick={() => onOpenShare(note)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              note.is_shared === 1
                ? 'bg-gradient-to-r from-cyan-600/30 to-purple-600/30 text-cyan-300 border border-cyan-500/40 shadow-cyan-500/10'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10'
            }`}
            title="单笔记独立密码分享"
          >
            {note.is_shared === 1 ? (
              note.has_share_password ? (
                <Shield className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
              )
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{note.is_shared === 1 ? '分享中' : '分享'}</span>
          </button>

          {/* Outline / TOC Toggle */}
          <button
            onClick={() => setShowToc(!showToc)}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              showToc ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="大纲目录"
          >
            <ListFilter className="w-4 h-4" />
          </button>

          {/* Export Markdown */}
          <button
            onClick={exportMarkdownFile}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="导出为 .md 文件"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Quick Markdown Toolbar (Visible in edit or split mode) */}
      {mode !== 'preview' && (
        <div className="h-9 border-b border-white/5 px-4 sm:px-5 flex items-center gap-1 bg-[#090b12]/40 text-zinc-400 text-xs shrink-0 overflow-x-auto select-none">
          <button
            onClick={() => insertText('# ', '')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="一级标题 H1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('## ', '')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="二级标题 H2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-white/10 mx-1" />
          <button
            onClick={() => insertText('**', '**')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="加粗"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('*', '*')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="斜体"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('~~', '~~')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="删除线"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('==', '==')}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono hover:text-white hover:bg-white/10"
            title="高亮"
          >
            HL
          </button>
          <div className="w-px h-3.5 bg-white/10 mx-1" />
          <button
            onClick={() => insertText('```typescript\n', '\n```')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="代码块"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('> ', '')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="引用"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('> [!NOTE]\n> ', '')}
            className="p-1 rounded hover:text-blue-400 hover:bg-white/10"
            title="Callout 提示框"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
          </button>
          <button
            onClick={() => insertText('$ ', ' $')}
            className="p-1 rounded hover:text-purple-400 hover:bg-white/10"
            title="KaTeX 数学公式"
          >
            <Sigma className="w-3.5 h-3.5 text-purple-400" />
          </button>
          <div className="w-px h-3.5 bg-white/10 mx-1" />
          <button
            onClick={() => insertText('- [ ] ', '')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="待办任务清单"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('- ', '')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="无序列表"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('| 标题 1 | 标题 2 |\n| --- | --- |\n| 内容 1 | 内容 2 |\n', '')}
            className="p-1 rounded hover:text-white hover:bg-white/10"
            title="插入表格"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Main Canvas Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Main Editing Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Note Title Input */}
          <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2 shrink-0">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="无标题笔记..."
              className="w-full text-2xl sm:text-3xl font-extrabold tracking-tight bg-transparent text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>

          {/* Content Split/Edit/Preview */}
          <div className="flex-1 flex overflow-hidden px-4 sm:px-8 pb-6 gap-6">
            {/* Raw Markdown Editor */}
            {(mode === 'edit' || mode === 'split') && (
              <div className={`h-full flex flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="在此自由书写，支持全量 Markdown 标记、代码高亮、公式与 Callout 提示..."
                  className="w-full h-full bg-transparent resize-none focus:outline-none text-sm font-mono leading-relaxed text-zinc-300 placeholder-zinc-600 selection:bg-purple-500/30"
                />
              </div>
            )}

            {/* Split Divider */}
            {mode === 'split' && <div className="w-px h-full bg-white/5 shrink-0" />}

            {/* Formatted Markdown Preview */}
            {(mode === 'preview' || mode === 'split') && (
              <div className={`h-full overflow-y-auto pr-2 ${mode === 'split' ? 'w-1/2' : 'w-full max-w-4xl mx-auto'}`}>
                <div
                  className="cosmo-prose text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Floating Table of Contents */}
        {showToc && (
          <TableOfContents
            content={content}
            onClose={() => setShowToc(false)}
          />
        )}
      </div>
    </div>
  );
};
