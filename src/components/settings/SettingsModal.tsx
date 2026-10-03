import React, { useState } from 'react';
import { api } from '../../lib/api';
import { NoteMeta } from '../../lib/types';
import { 
  Settings, Key, Shield, Clock, Download, 
  Check, AlertCircle, X, Server, Sparkles, HardDrive, ExternalLink, Globe
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteMeta[];
  autoLockMinutes: number;
  onUpdateAutoLock: (minutes: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  notes,
  autoLockMinutes,
  onUpdateAutoLock,
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [lockTime, setLockTime] = useState(autoLockMinutes);
  const [loading, setLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'security' | 'backup' | 'about'>('security');

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) {
      setPassMsg({ text: '请填写所有密码输入框', type: 'error' });
      return;
    }
    if (newPass.length < 4) {
      setPassMsg({ text: '新密码长度至少需要4位', type: 'error' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ text: '两次输入的新密码不一致', type: 'error' });
      return;
    }

    setLoading(true);
    setPassMsg(null);
    try {
      await api.auth.changePassword(currentPass, newPass);
      setPassMsg({ text: '主访问授权码已成功修改！', type: 'success' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassMsg({ text: err.message || '修改失败，请检查原密码', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutoLock = async (val: number) => {
    setLockTime(val);
    onUpdateAutoLock(val);
    try {
      await api.settings.update({ auto_lock_minutes: String(val) });
    } catch (err) {
      console.error('Failed to update auto lock:', err);
    }
  };

  const handleExportBackup = async () => {
    try {
      const fullNotes = [];
      for (const n of notes) {
        try {
          const detail = await api.notes.get(n.id);
          fullNotes.push(detail);
        } catch {
          fullNotes.push(n);
        }
      }

      const backupData = {
        app: 'Cosmo Note',
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        total_notes: fullNotes.length,
        notes: fullNotes,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosmo-note-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出备份失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 blur-xl opacity-75 pointer-events-none" />

        <div className="relative rounded-2xl border border-white/10 bg-[#0d101a] p-6 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">系统控制台与安全设置</h3>
                <p className="text-xs text-zinc-400">管理授权码、自动锁定与全量数据备份</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pb-2 border-b border-white/5 text-xs">
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              安全与访问码
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              数据备份与迁移
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              关于与双模架构
            </button>
          </div>

          <div className="mt-5 space-y-6">
            {activeTab === 'security' && (
              <>
                {/* Auto-lock Settings */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-200">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>超时自动锁定</span>
                    </div>
                    <select
                      value={lockTime}
                      onChange={(e) => handleSaveAutoLock(Number(e.target.value))}
                      className="px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value={15}>15 分钟无操作</option>
                      <option value={30}>30 分钟无操作</option>
                      <option value={60}>1 小时无操作</option>
                      <option value={240}>4 小时无操作</option>
                      <option value={0}>从不自动锁定</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-400">
                    页面闲置超过指定时间后将自动弹出思源式毛玻璃锁屏保护隐私。
                  </p>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>修改主访问授权码</span>
                  </div>

                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="原访问授权码"
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="新访问授权码 (至少4位)"
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="确认新授权码"
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-400"
                  />

                  {passMsg && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        passMsg.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {passMsg.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{passMsg.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      {loading ? '保存中...' : '确认更新密码'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <Download className="w-4 h-4 text-cyan-400" />
                        <span>全库一键 JSON 导出备份</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        将所有笔记（含正文、层级树、标签、分享配置）打包导出为标准化 JSON 文件。
                      </p>
                    </div>
                    <button
                      onClick={handleExportBackup}
                      className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium transition-colors cursor-pointer shrink-0"
                    >
                      立即导出备份
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300/90 space-y-1">
                  <div className="font-semibold text-cyan-200 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>双轨数据库无缝迁移</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Cosmo Note 在 Docker 容器中使用本地 SQLite（挂载至宿主机 <code className="text-cyan-300">./data/cosmo.db</code>），在 Cloudflare 部署中使用原生 D1。两者 SQL 模式同构，数据可随时无损同步。
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-3 text-xs text-zinc-400">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                    🪐
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cosmo Note v1.0.0</h4>
                    <p className="text-zinc-400 text-[11px]">极具设计感的个人私有化知识库与星脉空间</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-zinc-500 block">Cloudflare 模式</span>
                    <span className="text-purple-300 font-medium">Pages / Workers + D1</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-zinc-500 block">Docker 模式</span>
                    <span className="text-cyan-300 font-medium">Node.js + Better-SQLite3</span>
                  </div>
                </div>

                {/* Author Information Card */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/20 via-indigo-900/15 to-cyan-900/20 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                      ✨
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>创作者主页</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">AUTHOR</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">探索更多开源项目与思维星云</div>
                    </div>
                  </div>
                  <a
                    href="https://666228.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md group cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>666228.xyz</span>
                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
