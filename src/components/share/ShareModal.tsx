import React, { useState } from 'react';
import { NoteDetail, NoteMeta } from '../../lib/types';
import { api } from '../../lib/api';
import { 
  Share2, Lock, Unlock, Copy, Check, ExternalLink, ShieldCheck, 
  Eye, EyeOff, Globe, Sparkles, X, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareModalProps {
  note: NoteMeta | NoteDetail;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedNote: Partial<NoteMeta>) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  note,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [isShared, setIsShared] = useState(note.is_shared === 1);
  const [requirePassword, setRequirePassword] = useState(Boolean(note.has_share_password));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const shareUrl = note.share_slug
    ? `${window.location.origin}/share/${note.share_slug}`
    : `${window.location.origin}/share/pending`;

  const handleToggleShare = async (enabled: boolean) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.share.updateShare(note.id, {
        is_shared: enabled,
        password: enabled && requirePassword && password ? password : '',
        remove_password: !requirePassword,
      });

      setIsShared(res.is_shared);
      onUpdated({
        is_shared: res.is_shared ? 1 : 0,
        share_slug: res.share_slug,
        has_share_password: res.has_share_password,
      });

      if (enabled) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8b5cf6', '#ec4899'],
        });
        setMsg({ text: '公网分享已开启', type: 'success' });
      } else {
        setMsg({ text: '已停止分享，外部访问将立即失效', type: 'success' });
      }
    } catch (err: any) {
      setMsg({ text: err.message || '更新分享设置失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (requirePassword && !password.trim() && !note.has_share_password) {
      setMsg({ text: '请输入要设置的访问密码', type: 'error' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const res = await api.share.updateShare(note.id, {
        is_shared: isShared,
        password: requirePassword ? password.trim() : '',
        remove_password: !requirePassword,
      });

      onUpdated({
        has_share_password: res.has_share_password,
      });

      setPassword('');
      setMsg({
        text: requirePassword ? '独立密码已设置，访客必须凭此密码解锁' : '已移除密码保护，当前为公开只读',
        type: 'success',
      });
    } catch (err: any) {
      setMsg({ text: err.message || '保存密码失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 blur-xl opacity-75 pointer-events-none" />

        <div className="relative rounded-2xl border border-white/10 bg-[#0d101a] p-6 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>单笔记独立密码分享</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    PER-NOTE
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  为「{note.icon || '📄'} {note.title}」生成外部安全访问链接
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {/* Toggle Enable Share */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>启用独立公网链接</span>
                </div>
                <p className="text-xs text-zinc-400">
                  开启后将生成唯一的外部直达链接，支持随时关闭
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => handleToggleShare(e.target.checked)}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isShared && (
              <>
                {/* Share Link Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">
                    公开阅读链接 (外部直达)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? '已复制' : '复制'}</span>
                    </button>
                    <a
                      href={`/share/${note.share_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-colors"
                      title="新窗口预览"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Per-Note Password Section */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-purple-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-purple-400" />
                        <span>专属访问密码保护</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        访客只有输入此密码才能解密阅读正文
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requirePassword}
                        onChange={(e) => {
                          setRequirePassword(e.target.checked);
                          if (!e.target.checked) {
                            setPassword('');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {requirePassword && (
                    <div className="pt-2 border-t border-purple-500/20 space-y-2.5">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={note.has_share_password ? '已设置密码，可输入新密码覆盖' : '输入该笔记专属密码 (如: 123456)'}
                          className="w-full pl-3 pr-9 py-2 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400">
                          {note.has_share_password ? '当前状态: 🛡️ 已开启密码保护' : '当前状态: 尚未设定密码'}
                        </span>
                        <button
                          onClick={handleSavePassword}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          {loading ? '保存中...' : '应用密码设置'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!requirePassword && note.has_share_password && (
                    <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>已取消密码勾选，点击应用以移除密码保护</span>
                      </span>
                      <button
                        onClick={handleSavePassword}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs"
                      >
                        确认移除
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Feedback Message */}
            {msg && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  msg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}
              >
                {msg.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span>{msg.text}</span>
              </div>
            )}
          </div>

          {/* Footer Safety Notice */}
          <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-zinc-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>外部访客仅能浏览此单篇内容，无法穿透至工作台</span>
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
