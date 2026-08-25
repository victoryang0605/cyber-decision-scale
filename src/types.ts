export type AppMode = 'scale' | 'coin' | 'roulette' | 'archive' | 'monetization';

export type DecisionMode = 'binary' | 'single' | 'custom';

/**
 * 用户基本场景画像：在辅助决策时作为参数录入，让 LLM 结合
 * 用户的性格、工作、学习、生活与当下状态给出个性化决策依据。
 */
export interface UserProfile {
  /** 性格特征（如：内向/外向、MBTI、优劣势） */
  personality: string;
  /** 工作情况（如：职业、行业、在职状态、压力） */
  work: string;
  /** 学习情况（如：在读/备考/技能学习） */
  study: string;
  /** 生活情况（如：家庭、居住、经济、健康） */
  life: string;
  /** 当下状态（如：近期情绪、精力、时间、紧要事项） */
  currentState: string;
  /** 最近更新时间戳 */
  updatedAt?: number;
}

/** 免费额度信息（服务端返回） */
export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

export interface WeightItem {
  id?: string;
  label: string;
  weight: number; // 1 to 5
  reason: string;
}

export interface AngelPerspective {
  title: string;
  quote: string;
  arguments: string[];
  impact5Years: string;
}

export interface DevilPerspective {
  title: string;
  quote: string;
  arguments: string[];
  spicyRoast: string;
}

export interface OraclePerspective {
  title: string;
  prophecy: string;
  cosmicSign: string;
}

export interface FinalVerdict {
  title: string;
  summary: string;
  punchline: string;
  recommendedOption: 'A' | 'B' | 'TIE' | string;
}

export interface MicroAction {
  step1: string;
  step2: string;
  deadline: string;
}

export interface DecisionResult {
  id: string;
  timestamp: number;
  dilemma: string;
  optionA: string;
  optionB: string;
  scoreA: number;
  scoreB: number;
  tiltAngle: number;
  category?: string;
  angelPerspective: AngelPerspective;
  devilPerspective: DevilPerspective;
  oraclePerspective: OraclePerspective;
  weightsA: WeightItem[];
  weightsB: WeightItem[];
  finalVerdict: FinalVerdict;
  microAction: MicroAction;
  energyCost?: number; // 1-5
  regretProbability?: {
    ifChooseA: number;
    ifChooseB: number;
  };
}

export interface RouletteOption {
  id: string;
  text: string;
  color: string;
  weight: number;
}

export interface PresetDilemma {
  id: string;
  title: string;
  category: 'career' | 'life' | 'emotion' | 'shopping' | 'tech';
  categoryLabel: string;
  optionA: string;
  optionB: string;
  tag: string;
}
