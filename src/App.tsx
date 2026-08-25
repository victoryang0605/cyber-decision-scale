import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { AppMode, DecisionResult, PresetDilemma, UserProfile, WeightItem } from './types';
import { PRESET_DILEMMAS } from './utils/presetDilemmas';
import { playGavelSound, playSuccessChime, setSoundEnabled, getSoundEnabled } from './utils/audio';

import { Header } from './components/Header';
import { CyberScale } from './components/CyberScale';
import { PersonalityDebate } from './components/PersonalityDebate';
import { CoinFlipper } from './components/CoinFlipper';
import { RouletteWheel } from './components/RouletteWheel';
import { HistoryArchive } from './components/HistoryArchive';
import { SharePosterModal } from './components/SharePosterModal';
import { MonetizationModal } from './components/MonetizationModal';
import { UserProfileModal } from './components/UserProfileModal';

import {
  Sparkles,
  Zap,
  RotateCw,
  Share2,
  Flame,
  CheckCircle2,
  Scale,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Coins,
  History,
  Layers,
  User,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'cyber_decision_scale_history_v1';
const PROFILE_STORAGE_KEY = 'cyber_decision_scale_profile_v1';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('scale');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  
  // Input State
  const [dilemma, setDilemma] = useState<string>('');
  const [optionA, setOptionA] = useState<string>('执行 / 选择此项 (Option A)');
  const [optionB, setOptionB] = useState<string>('维持现状 / 稳妥起见 (Option B)');
  const [isBinaryMode, setIsBinaryMode] = useState<boolean>(true);
  const [selectedTone, setSelectedTone] = useState<'balanced' | 'spicy' | 'oracle'>('balanced');
  
  // Analysis & Result State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<DecisionResult | null>(null);
  const [history, setHistory] = useState<DecisionResult[]>([]);
  
  // Modals
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showMonetizationModal, setShowMonetizationModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load history & profile from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }

    try {
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as UserProfile;
        if (parsed && typeof parsed === 'object') {
          setUserProfile(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load user profile from localStorage', e);
    }
  }, []);

  const saveHistoryItem = (item: DecisionResult) => {
    const updated = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 30);
    setHistory(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  };

  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save user profile to localStorage', e);
    }
  };

  const handleClearProfile = () => {
    setUserProfile(null);
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear user profile from localStorage', e);
    }
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const handleSelectPreset = (preset: PresetDilemma) => {
    setDilemma(preset.title);
    setOptionA(preset.optionA);
    setOptionB(preset.optionB);
    setIsBinaryMode(true);
  };

  const handleAnalyze = async () => {
    if (!dilemma.trim()) return;

    setIsAnalyzing(true);
    setCurrentResult(null);

    try {
      const response = await fetch('/api/decision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma: dilemma.trim(),
          optionA: isBinaryMode ? optionA.trim() : '放手去做 / 采取行动',
          optionB: isBinaryMode ? optionB.trim() : '保持现状 / 暂不行动',
          mode: isBinaryMode ? 'binary' : 'single',
          tone: selectedTone,
          userProfile: userProfile ?? undefined,
        }),
      });

      const data = await response.json();
      const completeResult: DecisionResult = {
        ...data,
        id: String(Date.now()),
        timestamp: Date.now(),
      };

      setCurrentResult(completeResult);
      saveHistoryItem(completeResult);
      playSuccessChime();

      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (error) {
      console.error('Error analyzing decision:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWeightsChange = (newWeightsA: WeightItem[], newWeightsB: WeightItem[]) => {
    if (!currentResult) return;
    const totalA = newWeightsA.reduce((sum, w) => sum + (w.weight || 1), 0);
    const totalB = newWeightsB.reduce((sum, w) => sum + (w.weight || 1), 0);
    const sum = totalA + totalB || 1;
    const newScoreA = Math.round((totalA / sum) * 100);
    const newScoreB = 100 - newScoreA;
    const newTiltAngle = Math.round((newScoreA - newScoreB) * 0.4);

    const updated: DecisionResult = {
      ...currentResult,
      weightsA: newWeightsA,
      weightsB: newWeightsB,
      scoreA: newScoreA,
      scoreB: newScoreB,
      tiltAngle: newTiltAngle,
    };
    setCurrentResult(updated);
    saveHistoryItem(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        soundOn={soundOn}
        onToggleSound={handleToggleSound}
        onOpenMonetization={() => setShowMonetizationModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        hasProfile={!!userProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* MODE 1: SCALE DECISION ENGINE */}
        {currentMode === 'scale' && (
          <div className="space-y-8">
            {/* Hero Title & Value Proposition */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" /> 治愈选择困难症 · AI 物理天平与多重人格推演
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-blue-200">
                拿个主意 · AI 决策助手
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                让【理性天使】与【毒舌恶魔】为你进行终极博弈，量化利弊砝码，一击击碎精神内耗
              </p>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>🔥 爆款纠结议题直达：</span>
                <span className="text-[11px] text-slate-500">点击自动填充</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_DILEMMAS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                    <span>{preset.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">#{preset.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dilemma Input Console Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-5 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">决策模式：</span>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setIsBinaryMode(true)}
                      className={`px-3 py-1 rounded-lg transition-all ${isBinaryMode ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      二选一对比 (A vs B)
                    </button>
                    <button
                      onClick={() => setIsBinaryMode(false)}
                      className={`px-3 py-1 rounded-lg transition-all ${!isBinaryMode ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      单选决断 (做 vs 不做)
                    </button>
                  </div>
                </div>

                {/* Tone selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>推演风格：</span>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="balanced">⚖️ 平衡客观 (天使+恶魔)</option>
                    <option value="spicy">🔥 极度毒舌 (直击痛点借口)</option>
                    <option value="oracle">🔮 赛博玄学 (平行宇宙走向)</option>
                  </select>
                </div>
              </div>

              {/* User Profile Status Strip */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] transition-all ${
                  userProfile
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <User className={`w-3.5 h-3.5 shrink-0 ${userProfile ? 'text-cyan-400' : ''}`} />
                {userProfile ? (
                  <>
                    <span className="font-semibold">🧠 已结合你的用户画像推演</span>
                    <span className="truncate text-slate-400">
                      {[userProfile.personality, userProfile.work, userProfile.study, userProfile.life, userProfile.currentState]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="ml-auto shrink-0 px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-medium transition-all"
                    >
                      编辑画像
                    </button>
                  </>
                ) : (
                  <>
                    <span>尚未设置用户画像</span>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="ml-auto shrink-0 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-all"
                    >
                      填写画像 · 获得个性化裁决
                    </button>
                  </>
                )}
              </div>

              {/* Main Dilemma Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>你此刻最纠结的困境是什么？</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：要不要在这个月向暗恋的TA表白？/ 要不要买这台昂贵的相机？"
                  value={dilemma}
                  onChange={(e) => setDilemma(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Binary Options Inputs */}
              {isBinaryMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold">
                        A
                      </span>
                      选项 A 方案
                    </label>
                    <input
                      type="text"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 focus:outline-none"
                      placeholder="例如：果断出击表白"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-pink-400 font-mono flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center text-[10px] font-bold">
                        B
                      </span>
                      选项 B 方案
                    </label>
                    <input
                      type="text"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-pink-500 text-xs text-slate-200 focus:outline-none"
                      placeholder="例如：继续以朋友身份相处"
                    />
                  </div>
                </div>
              )}

              {/* Analyze Trigger Button */}
              <div className="pt-2">
                <button
                  id="start-analyze-btn"
                  onClick={handleAnalyze}
                  disabled={!dilemma.trim() || isAnalyzing}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white disabled:opacity-50 transition-all shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Zap className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? '天平多重人格推演中...' : '启动赛博天平推演 (Start Analysis)'}
                </button>
              </div>
            </div>

            {/* Analysis Results View */}
            {currentResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* 0. Personalized Basis Strip (shown when user profile is active) */}
                {userProfile && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/25 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                      <User className="w-4 h-4" />
                      本次裁决已结合你的用户画像（决策依据参考）
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                      {[
                        ['🧬 性格', userProfile.personality],
                        ['💼 工作', userProfile.work],
                        ['📚 学习', userProfile.study],
                        ['🏡 生活', userProfile.life],
                        ['⚡ 状态', userProfile.currentState],
                      ]
                        .filter(([, v]) => v && v.trim())
                        .map(([label, value]) => (
                          <div key={label as string} className="flex gap-1.5 min-w-0">
                            <span className="shrink-0 text-slate-500">{label}</span>
                            <span className="truncate">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 1. Final Divine Verdict Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xl font-bold">
                        ⚖️
                      </div>
                      <div>
                        <span className="text-[10px] text-cyan-400 uppercase font-mono tracking-widest">
                          DIVINE VERDICT
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-100">
                          {currentResult.finalVerdict.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="open-share-modal-btn"
                        onClick={() => setShowShareModal(true)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all"
                      >
                        <Share2 className="w-4 h-4" /> 生成社交裁决卡片
                      </button>
                    </div>
                  </div>

                  {/* Punchline */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 italic space-y-1">
                    <div className="text-xs text-cyan-400 font-mono not-italic font-bold">
                      💡 裁决一击：
                    </div>
                    <p className="leading-relaxed font-medium">
                      “{currentResult.finalVerdict.punchline}”
                    </p>
                  </div>

                  {/* Quantitative indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[11px]">综合推荐倾向</span>
                      <div className="text-sm font-bold text-cyan-400 font-mono">
                        {currentResult.finalVerdict.recommendedOption === 'A'
                          ? `优先 [A] ${currentResult.scoreA}%`
                          : `优先 [B] ${currentResult.scoreB}%`}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[11px]">选择A预计后悔率</span>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {currentResult.regretProbability?.ifChooseA || 25}%
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[11px]">选择B预计后悔率</span>
                      <div className="text-sm font-bold text-rose-400 font-mono">
                        {currentResult.regretProbability?.ifChooseB || 68}%
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[11px]">精神内耗阻力</span>
                      <div className="text-sm font-bold text-amber-400 font-mono">
                        ⚡ {currentResult.energyCost || 3} / 5 级
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Physics Cyber Scale */}
                <CyberScale
                  optionA={currentResult.optionA}
                  optionB={currentResult.optionB}
                  scoreA={currentResult.scoreA}
                  scoreB={currentResult.scoreB}
                  weightsA={currentResult.weightsA}
                  weightsB={currentResult.weightsB}
                  onWeightsChange={handleWeightsChange}
                  isAnalyzing={isAnalyzing}
                />

                {/* 3. Three Persona Perspectives Debate */}
                <PersonalityDebate
                  angel={currentResult.angelPerspective}
                  devil={currentResult.devilPerspective}
                  oracle={currentResult.oraclePerspective}
                />

                {/* 4. 24-Hour Micro Action Step */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm sm:text-base font-bold">
                      24 小时内无需深思的「最小启动微行动」
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-emerald-400 font-mono font-bold">第一步 · 阻断内耗</span>
                      <p>{currentResult.microAction.step1}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-emerald-400 font-mono font-bold">第二步 · 极简启动</span>
                      <p>{currentResult.microAction.step2}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 font-mono">
                    <span>截止时间: {currentResult.microAction.deadline}</span>
                    <span>行动力 &gt; 完美的思考</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* MODE 2: 3D COIN FLIPPER */}
        {currentMode === 'coin' && (
          <CoinFlipper
            defaultOptionA={optionA || '选项 A（正面）'}
            defaultOptionB={optionB || '选项 B（反面）'}
            onDecide={(winner) => {
              console.log('Coin decided on:', winner);
            }}
          />
        )}

        {/* MODE 3: ROULETTE WHEEL */}
        {currentMode === 'roulette' && <RouletteWheel />}

        {/* MODE 4: HISTORY ARCHIVE */}
        {currentMode === 'archive' && (
          <HistoryArchive
            history={history}
            onSelect={(item) => {
              setCurrentResult(item);
              setDilemma(item.dilemma);
              setOptionA(item.optionA);
              setOptionB(item.optionB);
              setCurrentMode('scale');
            }}
            onClear={() => {
              setHistory([]);
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }}
          />
        )}
      </main>

      {/* Share Poster Modal */}
      {showShareModal && currentResult && (
        <SharePosterModal
          decision={currentResult}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Monetization Model Showcase Modal */}
      {showMonetizationModal && (
        <MonetizationModal onClose={() => setShowMonetizationModal(false)} />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          profile={userProfile}
          onSave={handleSaveProfile}
          onClear={handleClearProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
