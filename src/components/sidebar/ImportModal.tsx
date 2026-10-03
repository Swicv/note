import React, { useState, useRef } from 'react';
import { NoteMeta } from '../../lib/types';
import { api } from '../../lib/api';
import { 
  Upload, FileText, Database, X, Check, AlertCircle, 
  Folder, ArrowRight, RefreshCw, FileUp, Sparkles, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteMeta[];
  currentNoteId: string | null;
  onSuccess: (importedIds: string[]) => void;
  initialFiles?: File[];
}

interface ParsedMarkdownFile {
  name: string;
  title: string;
  content: string;
  size: number;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  notes,
  currentNoteId,
  onSuccess,
  initialFiles,
}) => {
  const [tab, setTab] = useState<'markdown' | 'backup'>('markdown');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Markdown Tab States
  const [parsedFiles, setParsedFiles] = useState<ParsedMarkdownFile[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  // Backup Tab States
  const [backupData, setBackupData] = useState<{
    app?: string;
    version?: string;
    exported_at?: string;
    notes?: any[];
  } | null>(null);
  const [backupMode, setBackupMode] = useState<'merge' | 'overwrite'>('merge');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Process initial files if passed (e.g. from global drag-and-drop)
  React.useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      handleFilesSelected(initialFiles);
    }
  }, [initialFiles]);

  if (!isOpen) return null;

  const folders = notes.filter((n) => n.is_folder);

  const handleFilesSelected = async (fileList: File[] | FileList) => {
    setError(null);
    const files = Array.from(fileList);

    // If a JSON file is detected, switch to backup tab
    const jsonFile = files.find((f) => f.name.endsWith('.json'));
    if (jsonFile) {
      try {
        const text = await jsonFile.text();
        const json = JSON.parse(text);
        if (json.notes && Array.isArray(json.notes)) {
          setBackupData(json);
          setTab('backup');
          return;
        }
      } catch {
        setError('所选 JSON 文件解析失败，格式非有效 Cosmo Note 备份');
        return;
      }
    }

    // Process markdown files
    const mdFiles = files.filter((f) => f.name.endsWith('.md') || f.name.endsWith('.markdown') || f.name.endsWith('.txt'));
    if (mdFiles.length === 0) {
      setError('未检测到有效的 Markdown (.md) 或 JSON 备份文件');
      return;
    }

    const parsed: ParsedMarkdownFile[] = [];
    for (const f of mdFiles) {
      const content = await f.text();
      let title = f.name.replace(/\.(md|markdown|txt)$/i, '');
      const match = content.match(/^#\s+(.+)$/m);
      if (match && match[1].trim()) {
        title = match[1].trim();
      }
      parsed.push({
        name: f.name,
        title,
        content,
        size: f.size,
      });
    }

    setParsedFiles((prev) => [...prev, ...parsed]);
  };

  const removeParsedFile = (index: number) => {
    setParsedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const submitMarkdownImport = async () => {
    if (parsedFiles.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const payloadNotes = parsedFiles.map((f) => ({
        title: f.title,
        content: f.content,
        parent_id: targetFolderId ? targetFolderId : null,
        icon: '📄',
      }));

      const res = await api.notes.batchImport({
        type: 'markdown',
        notes: payloadNotes,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#8b5cf6', '#10b981'],
      });

      onSuccess(res.imported_ids);
      onClose();
    } catch (err: any) {
      setError(err.message || '导入失败，请检查网络或数据结构');
    } finally {
      setLoading(false);
    }
  };

  const submitBackupRestore = async () => {
    if (!backupData || !Array.isArray(backupData.notes)) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.notes.batchImport({
        type: 'backup',
        mode: backupMode,
        notes: backupData.notes,
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
      });

      onSuccess(res.imported_ids);
      onClose();
    } catch (err: any) {
      setError(err.message || '备份恢复失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 blur-xl opacity-75 pointer-events-none" />

        <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d101a] p-6 shadow-2xl backdrop-blur-2xl text-slate-900 dark:text-white transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">导入笔记与数据恢复</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">批量汇入外部 Markdown 或完整还原备份</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-200 dark:border-white/5 text-xs">
            <button
              onClick={() => { setTab('markdown'); setError(null); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                tab === 'markdown'
                  ? 'bg-purple-50 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-medium'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown 批量导入</span>
              {parsedFiles.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px]">
                  {parsedFiles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setTab('backup'); setError(null); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                tab === 'backup'
                  ? 'bg-purple-50 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-medium'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>JSON 全量备份还原</span>
              {backupData && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-600 text-white text-[10px]">
                  已就绪
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Markdown Import */}
          {tab === 'markdown' && (
            <div className="mt-4 space-y-4">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-500/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/50 bg-slate-50/50 dark:bg-white/[0.02]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".md,.markdown,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                />
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  点击选取或拖拽 Markdown 文件至此
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  支持单篇、多篇批量导入（.md / .markdown），首行一级大标题自动解析为笔记名
                </p>
              </div>

              {/* Target Folder Selection */}
              {folders.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                    <Folder className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>导入归属目录：</span>
                  </div>
                  <select
                    value={targetFolderId}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    className="px-2.5 py-1 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-zinc-200 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">根目录 (Root)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.icon || '📁'} {f.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parsed Files List */}
              {parsedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 px-1">
                    <span>待导入清单 ({parsedFiles.length} 篇)</span>
                    <button
                      onClick={() => setParsedFiles([])}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      清空全部
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {parsedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                            {file.title}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeParsedFile(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="移除此文件"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={submitMarkdownImport}
                  disabled={loading || parsedFiles.length === 0}
                  className="px-5 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>正在导入 {parsedFiles.length} 篇文档...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>确认导入 ({parsedFiles.length} 篇)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Full JSON Backup Restore */}
          {tab === 'backup' && (
            <div className="mt-4 space-y-4">
              {/* Drop / Select JSON */}
              {!backupData ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => jsonInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-500/10 scale-[1.01]'
                      : 'border-slate-300 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-500/50 bg-slate-50/50 dark:bg-white/[0.02]'
                  }`}
                >
                  <input
                    ref={jsonInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-3">
                    <Database className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    选取 Cosmo Note 备份文件 (.json)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    点击选取或将此前导出的 <code className="text-cyan-600 dark:text-cyan-300">cosmo-note-backup-*.json</code> 拖入此区域
                  </p>
                </div>
              ) : (
                /* Backup Meta Card */
                <div className="p-4 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        已读取备份文件
                      </span>
                    </div>
                    <button
                      onClick={() => setBackupData(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                    >
                      重新选择
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-white/[0.03] border border-cyan-100 dark:border-white/5">
                      <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">包含笔记总数</span>
                      <span className="text-base font-bold text-slate-800 dark:text-zinc-100">
                        {backupData.notes?.length || 0} 篇
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-white/[0.03] border border-cyan-100 dark:border-white/5">
                      <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">备份生成时间</span>
                      <span className="text-xs font-mono text-slate-800 dark:text-zinc-300">
                        {backupData.exported_at ? new Date(backupData.exported_at).toLocaleDateString('zh-CN') : '未知'}
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="space-y-1.5 pt-2 border-t border-cyan-200/60 dark:border-white/5">
                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 block">
                      选择恢复模式：
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                          backupMode === 'merge'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-600/15 text-purple-900 dark:text-white font-medium'
                            : 'border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="backupMode"
                          value="merge"
                          checked={backupMode === 'merge'}
                          onChange={() => setBackupMode('merge')}
                          className="mt-0.5 accent-purple-600"
                        />
                        <div className="text-xs">
                          <div>追加与合并</div>
                          <div className="text-[10px] opacity-75 font-normal">保留现有笔记，无冲突导入</div>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                          backupMode === 'overwrite'
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-600/15 text-rose-900 dark:text-white font-medium'
                            : 'border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="backupMode"
                          value="overwrite"
                          checked={backupMode === 'overwrite'}
                          onChange={() => setBackupMode('overwrite')}
                          className="mt-0.5 accent-rose-600"
                        />
                        <div className="text-xs">
                          <div>完全覆盖还原</div>
                          <div className="text-[10px] opacity-75 font-normal">清空现有笔记，还原备份副本</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              {backupData && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={submitBackupRestore}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>正在还原知识星脉...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>确认执行恢复 ({backupData.notes?.length || 0} 篇)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
