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
  LogIn,
  UserX,
  Gift,
  Package,
} from 'lucide-react';
import { QuotaInfo, SessionUser } from '../types';

export const RECHARGE_PACKAGES = [
  { id: 'p5', price: 5, credits: 20, label: '¥5', desc: '20 次' },
  { id: 'p10', price: 10, credits: 50, label: '¥10', desc: '50 次' },
  { id: 'p100', price: 100, credits: 500, label: '¥100', desc: '500 次' },
];

interface QuotaModalProps {
  quota: QuotaInfo | null;
  userKey: string;
  userId: string;
  session?: SessionUser | null;
  exceeded?: boolean;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
  onOpenAuth: () => void;
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
  onOpenAuth,
  onSavePhone,
  onDeleteAccount,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState(userKey);
  const [savedTip, setSavedTip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('p10');
  const [phoneInput, setPhoneInput] = useState(session?.phone || '');
  const [phoneMsg, setPhoneMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isLoggedIn = Boolean(session);
  // 登录用户：余额 + 注册赠送剩余；游客：设备免费额度
  const balance = session ? session.balance : quota ? quota.credits ?? 0 : 0;
  const freeRemaining = session ? session.freeRemaining : 0;
  const deviceUsed = !session && quota ? quota.used : 0;
  const deviceLimit = !session && quota ? quota.limit : 0;

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
    if (!window.confirm('确定注销账号吗？你的用户名、手机号、余额与充值记录将从服务器删除，且不可恢复。')) return;
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
              <h3 className="text-lg font-bold text-slate-100">我的额度与充值</h3>
              <p className="text-xs text-slate-400">
                {isLoggedIn ? `当前账号：${session!.username}` : '游客模式：每台设备免费 3 次'}
              </p>
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
            {isLoggedIn ? '使用次数已用完 🥲 请充值后继续使用' : '游客免费次数（3 次/设备）已用完 🥲 注册登录后获得 3 次免费并支持充值'}
          </div>
        )}

        {/* 登录用户：注册/登录入口 */}
        {!isLoggedIn && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-cyan-200 flex items-center gap-1.5">
                <Gift className="w-4 h-4" /> 注册即送 3 次免费使用
              </span>
              <p className="text-[11px] text-slate-400 mt-1">注册/登录后额度跟随账号，换设备也能用；充值次数不会丢</p>
            </div>
            <button
              onClick={onOpenAuth}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> 注册 / 登录
            </button>
          </div>
        )}

        {/* 额度展示 */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" /> {isLoggedIn ? '我的剩余次数' : '游客免费额度'}
            </span>
            {isLoggedIn ? (
              <span className="font-mono text-slate-300">
                共 <span className="text-amber-300 font-bold">{balance + freeRemaining}</span> 次
              </span>
            ) : (
              <span className="font-mono text-slate-400">
                已用 <span className="text-amber-300 font-bold">{deviceUsed}</span> / {deviceLimit || 3} 次
              </span>
            )}
          </div>
          {isLoggedIn ? (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500">💰 付费余额</span>
                <div className="text-sm font-bold text-emerald-300 font-mono">{balance} 次</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500">🎁 注册赠送</span>
                <div className={`text-sm font-bold font-mono ${freeRemaining > 0 ? 'text-cyan-300' : 'text-slate-600'}`}>
                  {freeRemaining} 次
                </div>
              </div>
            </div>
          ) : (
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${deviceUsed >= (deviceLimit || 3) ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                style={{ width: `${Math.min(100, (deviceUsed / (deviceLimit || 3)) * 100)}%` }}
              />
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            计费顺序：付费余额 → 注册赠送 / 游客设备额度；每次成功推演消耗 1 次；接入自己的 Key 后不再消耗。
          </p>
        </div>

        {/* 充值套餐 */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-3">
          <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-400" /> 购买使用次数
          </div>
          <div className="grid grid-cols-3 gap-2">
            {RECHARGE_PACKAGES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPackage(p.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedPackage === p.id
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40'
                }`}
              >
                <div className="text-base font-black">{p.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <img
              src="/qr-pay.png"
              alt="收款码"
              className="w-28 h-28 rounded-xl border border-amber-500/30 bg-white object-contain shrink-0"
            />
            <div className="text-[11px] text-slate-400 space-y-1.5">
              <p>1. 微信/支付宝扫码支付所选套餐金额</p>
              <p>2. 复制下方「用户 ID」发给站长确认</p>
              <p>3. 站长确认收款后立即到账对应次数</p>
              <p className="text-[10px] text-amber-300/80">付款后请保留截图，便于对账</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-500 shrink-0">{isLoggedIn ? '我的用户名：' : '游客用户 ID：'}</span>
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
            游客付款请把「用户 ID」发给站长并<button className="underline" onClick={onOpenAuth}>注册/登录</button>
            后，站长确认收款即到账。
          </p>
        </div>

        {/* 手机号（登录用户） */}
        {isLoggedIn && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-slate-400" /> 手机号
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
            <KeyRound className="w-4 h-4 text-cyan-400" /> 接入自己的 DeepSeek API Key（可选）
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            填入你自己的 Key 后，AI 调用将<b className="text-cyan-300">使用你的 DeepSeek 账户计费</b>
            ，不消耗本站任何额度。Key 仅保存在你本机浏览器，只用于本次请求，不会存储到服务器。
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
          {isLoggedIn ? (
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/60 text-slate-500 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              title="注销账号：删除用户名、手机号、余额与充值记录"
            >
              <UserX className="w-3.5 h-3.5" /> {deleting ? '注销中...' : '注销账号'}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" /> 注册 / 登录
            </button>
          )}
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
