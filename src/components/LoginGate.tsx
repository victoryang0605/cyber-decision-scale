import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ShieldCheck, Scale, Sparkles } from 'lucide-react';

interface LoginGateProps {
  /** 允许匿名体验（仅当微信未配置时） */
  allowAnonymous: boolean;
  onAnonymous: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ allowAnonymous, onAnonymous }) => {
  const handleWechatLogin = () => {
    // 跳转微信网页授权；微信内打开会拉起授权页
    window.location.href = '/api/auth/wechat';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">拿个主意 · AI 决策助手</h1>
            <p className="text-xs text-slate-400 mt-1">治愈选择困难症，纠结时让 AI 帮你拿个主意</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-left">
          <p className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 使用前请先微信登录
          </p>
          <p>· 微信授权后自动注册，获取你的微信昵称与头像</p>
          <p>· 绑定手机号后可解锁充值、额度管理</p>
          <p>· 你的信息仅保存在站长服务器，可随时注销</p>
        </div>

        <button
          onClick={handleWechatLogin}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <MessageCircle className="w-5 h-5" /> 微信一键登录 / 注册
        </button>

        <div className="flex items-center gap-1.5 justify-center text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          仅用于识别身份与额度管理，不对外公开
        </div>

        {allowAnonymous && (
          <button
            onClick={onAnonymous}
            className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
          >
            暂时以游客身份体验（不注册）
          </button>
        )}
      </motion.div>
    </div>
  );
};
