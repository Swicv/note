import React, { useState, useEffect, useRef } from 'react';
import { CosmoLogo } from '../brand/CosmoLogo';
import { api, tokenStorage } from '../../lib/api';
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MasterLockScreenProps {
  onUnlocked: () => void;
  appTitle?: string;
}

export const MasterLockScreen: React.FC<MasterLockScreenProps> = ({
  onUnlocked,
  appTitle = 'Cosmo Note',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.unlock(password);
      if (res.token) {
        tokenStorage.set(res.token);
        // Delightful particle burst
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#00f2fe', '#8b5cf6', '#ec4899'],
        });
        setTimeout(() => {
          onUnlocked();
        }, 200);
      }
    } catch (err: any) {
      setError(err.message || '访问授权码错误，请重新输入');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.select();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07080d]/90 backdrop-blur-3xl animate-in fade-in duration-300">
      <div
        className={`w-full max-w-md relative transition-transform duration-300 ${
          isShaking ? 'translate-x-[-8px]' : ''
        }`}
      >
        {/* Ambient Halo Behind Card */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-75" />

        {/* Lock Screen Glass Card */}
        <div className="relative rounded-2xl border border-white/10 bg-[#0d101a]/95 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-4 shadow-inner">
              <CosmoLogo size="hero" showText={false} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
              <span>{appTitle}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                LOCKED
              </span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-xs">
              思源式单密保访问门禁 · 请输入授权码唤醒知识星图
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="输入访问授权码..."
                className="w-full pl-10 pr-11 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-mono text-sm tracking-wider shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-xs px-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>解锁知识宇宙</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>端到端 PBKDF2 安全加密</span>
            </div>
            <div className="flex items-center gap-1 text-purple-400/80">
              <Sparkles className="w-3 h-3" />
              <span>Cloudflare / Docker 原生</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
