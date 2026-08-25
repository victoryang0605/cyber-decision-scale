import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, X, Save, Trash2, Gauge, Coins, ShieldCheck, Check } from 'lucide-react';
import { QuotaInfo } from '../types';

interface QuotaModalProps {
  quota: QuotaInfo | null;
  userKey: string;
  exceeded?: boolean;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
  onClose: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  quota,
  userKey,
  exceeded,
  onSaveKey,
  onClearKey,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState(userKey);
  const [savedTip, setSavedTip] = useState(false);

  const remaining = quota ? quota.remaining : undefined;

  const handleSaveKey = () => {
    onSaveKey(keyInput.trim());
    setSavedTip(true);
    setTimeout(() => setSavedTip(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">我的额度与付费方式</h3>
              <p className="text-xs text-slate-400">免费额度用完？接入自己的 Key 继续使用</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {exceeded && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
            免费次数已用完 🥲 选择下面任一种方式继续使用：
          </div>
        )}

        {/* Free quota */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" /> 免费额度
            </span>
            {quota ? (
              <span className="font-mono text-slate-400">
                已用 <span className="text-amber-300 font-bold">{quota.used}</span> / {quota.limit} 次
              </span>
            ) : (
              <span className="text-slate-500">尚未使用</span>
            )}
          </div>
          {typeof remaining === 'number' && (
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  remaining > 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, ((quota?.limit || 1) - remaining) / (quota?.limit || 1) * 100)}%` }}
              />
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            每次成功的天平推演消耗 1 次免费额度；接入自己的 Key 后不再消耗。
          </p>
        </div>

        {/* BYOK */}
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
          <div className="text-xs font-semibold text-cyan-200 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-cyan-400" /> 接入自己的 DeepSeek API Key（推荐）
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            填入你自己的 Key 后，AI 调用将<b className="text-cyan-300">使用你的 DeepSeek 账户计费</b>
            ，不再消耗免费额度，也不受次数限制。Key 仅保存在你本机浏览器，只用于本次请求，不会存储到服务器。
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk- 开头的 DeepSeek API Key"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none font-mono"
            />
            <button
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
            >
              {savedTip ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {savedTip ? '已保存' : '保存'}
            </button>
          </div>
          {userKey && (
            <div className="flex items-center justify-between text-[11px] text-emerald-300">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 已接入个人 Key，当前不消耗免费额度
              </span>
              <button
                onClick={() => {
                  onClearKey();
                  setKeyInput('');
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> 移除
              </button>
            </div>
          )}
        </div>

        {/* Recharge placeholder (next step) */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-1.5">
          <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" /> 充值解锁更多次数（即将上线）
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            后续将支持小额充值，购买次数包后按次扣费，所有调用仍走站长 DeepSeek 账户。充值渠道待接入。
          </p>
        </div>

        {/* Footer */}
        <div className="pt-1 flex justify-end border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            知道了
          </button>
        </div>
      </motion.div>
    </div>
  );
};
