import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AngelPerspective, DevilPerspective, OraclePerspective } from '../types';
import { ShieldCheck, Flame, Compass, Sparkles, Quote, ChevronRight, CheckCircle2 } from 'lucide-react';

interface PersonalityDebateProps {
  angel: AngelPerspective;
  devil: DevilPerspective;
  oracle: OraclePerspective;
}

export const PersonalityDebate: React.FC<PersonalityDebateProps> = ({ angel, devil, oracle }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'angel' | 'devil' | 'oracle'>('all');

  return (
    <div className="w-full space-y-4">
      {/* Header & Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm sm:text-base font-semibold text-slate-100">
            三大神殿人格对决辩论
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${activeTab === 'all' ? 'bg-slate-700 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            三方全景
          </button>
          <button
            onClick={() => setActiveTab('angel')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'angel' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            👼 理性天使
          </button>
          <button
            onClick={() => setActiveTab('devil')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'devil' ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            😈 毒舌恶魔
          </button>
          <button
            onClick={() => setActiveTab('oracle')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'oracle' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🔮 赛博预言家
          </button>
        </div>
      </div>

      {/* Grid of 3 Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Angel Persona */}
        {(activeTab === 'all' || activeTab === 'angel') && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900/80 border border-blue-500/30 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl shadow-blue-950/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-200">{angel.title}</h4>
                  <span className="text-[10px] text-blue-400/80 uppercase tracking-wider font-mono">
                    Rational Angel
                  </span>
                </div>
              </div>

              {/* Persona Quote */}
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/20 text-xs text-blue-100 italic relative mb-4">
                <Quote className="w-3.5 h-3.5 text-blue-400 absolute top-2 right-2 opacity-40" />
                {angel.quote}
              </div>

              {/* Arguments list */}
              <div className="space-y-2 mb-4">
                {angel.arguments.map((arg, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{arg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5-Year Impact Footer */}
            <div className="pt-3 border-t border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-[10px] font-mono shrink-0">
                5年视角
              </span>
              <span className="line-clamp-2">{angel.impact5Years}</span>
            </div>
          </motion.div>
        )}

        {/* 2. Devil Persona */}
        {(activeTab === 'all' || activeTab === 'devil') && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-900/80 border border-rose-500/30 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/50 transition-all shadow-xl shadow-rose-950/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-200">{devil.title}</h4>
                  <span className="text-[10px] text-rose-400/80 uppercase tracking-wider font-mono">
                    Devil's Advocate
                  </span>
                </div>
              </div>

              {/* Persona Quote */}
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/20 text-xs text-rose-100 italic relative mb-4">
                <Quote className="w-3.5 h-3.5 text-rose-400 absolute top-2 right-2 opacity-40" />
                {devil.quote}
              </div>

              {/* Arguments list */}
              <div className="space-y-2 mb-4">
                {devil.arguments.map((arg, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{arg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spicy Roast Footer */}
            <div className="pt-3 border-t border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-[10px] font-mono shrink-0">
                毒舌一击
              </span>
              <span className="line-clamp-2">{devil.spicyRoast}</span>
            </div>
          </motion.div>
        )}

        {/* 3. Oracle Persona */}
        {(activeTab === 'all' || activeTab === 'oracle') && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900/80 border border-purple-500/30 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-xl shadow-purple-950/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-200">{oracle.title}</h4>
                  <span className="text-[10px] text-purple-400/80 uppercase tracking-wider font-mono">
                    Cyber Oracle
                  </span>
                </div>
              </div>

              {/* Prophecy */}
              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/20 text-xs text-purple-100 relative mb-4">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 absolute top-2 right-2 opacity-40" />
                <p className="leading-relaxed">{oracle.prophecy}</p>
              </div>

              {/* Parallel Universe / Sign */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/20 space-y-1.5 text-xs text-slate-300 mb-4">
                <div className="flex items-center gap-1.5 text-purple-300 text-[11px] font-medium font-mono">
                  <span>🌌 量子纠缠与平行线指引</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  你的犹豫正在创造不同的现实分支。最平静的那个宇宙里，你早已做出了行动。
                </p>
              </div>
            </div>

            {/* Cosmic Sign Footer */}
            <div className="pt-3 border-t border-purple-500/20 text-[11px] text-purple-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px] font-mono shrink-0">
                今日吉凶
              </span>
              <span className="line-clamp-2">{oracle.cosmicSign}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
