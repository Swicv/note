import React, { useState } from 'react';
import { CosmoLogo } from '../brand/CosmoLogo';
import { NoteMeta } from '../../lib/types';
import { NoteTreeItem } from './NoteTreeItem';
import { 
  Plus, Search, Lock, Settings, Moon, Sun, 
  ChevronLeft, Sparkles, FolderPlus, Pin, Layers, PanelLeftClose, PanelLeft
} from 'lucide-react';

interface SidebarProps {
  notes: NoteMeta[];
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: (parentId?: string | null, isFolder?: boolean) => void;
  onDeleteNote: (noteId: string) => void;
  onTogglePin: (note: NoteMeta) => void;
  onOpenShare: (note: NoteMeta) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onLock: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onOpenShare,
  onOpenSearch,
  onOpenSettings,
  onLock,
  isDark,
  onToggleTheme,
}) => {
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rootNotes = notes.filter((n) => !n.parent_id);
  const pinnedNotes = notes.filter((n) => n.is_pinned === 1);
  const displayNotes = filter === 'pinned' ? pinnedNotes : rootNotes;

  if (isCollapsed) {
    return (
      <div className="w-14 border-r border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0a0c14]/90 flex flex-col items-center py-4 justify-between shrink-0 select-none z-20 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="展开侧边栏"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-px bg-slate-200 dark:bg-white/10" />
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="搜索 (Cmd+K)"
          >
            <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </button>
          <button
            onClick={() => onCreateNote(null)}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="新建笔记 (Cmd+N)"
          >
            <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="切换明暗主题"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          <button
            onClick={onLock}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="锁定空间"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0a0c14]/80 flex flex-col justify-between shrink-0 select-none z-20 backdrop-blur-xl transition-all duration-300">
      {/* Top Header */}
      <div>
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
          <CosmoLogo size="sm" />
          <div className="flex items-center gap-1">
            <button
              onClick={onLock}
              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="锁定知识宇宙"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="折叠侧栏"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="px-3 pt-3 pb-2 space-y-1">
          <button
            onClick={onOpenSearch}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200/70 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>全星图搜索...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-[10px] text-slate-500 dark:text-zinc-400 font-mono shadow-xs">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => onCreateNote(null, false)}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-50 dark:bg-purple-600/15 hover:bg-purple-100 dark:hover:bg-purple-600/25 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>新建笔记</span>
            </button>
            <button
              onClick={() => onCreateNote(null, true)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="新建文件夹"
            >
              <FolderPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-3 py-1 flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-200/80 dark:bg-white/10 text-slate-900 dark:text-white font-medium shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>文档树 ({notes.length})</span>
          </button>
          <button
            onClick={() => setFilter('pinned')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              filter === 'pinned'
                ? 'bg-slate-200/80 dark:bg-white/10 text-slate-900 dark:text-white font-medium shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Pin className="w-3 h-3 text-amber-500" />
            <span>星标 ({pinnedNotes.length})</span>
          </button>
        </div>
      </div>

      {/* Note Tree List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {displayNotes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs flex flex-col items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500/60" />
            <span>{filter === 'pinned' ? '暂无星标笔记' : '知识星图尚空，点击上方新建'}</span>
          </div>
        ) : (
          displayNotes.map((note) => (
            <NoteTreeItem
              key={note.id}
              note={note}
              childrenNotes={notes.filter((n) => n.parent_id === note.id)}
              allNotes={notes}
              activeNoteId={activeNoteId}
              onSelect={onSelectNote}
              onCreateChild={(parentId) => onCreateNote(parentId, false)}
              onDelete={onDeleteNote}
              onTogglePin={onTogglePin}
              onOpenShare={onOpenShare}
            />
          ))
        )}
      </div>

      {/* Bottom Status & Settings Bar */}
      <div className="p-3 border-t border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-black/20 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <span>控制台与密钥</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="切换明暗主题"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
          </button>
        </div>
      </div>
    </div>
  );
};
