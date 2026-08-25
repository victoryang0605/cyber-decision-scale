import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { playTickSound, playSuccessChime } from '../utils/audio';
import { RouletteOption } from '../types';
import { Plus, Trash2, RotateCw, Sparkles, CheckCircle2, Shuffle } from 'lucide-react';

const DEFAULT_OPTIONS: RouletteOption[] = [
  { id: '1', text: '麻辣火锅', color: '#ef4444', weight: 1 },
  { id: '2', text: '轻食沙拉', color: '#10b981', weight: 1 },
  { id: '3', text: '日料寿司', color: '#f59e0b', weight: 1 },
  { id: '4', text: '现烤披萨', color: '#8b5cf6', weight: 1 },
  { id: '5', text: '牛肉拉面', color: '#06b6d4', weight: 1 },
  { id: '6', text: '自律喝水断食', color: '#ec4899', weight: 1 },
];

const COLOR_PALETTE = [
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#f43f5e', // rose
  '#14b8a6', // teal
];

export const RouletteWheel: React.FC = () => {
  const [options, setOptions] = useState<RouletteOption[]>(DEFAULT_OPTIONS);
  const [newOptionText, setNewOptionText] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<RouletteOption | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSoundSectorRef = useRef<number>(-1);

  // 轮盘逻辑尺寸（CSS 像素）；实际像素按 devicePixelRatio 放大，保证高分屏清晰
  const LOGICAL_SIZE = 360;

  // Draw the roulette wheel on canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 高分屏自适应：canvas 物理分辨率 = 逻辑尺寸 × DPR（上限 3x，避免超大画布）
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pixelSize = Math.round(LOGICAL_SIZE * dpr);
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }
    // 之后所有绘制均以逻辑尺寸（CSS 像素）为坐标系
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = LOGICAL_SIZE;
    const height = LOGICAL_SIZE;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    if (options.length === 0) {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    const totalSlices = options.length;
    const sliceAngle = (2 * Math.PI) / totalSlices;

    options.forEach((opt, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw Slice Sector
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color;
      ctx.fill();

      // Slice inner stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Draw Label text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      
      const maxTextLen = radius - 30;
      let displayStr = opt.text;
      if (ctx.measureText(displayStr).width > maxTextLen) {
        displayStr = displayStr.slice(0, 7) + '...';
      }
      ctx.fillText(displayStr, radius - 18, 5);
      ctx.restore();
    });

    // Outer cyber rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Center Hub Jewel
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel();
    // 窗口尺寸 / 缩放变化（如高分屏切换）时重绘，保持清晰
    const onResize = () => drawWheel();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [options]);

  const handleAddOption = () => {
    if (!newOptionText.trim() || options.length >= 16) return;
    const newColor = COLOR_PALETTE[options.length % COLOR_PALETTE.length];
    const newOpt: RouletteOption = {
      id: String(Date.now()),
      text: newOptionText.trim(),
      color: newColor,
      weight: 1,
    };
    setOptions([...options, newOpt]);
    setNewOptionText('');
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const handlePresetMeals = () => {
    setOptions(DEFAULT_OPTIONS);
  };

  const handlePresetWeekends = () => {
    setOptions([
      { id: 'w1', text: '躺平补觉', color: '#06b6d4', weight: 1 },
      { id: 'w2', text: '周边户外徒步', color: '#10b981', weight: 1 },
      { id: 'w3', text: '咖啡厅搞副业', color: '#f59e0b', weight: 1 },
      { id: 'w4', text: '约朋友吃大餐', color: '#ec4899', weight: 1 },
      { id: 'w5', text: '沉浸式打游戏', color: '#8b5cf6', weight: 1 },
      { id: 'w6', text: '深度打扫房间', color: '#3b82f6', weight: 1 },
    ]);
  };

  const spinWheel = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    // Random prize index
    const prizeIndex = Math.floor(Math.random() * options.length);
    const sliceDeg = 360 / options.length;
    
    // Top pointer is at -90 deg (270 deg)
    // The slice at prizeIndex spans from [prizeIndex * sliceDeg, (prizeIndex + 1) * sliceDeg]
    // To align center of slice with top pointer:
    const targetSliceCenterDeg = prizeIndex * sliceDeg + sliceDeg / 2;
    const stopAngle = 360 - targetSliceCenterDeg - 90;

    const fullSpins = (6 + Math.floor(Math.random() * 3)) * 360;
    const finalRotation = currentRotation + fullSpins + (stopAngle - (currentRotation % 360) + 360) % 360;

    // Trigger intermittent tick sound during spin
    let startTime: number | null = null;
    const duration = 4000;

    const tickInterval = setInterval(() => {
      playTickSound(500 + Math.random() * 200);
    }, 120);

    setTimeout(() => {
      clearInterval(tickInterval);
    }, duration - 500);

    setCurrentRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const selected = options[prizeIndex];
      setWinner(selected);
      playSuccessChime();
      
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, duration);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5" /> 机械轮盘 · 多选决断
          </div>
          <h3 className="text-xl font-bold text-slate-100">赛博命运决断轮盘</h3>
          <p className="text-xs text-slate-400">适合多选一纠结（如吃什么、周末干嘛、谁去拿外卖等）</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePresetMeals}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            🍱 美食模板
          </button>
          <button
            onClick={handlePresetWeekends}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            🎡 周末模板
          </button>
        </div>
      </div>

      {/* Main Grid: Wheel on Left, Options Editor on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Wheel Canvas on Left (7 cols) */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative">
          {/* Top Fixed Pointer Arrow */}
          <div className="absolute -top-3 z-30 flex flex-col items-center">
            <div className="w-6 h-6 bg-gradient-to-b from-cyan-400 to-cyan-500 rotate-45 border-2 border-white shadow-lg transform translate-y-1" />
            <div className="w-2 h-2 rounded-full bg-white -mt-1 shadow" />
          </div>

          {/* Rotating Canvas Wrapper */}
          <div className="relative p-2">
            <motion.div
              animate={{ rotate: currentRotation }}
              transition={{
                duration: 4,
                ease: [0.15, 0.95, 0.35, 1], // Realistic deceleration curve
              }}
              className="rounded-full shadow-2xl shadow-cyan-950/60"
            >
              <canvas
                ref={canvasRef}
                className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full"
              />
            </motion.div>
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-4 w-full max-w-xs">
            <button
              id="spin-roulette-btn"
              onClick={spinWheel}
              disabled={isSpinning || options.length < 2}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? '命运飞速旋转中...' : '启动命运轮盘 (Spin)'}
            </button>
          </div>
        </div>

        {/* Options Management on Right (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              候选项列表 ({options.length}/16)
            </h4>
            <span className="text-[11px] text-slate-500">点击 ✕ 移除</span>
          </div>

          {/* Input to add custom option */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="输入新选项..."
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 focus:outline-none"
            />
            <button
              onClick={handleAddOption}
              disabled={!newOptionText.trim() || options.length >= 16}
              className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          </div>

          {/* Options Tags / Badges List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="font-medium line-clamp-1">{opt.text}</span>
                </div>
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(opt.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="移除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Winner Modal Banner */}
      {winner && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/80 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg font-bold text-lg"
              style={{ backgroundColor: winner.color }}
            >
              🎉
            </div>
            <div>
              <span className="text-[10px] text-purple-400 font-mono tracking-wider uppercase">
                DESTINY SELECTED
              </span>
              <h4 className="text-base font-bold text-slate-100">
                命运最终裁定：<span className="text-pink-300 font-extrabold">{winner.text}</span>
              </h4>
            </div>
          </div>
          <button
            onClick={spinWheel}
            className="px-4 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/40 text-xs font-semibold transition-colors"
          >
            不满意？再转一次
          </button>
        </motion.div>
      )}
    </div>
  );
};
