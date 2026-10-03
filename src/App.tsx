import React, { useState, useEffect, useCallback } from 'react';
import { api, tokenStorage, setOnUnauthorized } from './lib/api';
import { AuthStatus, NoteMeta } from './lib/types';
import { CosmoBackground } from './components/brand/CosmoBackground';
import { MasterLockScreen } from './components/auth/MasterLockScreen';
import { SetupMasterModal } from './components/auth/SetupMasterModal';
import { Sidebar } from './components/sidebar/Sidebar';
import { CosmoEditor } from './components/editor/CosmoEditor';
import { SearchModal } from './components/sidebar/SearchModal';
import { ShareModal } from './components/share/ShareModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { PublicReader } from './components/share/PublicReader';
import { Sparkles, X } from 'lucide-react';

export function App() {
  // Check if viewing a shared note (/share/:slug)
  const pathname = window.location.pathname;
  const shareMatch = pathname.match(/^\/share\/([a-zA-Z0-9_-]+)/);

  if (shareMatch) {
    return <PublicReader slug={shareMatch[1]} />;
  }

  // --- Main Application State ---
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sharingNote, setSharingNote] = useState<NoteMeta | null>(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cosmo_theme');
    if (saved) return saved === 'dark';
    return true;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Auto lock tracking
  const checkAutoLock = useCallback((minutes: number) => {
    if (!minutes || minutes <= 0) return;
    const lastActive = tokenStorage.getLastActive();
    if (lastActive && Date.now() - lastActive > minutes * 60 * 1000) {
      tokenStorage.remove();
      setIsUnlocked(false);
    }
  }, []);

  // Check Auth & Init
  const initApp = useCallback(async () => {
    setLoading(true);
    try {
      const status = await api.auth.getStatus();
      setAuthStatus(status);

      if (status.initialized) {
        const token = tokenStorage.get();
        if (token) {
          checkAutoLock(status.autoLockMinutes);
          const stillHasToken = !!tokenStorage.get();
          if (stillHasToken) {
            setIsUnlocked(true);
            await loadNotes();
          }
        }
      }
    } catch (err) {
      console.error('Failed to init auth status:', err);
    } finally {
      setLoading(false);
    }
  }, [checkAutoLock]);

  useEffect(() => {
    initApp();
    setOnUnauthorized(() => {
      setIsUnlocked(false);
    });
  }, [initApp]);

  // Load Notes
  const loadNotes = async () => {
    try {
      const list = await api.notes.list();
      setNotes(list);
      if (list.length > 0 && !activeNoteId) {
        setActiveNoteId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  // Keyboard Shortcuts (Cmd+K, Cmd+N)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      tokenStorage.touch();

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateNote(null, false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isUnlocked]);

  // Periodic Auto-lock checker
  useEffect(() => {
    if (!isUnlocked || !authStatus?.autoLockMinutes) return;
    const interval = setInterval(() => {
      checkAutoLock(authStatus.autoLockMinutes);
    }, 30000);
    return () => clearInterval(interval);
  }, [isUnlocked, authStatus, checkAutoLock]);

  // Actions
  const handleCreateNote = async (parentId: string | null = null, isFolder: boolean = false) => {
    try {
      const newNote = await api.notes.create({
        parent_id: parentId,
        title: isFolder ? '新建星系分类' : '新建灵感笔记',
        icon: isFolder ? '📁' : '📄',
        is_folder: isFolder ? 1 : 0,
        content: isFolder ? '' : '# 新建灵感笔记\n\n在此开始构建你的思考星脉...',
      });

      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setIsMobileSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.notes.delete(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId && n.parent_id !== noteId));
      if (activeNoteId === noteId) {
        const remaining = notes.filter((n) => n.id !== noteId);
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleTogglePin = async (note: NoteMeta) => {
    const nextPinned = note.is_pinned === 1 ? 0 : 1;
    try {
      await api.notes.update(note.id, { is_pinned: nextPinned });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, is_pinned: nextPinned } : n))
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleNoteUpdated = (updated: Partial<NoteMeta>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
    );
  };

  const handleLockWorkspace = () => {
    tokenStorage.remove();
    setIsUnlocked(false);
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('cosmo_theme', nextDark ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-zinc-500">COSMO NOTE INITIALIZING...</span>
        </div>
      </div>
    );
  }

  // First-time setup modal
  if (!authStatus?.initialized) {
    return (
      <div className="min-h-screen bg-[#07080d] relative overflow-hidden">
        <CosmoBackground />
        <SetupMasterModal
          onCompleted={async () => {
            await initApp();
          }}
        />
      </div>
    );
  }

  // Master Lock Screen (SiYuan Note Style single-access-code gate)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#07080d] relative overflow-hidden">
        <CosmoBackground />
        <MasterLockScreen
          appTitle={authStatus.appTitle}
          onUnlocked={async () => {
            setIsUnlocked(true);
            await loadNotes();
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${isDark ? 'dark bg-[#07080d] text-zinc-100' : 'light bg-slate-50 text-slate-900'} relative transition-colors duration-200`}>
      <CosmoBackground isDark={isDark} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full h-full relative z-10 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0 h-full">
          <Sidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={(id) => setActiveNoteId(id)}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            onTogglePin={handleTogglePin}
            onOpenShare={(note) => setSharingNote(note)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLock={handleLockWorkspace}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative z-50 w-72 h-full bg-white dark:bg-[#0a0c14] border-r border-slate-200 dark:border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
              <Sidebar
                notes={notes}
                activeNoteId={activeNoteId}
                onSelectNote={(id) => {
                  setActiveNoteId(id);
                  setIsMobileSidebarOpen(false);
                }}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onOpenShare={(note) => {
                  setSharingNote(note);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenSearch={() => {
                  setIsSearchOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenSettings={() => {
                  setIsSettingsOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onLock={handleLockWorkspace}
                isDark={isDark}
                onToggleTheme={toggleTheme}
              />
            </div>
          </div>
        )}

        {/* Editor Main Canvas */}
        {activeNoteId ? (
          <CosmoEditor
            key={activeNoteId}
            noteId={activeNoteId}
            onNoteUpdated={handleNoteUpdated}
            onOpenShare={(note) => setSharingNote(note)}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#07080d] transition-colors">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400/70" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">知识星脉已静候就绪</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm mb-6">
              请在左侧侧边栏选择一篇笔记，或点击「新建笔记」开启一段深邃思考。
            </p>
            <button
              onClick={() => handleCreateNote(null, false)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-md"
            >
              新建灵感笔记
            </button>
          </div>
        )}
      </div>

      {/* Global Search Palette (Cmd+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          setIsSearchOpen(false);
        }}
      />

      {/* Per-Note Password Share Modal */}
      {sharingNote && (
        <ShareModal
          note={sharingNote}
          isOpen={!!sharingNote}
          onClose={() => setSharingNote(null)}
          onUpdated={(updated) => {
            handleNoteUpdated({ id: sharingNote.id, ...updated });
            setSharingNote((prev) => (prev ? { ...prev, ...updated } : null));
          }}
        />
      )}

      {/* System Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notes={notes}
        autoLockMinutes={authStatus.autoLockMinutes}
        onUpdateAutoLock={(min) => {
          setAuthStatus((prev) => (prev ? { ...prev, autoLockMinutes: min } : null));
        }}
      />
    </div>
  );
}
