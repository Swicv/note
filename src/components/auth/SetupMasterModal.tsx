import React, { useState } from 'react';
import { CosmoLogo } from '../brand/CosmoLogo';
import { api, tokenStorage } from '../../lib/api';
import { KeyRound, Sparkles, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SetupMasterModalProps {
  onCompleted: () => void;
}

export const SetupMasterModal: React.FC<SetupMasterModalProps> = ({ onCompleted }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [appTitle, setAppTitle] = useState('Cosmo Note');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 4) {
      setError('访问授权码长度至少需要4位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的授权码不一致');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.setup(password, appTitle.trim() || 'Cosmo Note');
      if (res.token) {
        tokenStorage.set(res.token);
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8b5cf6', '#f43f5e'],
        });
        setTimeout(onCompleted, 300);
      }
    } catch (err: any) {
      setError(err.message || '初始化失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07080d]/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="w-full max-w-lg relative">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600/30 via-cyan-500/20 to-pink-500/30 blur-2xl opacity-70" />

        <div className="relative rounded-2xl border border-white/10 bg-[#0d101a]/95 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <CosmoLogo size="lg" showText={false} className="mb-3" />
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              初始化个人星脉空间
            </h1>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Cosmo Note 采用思源笔记同源的安全理念：无需任何多用户注册流程，设定唯一访问授权码即专属拥有整个知识星库。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                知识库名称 (可随时修改)
              </label>
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                placeholder="Cosmo Note"
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                设定访问授权码 (Master Access Code) *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="建议6位以上字符或复杂密码"
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-mono tracking-wider"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                确认访问授权码 *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入以确认"
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-mono tracking-wider"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-300/80 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-purple-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>原生双模式随处部署</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                此授权码由 PBKDF2 高强度哈希存储在您的本地 SQLite 或 Cloudflare D1 数据库中，只有您自己能解密访问。
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>立即启动星脉空间</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
