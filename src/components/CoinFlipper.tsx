import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { playCoinFlipSound, playCoinLandSound, playSuccessChime } from '../utils/audio';
import { Sparkles, RotateCw, Heart, HelpCircle, CheckCircle } from 'lucide-react';

interface CoinFlipperProps {
  defaultOptionA?: string;
  defaultOptionB?: string;
  onDecide?: (winner: string) => void;
}

export const CoinFlipper: React.FC<CoinFlipperProps> = ({
  defaultOptionA = '选项 A（正面）',
  defaultOptionB = '选项 B（反面）',
  onDecide,
}) => {
  const [optionA, setOptionA] = useState(defaultOptionA);
  const [optionB, setOptionB] = useState(defaultOptionB);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'A' | 'B' | null>(null);
  const [flipCount, setFlipCount] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [revealedSubconscious, setRevealedSubconscious] = useState(false);

  const flipCoin = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setResult(null);
    setRevealedSubconscious(false);
    playCoinFlipSound();

    // Random outcome
    const isHeads = Math.random() > 0.5;
    const targetSide = isHeads ? 'A' : 'B';
    
    // Add 5-8 full spins (1800 - 2880 deg) + landing offset
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const targetDeg = rotation + extraSpins + (isHeads ? 0 : 180);
    
    setRotation(targetDeg);

    setTimeout(() => {
      setIsFlipping(false);
      setResult(targetSide);
      setFlipCount((prev) => prev + 1);
      playCoinLandSound();
      
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: isHeads ? ['#06b6d4', '#3b82f6', '#ffffff'] : ['#ec4899', '#f43f5e', '#ffffff'],
      });

      onDecide?.(targetSide === 'A' ? optionA : optionB);
    }, 1800);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
      {/* Glow aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Subconscious Truth Insight */}
      <div className="text-center space-y-1 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-1">
          <Sparkles className="w-3.5 h-3.5" /> 潜意识透镜 · 3D 命运硬币
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
          抛向空中的那一刻，答案其实已在心中
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          心理学研究：当硬币在空中翻转的 2 秒内，你心里祈祷落下的那一面，就是最真实的潜意识渴望。
        </p>
      </div>

      {/* Inputs for Option A & B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        <div className="space-y-1">
          <label className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold">
              正
            </span>
            正面对应 (Option A)
          </label>
          <input
            type="text"
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 focus:outline-none transition-colors"
            placeholder="例如：买！/ 冲！/ 去旅游"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-pink-400 font-mono flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center text-[10px] font-bold">
              反
            </span>
            反面对应 (Option B)
          </label>
          <input
            type="text"
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-pink-500 text-xs text-slate-200 focus:outline-none transition-colors"
            placeholder="例如：不买 / 守 / 留在原地"
          />
        </div>
      </div>

      {/* 3D Coin Stage */}
      <div className="py-8 flex flex-col items-center justify-center relative min-h-[220px]">
        {/* Shadow under coin */}
        <motion.div
          animate={{
            scale: isFlipping ? [1, 0.4, 1.2, 0.5, 1] : 1,
            opacity: isFlipping ? [0.4, 0.1, 0.5, 0.1, 0.6] : 0.6,
          }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className="absolute bottom-6 w-32 h-6 bg-black/60 rounded-full blur-md"
        />

        {/* 3D Coin Object */}
        <motion.div
          className="relative w-36 h-36 cursor-pointer select-none"
          style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: rotation,
            y: isFlipping ? [-20, -120, -10, -40, 0] : 0,
            scale: isFlipping ? [1, 1.15, 0.95, 1] : 1,
          }}
          transition={{
            duration: 1.8,
            ease: [0.25, 1, 0.5, 1],
          }}
          onClick={flipCoin}
          whileHover={{ scale: isFlipping ? 1 : 1.05 }}
          whileTap={{ scale: isFlipping ? 1 : 0.95 }}
        >
          {/* Front Face (Option A - Cyan Gold) */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-200 shadow-2xl flex flex-col items-center justify-center p-3 text-center"
            style={{
              backfaceVisibility: 'hidden',
              boxShadow: '0 0 25px rgba(251, 191, 36, 0.4), inset 0 0 15px rgba(255,255,255,0.6)',
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-dashed border-amber-700/40 flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-mono tracking-widest text-amber-900 font-bold uppercase">
                CYBER DECISION
              </span>
              <span className="text-sm font-black text-amber-950 line-clamp-2 my-1 px-1">
                {optionA}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-900 font-mono font-bold">
                正面 · HEADS
              </span>
            </div>
          </div>

          {/* Back Face (Option B - Cyber Violet) */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-700 via-purple-500 to-pink-400 border-4 border-purple-200 shadow-2xl flex flex-col items-center justify-center p-3 text-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.4), inset 0 0 15px rgba(255,255,255,0.6)',
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-dashed border-purple-900/40 flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-mono tracking-widest text-purple-950 font-bold uppercase">
                ORACLE DESTINY
              </span>
              <span className="text-sm font-black text-white line-clamp-2 my-1 px-1">
                {optionB}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-100 font-mono font-bold">
                反面 · TAILS
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions & Result Display */}
      <div className="space-y-4 relative z-10">
        <button
          id="flip-coin-btn"
          onClick={flipCoin}
          disabled={isFlipping}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-950 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <RotateCw className={`w-4 h-4 ${isFlipping ? 'animate-spin' : ''}`} />
          {isFlipping ? '命运在翻转...' : flipCount === 0 ? '掷出命运硬币 (点击抛掷)' : '再抛一次'}
        </button>

        {/* Revealed Outcome & Subconscious Reflection Card */}
        {result && !isFlipping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  硬币裁决结果：
                  <span className="text-amber-400 font-bold text-sm ml-1">
                    {result === 'A' ? `【正面】${optionA}` : `【反面】${optionB}`}
                  </span>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">第 {flipCount} 次抛掷</span>
            </div>

            {/* Subconscious Question */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>潜意识灵魂考问：</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                看到这个结果的一瞬间，你的第一感觉是<strong className="text-emerald-300 font-normal">「松了口气」</strong>还是<strong className="text-amber-300 font-normal">「隐隐失望」</strong>？
              </p>
              
              {!revealedSubconscious ? (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setRevealedSubconscious(true)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs transition-colors"
                  >
                    😊 松了口气（这就是我要的）
                  </button>
                  <button
                    onClick={() => setRevealedSubconscious(true)}
                    className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs transition-colors"
                  >
                    🥺 隐隐失望（我其实想选另一边）
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-2 rounded bg-slate-800/80 text-[11px] text-cyan-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>恭喜你找到了真实心声！硬币只负责唤醒潜意识，去遵从内心吧。</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
