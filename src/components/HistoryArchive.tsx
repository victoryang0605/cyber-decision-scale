import React from 'react';
import { DecisionResult } from '../types';
import { Archive, Trash2, ArrowUpRight, Scale, Sparkles, Calendar } from 'lucide-react';

interface HistoryArchiveProps {
  history: DecisionResult[];
  onSelect: (item: DecisionResult) => void;
  onClear: () => void;
}

export const HistoryArchive: React.FC<HistoryArchiveProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4 backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
          <Archive className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-200">决策档案馆暂无记录</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            每一次在赛博天平中推演决策，都会被安全加密保存在本地档案馆中，便于日后复盘。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Archive Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-1">
            <Archive className="w-3.5 h-3.5" /> 历史决策复盘
          </div>
          <h3 className="text-xl font-bold text-slate-100">决策档案馆</h3>
          <p className="text-xs text-slate-400">已为你守护并记录 {history.length} 次关键人生/生活抉择</p>
        </div>

        <button
          onClick={onClear}
          className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700/60 transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> 清空记录
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {history.map((item) => {
          const date = new Date(item.timestamp || Date.now()).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="group p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                    {item.scoreA}% vs {item.scoreB}%
                  </span>
                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" /> {date}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                  {item.dilemma}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  裁决结论：{item.finalVerdict?.title || '已完成推演'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  查看复盘 <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
