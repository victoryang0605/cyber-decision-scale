import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  KeyRound,
  X,
  Save,
  Trash2,
  Gauge,
  Coins,
  ShieldCheck,
  Check,
  Copy,
  QrCode,
  Smartphone,
  LogOut,
  UserX,
} from 'lucide-react';
import { QuotaInfo, SessionUser } from '../types';

interface QuotaModalProps {
  quota: QuotaInfo | null;
  userKey: string;
  userId: string;
  session?: SessionUser | null;
  exceeded?: boolean;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
  onSavePhone?: (phone: string) => Promise<boolean>;
  onDeleteAccount?: () => Promise<boolean>;
  onClose: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  quota,
  userKey,
  userId,
  session,
  exceeded,
  onSaveKey,
  onClearKey,
  onSavePhone,
  onDeleteAccount,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState(userKey);
  const [savedTip, setSavedTip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOk, setQrOk] = useState(true);
  const [phoneInput, setPhoneInput] = useState(session?.phone || '');
  const [phoneMsg, setPhoneMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  const remaining = session
    ? Math.max(0, session.freeLimit - session.freeUsed)
    : quota
      ? quota.remaining
      : undefined;
  const credits = session ? session.balance : quota ? quota.credits ?? 0 : 0;

  const handleSaveKey = () => {
    onSaveKey(keyInput.trim());
    setSavedTip(true);
    setTimeout(() => setSavedTip(false), 1800);
  };

  const handleCopyUid = () => {
    navigator.clipboard
      .writeText(userId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  };

  const handleSavePhone = async () => {
    if (!onSavePhone || !/^1\d{10}$/.test(phoneInput)) {
      setPhoneMsg('请输入 11 位手机号');
      return;
    }
    const ok = await onSavePhone(phoneInput);
    setPhoneMsg(ok ? '手机号已保存 ✓' : '保存失败，请稍后再试');
    setTimeout(() => setPhoneMsg(''), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount) return;
    if (!window.confirm('确定注销账号吗？你的昵称、手机号、余额与充值记录将从服务器删除，且不可恢复。')) return;
    setDeleting(true);
    const ok = await onDeleteAccount();
    setDeleting(false);
    if (ok) onClose();
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
              <p className="text-xs text-slate-400">免费额度用完？接入自己的 Key 或充值继续</p>
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

        {/* Free quota + paid credits */}
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
                style={{
                  width: `${Math.min(100, (((quota?.limit || 1) - remaining) / (quota?.limit || 1)) * 100)}%`,
                }}
              />
            </div>
          )}
          {credits > 0 && (
            <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" /> 付费余额：{credits} 次（优先消耗）
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            每次成功的天平推演消耗 1 次：有付费余额先扣余额，否则扣免费额度；接入自己的 Key 后不再消耗。
          </p>
        </div>

        {/* Recharge: QR + manual confirmation */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-3">
          <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-400" /> 充值解锁更多次数
          </div>
          <div className="flex gap-3 items-center">
            {qrOk ? (
              <img
                src="/qr-pay.png"
                alt="收款码"
                onError={() => setQrOk(false)}
                className="w-24 h-24 rounded-xl border border-amber-500/30 bg-white object-contain shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-amber-500/40 flex items-center justify-center text-[10px] text-amber-200/70 text-center px-1 shrink-0">
                收款码<br />占位
              </div>
            )}
            <div className="text-[11px] text-slate-400 space-y-1.5">
              <p>
                1. 扫码支付（微信/支付宝均可），金额随意，建议 <b className="text-amber-300">¥10 = 50 次</b>
              </p>
              <p>2. 复制下方「我的用户 ID」发给站长（或付款备注里填写）</p>
              <p>3. 站长确认收款后为你发放次数，立即到账</p>
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-500 shrink-0">我的用户 ID：</span>
            <code className="flex-1 truncate font-mono text-[11px] text-cyan-300">{userId}</code>
            <button
              onClick={handleCopyUid}
              className="shrink-0 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <p className="text-[10px] text-slate-600">
            找不到收款码？说明站长还没上传收款码图片（应位于站点 /qr-pay.png），可直接联系站长线下转账。
          </p>
        </div>

        {/* 手机号绑定（微信登录用户） */}
        {session && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-slate-400" /> 手机号
              {!session.phone && <span className="text-[10px] text-amber-300 font-normal">（建议绑定，便于充值对账）</span>}
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                placeholder="11 位手机号"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none font-mono"
              />
              <button
                onClick={handleSavePhone}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                保存
              </button>
            </div>
            {phoneMsg && <p className="text-[11px] text-cyan-300">{phoneMsg}</p>}
          </div>
        )}

        {/* BYOK */}
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
          <div className="text-xs font-semibold text-cyan-200 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-cyan-400" /> 接入自己的 DeepSeek API Key（推荐）
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            填入你自己的 Key 后，AI 调用将<b className="text-cyan-300">使用你的 DeepSeek 账户计费</b>
            ，不再消耗任何额度。Key 仅保存在你本机浏览器，只用于本次请求，不会存储到服务器。
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
                <ShieldCheck className="w-3.5 h-3.5" /> 已接入个人 Key，当前不消耗任何额度
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

        {/* Footer */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-800">
          <div className="flex items-center gap-2">
            {session && (
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/60 text-slate-500 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                title="注销账号：删除昵称、手机号、余额与充值记录"
              >
                <UserX className="w-3.5 h-3.5" /> {deleting ? '注销中...' : '注销账号'}
              </button>
            )}
            {!session && (
              <span className="text-[11px] text-slate-600 flex items-center gap-1">
                <LogOut className="w-3 h-3" /> 当前为游客身份
              </span>
            )}
          </div>
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
