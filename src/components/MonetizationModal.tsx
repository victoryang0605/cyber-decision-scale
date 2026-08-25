import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, ShoppingBag, Tv, Globe, Check, Zap, X, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MonetizationModalProps {
  onClose: () => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'pro' | 'pod' | 'ads' | 'global'>('pro');
  const [isSimulatedPaid, setIsSimulatedPaid] = useState(false);

  const handleSimulatePayment = () => {
    setIsSimulatedPaid(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      setIsSimulatedPaid(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                拿个主意 · 商业变现与盈利模型展示
              </h3>
              <p className="text-xs text-slate-400">
                轻量爆款小工具经海外/国内独立开发者验证的 4 大现金流变现矩阵
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

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('pro')}
            className={`py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${activeTab === 'pro' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Crown className="w-3.5 h-3.5" /> 1. Pro会员增值
          </button>
          <button
            onClick={() => setActiveTab('pod')}
            className={`py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${activeTab === 'pod' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> 2. 实体周边POD
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${activeTab === 'ads' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Tv className="w-3.5 h-3.5" /> 3. 广告与品牌赞助
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${activeTab === 'global' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Globe className="w-3.5 h-3.5" /> 4. 出海买断制
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[260px]">
          {/* TAB 1: PRO FREEMIUM */}
          {activeTab === 'pro' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">
                      ⚡ 增值特权方案（Freemium 模式）
                    </h4>
                    <p className="text-xs text-slate-400">
                      基础推演完全免费引爆传播，个性化与深度功能精准变现
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-amber-300 font-mono">¥9.9 <span className="text-xs font-normal text-slate-400">/ 终身买断</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>一键去除海报水印 & 4K 超清卡片导出</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>解锁 5+ 套限定黑金/中古/霓虹海报皮肤</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>AI 深度推演：5 轮连续追问与博弈对抗</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>无限历史记录云端加密同步</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">💡 转化率优化技巧：</div>
                <p>
                  在用户点击“下载海报”或“连续追问第2次”时弹出轻量付费浮层（仅需 ¥2.99~¥9.9），极低门槛让用户不需要思考即可完成支付。
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: POD PRINT ON DEMAND */}
          {activeTab === 'pod' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 space-y-3">
                <h4 className="text-sm font-bold text-cyan-200">
                  📦 实体周边文创一键定制（POD 模式）
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  裁决结果具有强烈的人生节点纪念意义。用户在生成裁决令后，可一键点击“定制实体物品”，系统自动对接供应链打印代发。
                </p>

                <div className="grid grid-cols-3 gap-2.5 text-center text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-1">
                    <div className="font-bold text-slate-200">🧲 实体裁决冰箱贴</div>
                    <div className="text-cyan-400 font-mono font-bold">¥19.9</div>
                    <div className="text-[10px] text-slate-500">成本 ¥4 / 毛利 80%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-1">
                    <div className="font-bold text-slate-200">🏷️ 金属激光雕刻铭牌</div>
                    <div className="text-cyan-400 font-mono font-bold">¥29.9</div>
                    <div className="text-[10px] text-slate-500">成本 ¥8 / 毛利 73%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-1">
                    <div className="font-bold text-slate-200">✉️ 仪式感手封明信片</div>
                    <div className="text-cyan-400 font-mono font-bold">¥9.9</div>
                    <div className="text-[10px] text-slate-500">成本 ¥1.5 / 毛利 85%</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                接入国内定制一件代发平台 API（如指纹定制/阿里供应链），海外接入 Printful/Gelato API，全程零库存压力。
              </div>
            </div>
          )}

          {/* TAB 3: ADS & SPONSORSHIPS */}
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 space-y-3">
                <h4 className="text-sm font-bold text-purple-200">
                  📺 流量广告变现与品牌软性赞助
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-purple-300">激励视频广告（小程序/移动端）：</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        每日免费赠送 3 次天平分析，看 15 秒广告解锁额外 3 次或解锁高级赛博轮盘。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-purple-300">场景化品牌特约植入：</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        在用户纠结“今晚吃什么”生成卡片底部，动态带出某外卖平台/本地餐饮优惠券，点击按 CPS（成交分成）或 CPC 结算。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GLOBAL EXPANSION */}
          {activeTab === 'global' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
                <h4 className="text-sm font-bold text-emerald-200">
                  🌍 全球化出海变现（Product Hunt / Twitter / TikTok）
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  海外用户非常乐意为简洁好玩的 Micro-SaaS 买单。支持一键切换英文界面与美元定价。
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20">
                    <div className="text-slate-400">单次买断 (Lifetime)</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">$4.99 ~ $9.99</div>
                    <div className="text-[10px] text-slate-500 mt-1">Stripe / LemonSqueezy</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20">
                    <div className="text-slate-400">月度订阅 (Pro Plan)</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">$2.99 / mo</div>
                    <div className="text-[10px] text-slate-500 mt-1">高频决策者与创作者</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Simulate Payment Demo */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {isSimulatedPaid ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> 模拟支付成功！Pro 权益已激活
              </span>
            ) : (
              '点击体验变现流程与即时反馈'
            )}
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={isSimulatedPaid}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Crown className="w-4 h-4" /> 体验模拟开通 Pro
          </button>
        </div>
      </motion.div>
    </div>
  );
};
