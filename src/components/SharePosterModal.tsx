import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { DecisionResult } from '../types';
import { toPng } from 'html-to-image';
import { Download, Copy, Check, Sparkles, Scale, X, Flame, ShieldCheck, Compass, QrCode } from 'lucide-react';
import { playGavelSound } from '../utils/audio';

interface SharePosterModalProps {
  decision: DecisionResult;
  onClose: () => void;
}

type CardTheme = 'receipt' | 'decree' | 'polaroid';

export const SharePosterModal: React.FC<SharePosterModalProps> = ({ decision, onClose }) => {
  const [theme, setTheme] = useState<CardTheme>('receipt');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);

  const cardRef = useRef<HTMLDivElement | null>(null);

  const dateStr = new Date(decision.timestamp || Date.now()).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const serialNo = `ORACLE-${Math.abs(decision.dilemma.length * 37 + (decision.scoreA || 50)).toString().padStart(6, '0')}`;

  const handleDownloadImage = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      playGavelSound();
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // Crisp retina quality
      });
      const link = document.createElement('a');
      link.download = `赛博裁决令_${decision.dilemma.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = () => {
    const text = `⚖️【拿个主意 · 裁决令】
纠结议题：${decision.dilemma}
裁决倾向：${decision.finalVerdict.title}
天平指数：${decision.scoreA}% (${decision.optionA}) vs ${decision.scoreB}% (${decision.optionB})
神圣金句：${decision.finalVerdict.punchline}
微行动指南：${decision.microAction.step1} ${decision.microAction.step2}（${decision.microAction.deadline}）
—— 来自「拿个主意 · AI 决策助手」`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">生成专属裁决卡片 & 社交海报</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector & Watermark Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 mr-1">模板风格:</span>
            <button
              onClick={() => setTheme('receipt')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${theme === 'receipt' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🧾 赛博小票
            </button>
            <button
              onClick={() => setTheme('decree')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${theme === 'decree' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📜 终极裁决令
            </button>
            <button
              onClick={() => setTheme('polaroid')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${theme === 'polaroid' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📸 拍立得胶片
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={!showWatermark}
              onChange={(e) => setShowWatermark(!e.target.checked)}
              className="accent-cyan-500"
            />
            <span>👑 去水印 (Pro专属预览)</span>
          </label>
        </div>

        {/* Card Render Container */}
        <div className="flex justify-center p-2 sm:p-4 bg-slate-950/60 rounded-2xl border border-slate-800 overflow-x-auto">
          {/* THEME 1: RECEIPT STYLE */}
          {theme === 'receipt' && (
            <div
              ref={cardRef}
              className="w-full max-w-sm bg-[#faf8f5] text-slate-900 p-6 rounded-none shadow-2xl font-mono relative border-t-8 border-dashed border-amber-900/40"
              style={{
                backgroundImage: 'radial-gradient(#e2d9cc 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-400 space-y-1">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                  CYBER ORACLE RECEIPT
                </div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  赛博裁决所 · 账单明细
                </h3>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>编号: {serialNo}</span>
                  <span>{dateStr}</span>
                </div>
              </div>

              {/* Dilemma Item */}
              <div className="py-4 border-b border-dashed border-slate-300 space-y-2">
                <div className="text-xs text-slate-500">【纠结议题 / ITEM】</div>
                <div className="text-sm font-bold text-slate-800 leading-snug">
                  {decision.dilemma}
                </div>
              </div>

              {/* Scale Score Breakdown */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>A: {decision.optionA}</span>
                  <span className="font-bold font-mono">{decision.scoreA}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>B: {decision.optionB}</span>
                  <span className="font-bold font-mono">{decision.scoreB}%</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>天平倾斜结论:</span>
                  <span className="text-amber-800">{decision.finalVerdict.recommendedOption === 'A' ? `偏向 [A]` : `偏向 [B]`}</span>
                </div>
              </div>

              {/* Devil & Angel Punchlines */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2 text-[11px]">
                <div className="bg-amber-100/70 p-2 rounded text-amber-950">
                  <strong>👼 天使建言:</strong> {decision.angelPerspective.quote}
                </div>
                <div className="bg-rose-100/70 p-2 rounded text-rose-950">
                  <strong>😈 恶魔一击:</strong> {decision.devilPerspective.spicyRoast}
                </div>
              </div>

              {/* Micro Action */}
              <div className="py-3 border-b-2 border-dashed border-slate-400 space-y-1 text-xs">
                <div className="font-bold text-slate-800">⚡ 24H 最小执行指令:</div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  {decision.microAction.step1}
                </div>
              </div>

              {/* Barcode & Footer */}
              <div className="pt-4 text-center space-y-2">
                {/* Simulated Barcode */}
                <div className="h-10 w-full flex items-center justify-center gap-1 opacity-70">
                  {[3, 1, 2, 4, 1, 2, 5, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2].map((w, i) => (
                    <div key={i} className="bg-slate-900 h-8" style={{ width: `${w * 2}px` }} />
                  ))}
                </div>
                <div className="text-[10px] text-slate-400">
                  {showWatermark ? '★ 拿个主意 · 一键治愈选择困难症 ★' : 'AI DECISION HELPER'}
                </div>
              </div>
            </div>
          )}

          {/* THEME 2: CYBER DECREE STYLE */}
          {theme === 'decree' && (
            <div
              ref={cardRef}
              className="w-full max-w-sm bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950 text-slate-100 p-6 rounded-3xl border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden font-sans"
            >
              {/* Holographic Seal Background */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-4 right-4 text-cyan-400/30">
                <Scale className="w-16 h-16 stroke-[1]" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400">
                    CYBER SUPREME DECREE
                  </span>
                  <h3 className="text-base font-bold text-white">终极赛博裁决令</h3>
                </div>
              </div>

              {/* Dilemma Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4 space-y-1">
                <span className="text-[10px] text-cyan-400 font-mono">议题 CASE:</span>
                <p className="text-sm font-semibold text-slate-100 leading-snug">{decision.dilemma}</p>
              </div>

              {/* Balance Verdict Result */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/30 mb-4 text-center space-y-2">
                <div className="text-xs text-cyan-300 font-mono">
                  天平倾角 {Math.abs(decision.tiltAngle)}° · {decision.scoreA}% vs {decision.scoreB}%
                </div>
                <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                  {decision.finalVerdict.title}
                </div>
                <p className="text-xs text-slate-300 italic">“{decision.finalVerdict.punchline}”</p>
              </div>

              {/* Dual perspectives */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-[11px]">{decision.angelPerspective.quote}</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-[11px]">{decision.devilPerspective.spicyRoast}</span>
                </div>
              </div>

              {/* Footer Stamp & QR */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                <div>
                  <div>DATE: {dateStr}</div>
                  <div>ID: {serialNo}</div>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <QrCode className="w-6 h-6" />
                  <span className="text-[9px]">{showWatermark ? '赛博裁决所' : 'CONFIRMED'}</span>
                </div>
              </div>
            </div>
          )}

          {/* THEME 3: POLAROID STYLE */}
          {theme === 'polaroid' && (
            <div
              ref={cardRef}
              className="w-full max-w-sm bg-white text-slate-900 p-5 rounded-xl shadow-2xl border border-slate-200 font-sans"
            >
              {/* Photo Area */}
              <div className="aspect-[4/3] w-full rounded-lg bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-5 flex flex-col justify-between text-white relative overflow-hidden shadow-inner">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-mono">
                    # 情绪胶囊
                  </span>
                  <span className="text-[10px] text-white/70 font-mono">{dateStr}</span>
                </div>

                <div className="space-y-1 text-center">
                  <div className="text-xs uppercase tracking-widest text-pink-300 font-mono">
                    {decision.scoreA >= decision.scoreB ? decision.optionA : decision.optionB}
                  </div>
                  <h4 className="text-base font-bold text-white line-clamp-2">
                    {decision.dilemma}
                  </h4>
                </div>

                <div className="text-[11px] text-center text-white/90 italic bg-black/20 p-2 rounded backdrop-blur-sm">
                  “{decision.finalVerdict.punchline}”
                </div>
              </div>

              {/* Handwritten style Caption Below */}
              <div className="pt-4 pb-1 space-y-2 text-center">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {decision.oraclePerspective.cosmicSign}
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  {showWatermark ? '拿个主意 · AI 决策助手' : 'DECISION RECORD'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Export PNG & Copy Text */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCopyText}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {isCopied ? '已复制文字' : '复制裁决文案'}
          </button>

          <button
            id="download-card-png-btn"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? '生成海报中...' : '下载高清海报卡片'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
