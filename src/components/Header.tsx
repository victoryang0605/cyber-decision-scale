import React from 'react';
import { AppMode } from '../types';
import { Scale, Coins, Disc, Archive, Volume2, VolumeX, Sparkles, User } from 'lucide-react';
import { setSoundEnabled } from '../utils/audio';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenMonetization: () => void;
  onOpenProfile: () => void;
  hasProfile: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  soundOn,
  onToggleSound,
  onOpenMonetization,
  onOpenProfile,
  hasProfile,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          onClick={() => onSelectMode('scale')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                拿个主意
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-mono border border-cyan-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              AI DECISION HELPER
            </p>
          </div>
        </div>

        {/* Center Navigation Modes */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => onSelectMode('scale')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              currentMode === 'scale'
                ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">赛博天平</span>
          </button>

          <button
            onClick={() => onSelectMode('coin')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              currentMode === 'coin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">命运硬币</span>
          </button>

          <button
            onClick={() => onSelectMode('roulette')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              currentMode === 'roulette'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">赛博轮盘</span>
          </button>

          <button
            onClick={() => onSelectMode('archive')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              currentMode === 'archive'
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">档案馆</span>
          </button>
        </nav>

        {/* Right Tools: Profile, Monetization Button & Sound Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenProfile}
            className={`p-2 rounded-xl border transition-colors relative ${
              hasProfile
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={hasProfile ? '查看/编辑我的用户画像（已生效）' : '设置我的用户画像'}
          >
            <User className="w-4 h-4" />
            {hasProfile && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
            )}
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={soundOn ? '静音音效' : '开启拟真物理音效'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
