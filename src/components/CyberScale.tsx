import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WeightItem } from '../types';
import { Plus, Trash2, Sparkles, Scale, Info } from 'lucide-react';
import { playScaleClinkSound } from '../utils/audio';

interface CyberScaleProps {
  optionA: string;
  optionB: string;
  scoreA: number;
  scoreB: number;
  weightsA: WeightItem[];
  weightsB: WeightItem[];
  onWeightsChange?: (newWeightsA: WeightItem[], newWeightsB: WeightItem[]) => void;
  isAnalyzing?: boolean;
}

export const CyberScale: React.FC<CyberScaleProps> = ({
  optionA,
  optionB,
  scoreA,
  scoreB,
  weightsA,
  weightsB,
  onWeightsChange,
  isAnalyzing = false,
}) => {
  const [showAddWeightModal, setShowAddWeightModal] = useState<'A' | 'B' | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newWeightVal, setNewWeightVal] = useState(3);
  const [newReason, setNewReason] = useState('');

  // Calculate dynamic tilt angle from weights
  const totalWeightA = weightsA.reduce((sum, w) => sum + (w.weight || 1), 0);
  const totalWeightB = weightsB.reduce((sum, w) => sum + (w.weight || 1), 0);
  
  const sumWeights = totalWeightA + totalWeightB || 1;
  const ratioA = totalWeightA / sumWeights;
  
  // Angle: -22 to 22 deg. Positive tilts towards Left (Option A), Negative tilts towards Right (Option B)
  // Left heavy = tilts clockwise towards left (positive deg)
  const dynamicAngle = isAnalyzing ? 0 : Math.max(-20, Math.min(20, (ratioA - 0.5) * 44));

  const handleAddWeight = () => {
    if (!newLabel.trim()) return;
    const item: WeightItem = {
      id: String(Date.now()),
      label: newLabel.trim(),
      weight: newWeightVal,
      reason: newReason.trim() || '用户自定义直觉砝码',
    };
    
    if (showAddWeightModal === 'A') {
      const updatedA = [...weightsA, item];
      onWeightsChange?.(updatedA, weightsB);
    } else if (showAddWeightModal === 'B') {
      const updatedB = [...weightsB, item];
      onWeightsChange?.(weightsA, updatedB);
    }
    
    playScaleClinkSound(newWeightVal >= 4);
    setShowAddWeightModal(null);
    setNewLabel('');
    setNewReason('');
    setNewWeightVal(3);
  };

  const handleRemoveWeight = (side: 'A' | 'B', index: number) => {
    if (side === 'A') {
      const updatedA = weightsA.filter((_, i) => i !== index);
      onWeightsChange?.(updatedA, weightsB);
    } else {
      const updatedB = weightsB.filter((_, i) => i !== index);
      onWeightsChange?.(weightsA, updatedB);
    }
    playScaleClinkSound(false);
  };

  return (
    <div id="cyber-scale-container" className="w-full bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-cyan-950/40">
      {/* Cyber grid background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Header bar of Scale */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              物理级赛博天平
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                {isAnalyzing ? '博弈演算中...' : `倾角 ${Math.abs(Math.round(dynamicAngle))}° ${dynamicAngle > 0 ? '偏向A' : dynamicAngle < 0 ? '偏向B' : '平衡'}`}
              </span>
            </h3>
            <p className="text-xs text-slate-400">可自由点击添加/移除砝码，天平将实时重新物理平衡</p>
          </div>
        </div>

        {/* Dynamic percentage bar */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-cyan-400 font-bold">{Math.round(ratioA * 100)}%</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: '50%' }}
              animate={{ width: `${ratioA * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            />
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: '50%' }}
              animate={{ width: `${(1 - ratioA) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            />
          </div>
          <span className="text-pink-400 font-bold">{Math.round((1 - ratioA) * 100)}%</span>
        </div>
      </div>

      {/* SVG Interactive Animated Scale */}
      <div className="relative w-full h-64 sm:h-72 flex items-center justify-center my-2">
        <svg viewBox="0 0 500 280" className="w-full h-full max-w-xl overflow-visible select-none">
          {/* Base Stand */}
          <polygon points="210,265 290,265 260,190 240,190" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
          {/* Vertical Pillar */}
          <line x1="250" y1="65" x2="250" y2="200" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="250" y1="75" x2="250" y2="190" stroke="#0284c7" strokeWidth="2" />
          
          {/* Central Pivot Jewel */}
          <circle cx="250" cy="65" r="12" fill="#0369a1" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="250" cy="65" r="4" fill="#e0f2fe" />

          {/* Tilting Group (Arm + Trays) */}
          <motion.g
            initial={{ rotate: 0 }}
            animate={{
              rotate: isAnalyzing ? [0, -8, 8, -4, 4, 0] : dynamicAngle,
            }}
            transition={
              isAnalyzing
                ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 90, damping: 12 }
            }
            style={{ transformOrigin: '250px 65px' }}
          >
            {/* Horizontal Balance Beam */}
            <line x1="80" y1="65" x2="420" y2="65" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
            <line x1="80" y1="65" x2="420" y2="65" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Left Pivot & Hanging Chains */}
            <circle cx="95" cy="65" r="5" fill="#38bdf8" />
            <line x1="95" y1="65" x2="60" y2="140" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="95" y1="65" x2="130" y2="140" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Left Tray */}
            <path d="M 50,140 Q 95,165 140,140 Z" fill="#082f49" stroke="#0ea5e9" strokeWidth="2.5" />
            <ellipse cx="95" cy="140" rx="45" ry="7" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Right Pivot & Hanging Chains */}
            <circle cx="405" cy="65" r="5" fill="#ec4899" />
            <line x1="405" y1="65" x2="370" y2="140" stroke="#be185d" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="405" y1="65" x2="440" y2="140" stroke="#be185d" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Right Tray */}
            <path d="M 360,140 Q 405,165 450,140 Z" fill="#4c0519" stroke="#ec4899" strokeWidth="2.5" />
            <ellipse cx="405" cy="140" rx="45" ry="7" fill="#831843" stroke="#f472b6" strokeWidth="1.5" />

            {/* Left Weight Indicator on Tray */}
            <g transform="translate(75, 115)">
              <rect x="0" y="0" width="40" height="20" rx="4" fill="#0284c7" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="1" />
              <text x="20" y="14" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                {totalWeightA} pts
              </text>
            </g>

            {/* Right Weight Indicator on Tray */}
            <g transform="translate(385, 115)">
              <rect x="0" y="0" width="40" height="20" rx="4" fill="#be185d" fillOpacity="0.8" stroke="#f472b6" strokeWidth="1" />
              <text x="20" y="14" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                {totalWeightB} pts
              </text>
            </g>
          </motion.g>
        </svg>
      </div>

      {/* Dual Trays Interactive Weights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Left Side: Option A */}
        <div className={`p-4 rounded-xl border transition-all ${ratioA >= 0.5 ? 'bg-cyan-950/40 border-cyan-500/40 shadow-lg shadow-cyan-950/30' : 'bg-slate-950/40 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold font-mono">
                A
              </span>
              <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{optionA}</h4>
            </div>
            <button
              id="add-weight-a-btn"
              onClick={() => setShowAddWeightModal('A')}
              className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> 加砝码
            </button>
          </div>

          {/* List of weights for A */}
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {weightsA.map((item, idx) => (
              <div
                key={item.id || idx}
                className="group p-2 rounded-lg bg-slate-900/80 border border-cyan-500/20 flex items-start justify-between gap-2 hover:border-cyan-500/40 transition-all text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span>{item.label}</span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                      +{item.weight}
                    </span>
                  </div>
                  {item.reason && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.reason}</p>}
                </div>
                <button
                  onClick={() => handleRemoveWeight('A', idx)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
                  title="移除此砝码"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {weightsA.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-3">暂无砝码，点击右上角添加</p>
            )}
          </div>
        </div>

        {/* Right Side: Option B */}
        <div className={`p-4 rounded-xl border transition-all ${ratioA < 0.5 ? 'bg-pink-950/40 border-pink-500/40 shadow-lg shadow-pink-950/30' : 'bg-slate-950/40 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center text-xs font-bold font-mono">
                B
              </span>
              <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{optionB}</h4>
            </div>
            <button
              id="add-weight-b-btn"
              onClick={() => setShowAddWeightModal('B')}
              className="text-xs px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> 加砝码
            </button>
          </div>

          {/* List of weights for B */}
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {weightsB.map((item, idx) => (
              <div
                key={item.id || idx}
                className="group p-2 rounded-lg bg-slate-900/80 border border-pink-500/20 flex items-start justify-between gap-2 hover:border-pink-500/40 transition-all text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span>{item.label}</span>
                    <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 text-[10px] font-mono">
                      +{item.weight}
                    </span>
                  </div>
                  {item.reason && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.reason}</p>}
                </div>
                <button
                  onClick={() => handleRemoveWeight('B', idx)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
                  title="移除此砝码"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {weightsB.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-3">暂无砝码，点击右上角添加</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Weight Modal Dialog */}
      {showAddWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                为【{showAddWeightModal === 'A' ? optionA : optionB}】添加决策砝码
              </h4>
              <button
                onClick={() => setShowAddWeightModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">砝码理由/考量点 (如：身体健康、现金流储备)</label>
                <input
                  type="text"
                  placeholder="例如：学习曲线短、心情更舒畅"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                  <span>权重影响等级 (1-5)</span>
                  <span className="text-cyan-400 font-mono font-bold">{newWeightVal} 级</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newWeightVal}
                  onChange={(e) => setNewWeightVal(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>微弱考量</span>
                  <span>核心决定性因素</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">补充说明 (可选)</label>
                <input
                  type="text"
                  placeholder="一句话补充你的真实想法"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddWeightModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleAddWeight}
                disabled={!newLabel.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50 hover:opacity-90 shadow-md shadow-cyan-900/30"
              >
                确认铸造砝码
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
