import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, LogIn, Scale, ShieldCheck, Loader2 } from 'lucide-react';
import { getDeviceFingerprint } from '../utils/device';

interface AuthPanelProps {
  onAuthed: (token: string, user: { username: string; phone: string; balance: number; freeRemaining: number }) => void;
}

/**
 * 注册 / 登录面板（用户名 + 手机号 + 密码）
 * 注册成功即赠送 3 次免费使用；登录后额度跟随账号（换设备也受限）
 */
export const AuthPanel: React.FC<AuthPanelProps> = ({ onAuthed }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const isRegister = mode === 'register';
      const res = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRegister
            ? { username, phone, password, deviceId: getDeviceFingerprint() }
            : { username, password, deviceId: getDeviceFingerprint() },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '操作失败，请稍后再试');
        return;
      }
      onAuthed(data.token, data.user);
    } catch {
      setError('网络错误，请稍后再试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">{mode === 'register' ? '注册账号' : '登录账号'}</h3>
            <p className="text-xs text-slate-400">
              {mode === 'register' ? '注册即送 3 次免费使用，额度跟随账号' : '登录后使用账号额度（跨设备有效）'}
            </p>
          </div>
        </div>

        {/* 模式切换 */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${mode === 'register' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1" /> 注册
          </button>
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${mode === 'login' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LogIn className="w-3.5 h-3.5 inline mr-1" /> 登录
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="2-20 位中文/字母/数字/下划线"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                placeholder="11 位手机号"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        <button
          onClick={submit}
          disabled={busy || !username.trim() || password.length < 6 || (mode === 'register' && phone.length !== 11)}
          className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white disabled:opacity-50 transition-all shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'register' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {busy ? '请稍候...' : mode === 'register' ? '注册并开始使用（送 3 次）' : '登录'}
        </button>

        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          注册即表示同意：信息仅用于额度管理与充值对账；可随时注销账号删除记录
        </p>
      </motion.div>
    </div>
  );
};
