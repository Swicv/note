import React, { useState } from 'react';
import { NoteMeta } from '../../lib/types';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Pin, Share2, Trash2, Shield, Globe } from 'lucide-react';

interface NoteTreeItemProps {
  note: NoteMeta;
  childrenNotes: NoteMeta[];
  allNotes: NoteMeta[];
  activeNoteId: string | null;
  onSelect: (noteId: string) => void;
  onCreateChild: (parentId: string) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (note: NoteMeta) => void;
  onOpenShare: (note: NoteMeta) => void;
  level?: number;
}

export const NoteTreeItem: React.FC<NoteTreeItemProps> = ({
  note,
  childrenNotes,
  allNotes,
  activeNoteId,
  onSelect,
  onCreateChild,
  onDelete,
  onTogglePin,
  onOpenShare,
  level = 0,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const isActive = activeNoteId === note.id;
  const hasChildren = childrenNotes.length > 0;

  return (
    <div className="select-none">
      <div
        className={`group relative flex items-center gap-1.5 py-1.5 px-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-purple-600/20 text-white font-medium border border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
        }`}
        style={{ paddingLeft: `${Math.max(8, level * 14 + 8)}px` }}
        onClick={() => onSelect(note.id)}
      >
        {/* Expand / Collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-0.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors ${
            hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Note Icon */}
        <span className="text-base shrink-0 leading-none">{note.icon || (note.is_folder ? '📁' : '📄')}</span>

        {/* Title */}
        <span className="truncate flex-1 text-[13px]">{note.title || '无标题笔记'}</span>

        {/* Badges: Share Status & Pin Status */}
        <div className="flex items-center gap-1 shrink-0">
          {note.is_pinned === 1 && (
            <Pin className="w-3 h-3 text-purple-400 fill-purple-400/40" />
          )}
          {note.is_shared === 1 && (
            <span
              title={note.has_share_password ? '已加密公网分享' : '已公开分享'}
              onClick={(e) => {
                e.stopPropagation();
                onOpenShare(note);
              }}
              className="p-0.5 rounded text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              {note.has_share_password ? (
                <Shield className="w-3 h-3 text-purple-400" />
              ) : (
                <Globe className="w-3 h-3 text-cyan-400" />
              )}
            </span>
          )}
        </div>

        {/* Hover Action Menu */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
          <button
            title="新建子笔记"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(note.id);
              setIsOpen(true);
            }}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <Plus className="w-3 h-3" />
          </button>
          <div className="relative">
            <button
              title="更多选项"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div
                  className="absolute right-0 top-6 w-36 py-1 bg-[#121522] border border-white/10 rounded-xl shadow-2xl z-40 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onOpenShare(note);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-zinc-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>独立密码分享</span>
                  </button>
                  <button
                    onClick={() => {
                      onTogglePin(note);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-zinc-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                  >
                    <Pin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{note.is_pinned ? '取消星标' : '星标置顶'}</span>
                  </button>
                  <div className="my-1 border-t border-white/5" />
                  <button
                    onClick={() => {
                      if (confirm(`确定删除笔记「${note.title}」及其全部子笔记吗？`)) {
                        onDelete(note.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除笔记</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recursive Children Notes */}
      {hasChildren && isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {childrenNotes.map((child) => (
            <NoteTreeItem
              key={child.id}
              note={child}
              childrenNotes={allNotes.filter((n) => n.parent_id === child.id)}
              allNotes={allNotes}
              activeNoteId={activeNoteId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
              onOpenShare={onOpenShare}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
