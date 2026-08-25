/**
 * 决策分析引擎（纯 TS，零 Node/浏览器依赖）
 *
 * 同一份「提示词构建 / DeepSeek 调用 / 启发式降级」逻辑同时被两处复用：
 *  - 本地开发：server.ts（Express + tsx/esbuild，Node 运行时）
 *  - 线上部署：functions/api/decision/analyze.ts（Cloudflare Pages Function，Workers 运行时）
 * 因此本文件禁止使用 process.env、Node 内置模块等运行时专属能力，所有配置以参数传入。
 */

export interface UserProfileInput {
  personality?: string;
  work?: string;
  study?: string;
  life?: string;
  currentState?: string;
}

export interface DecisionInput {
  dilemma: string;
  optionA?: string;
  optionB?: string;
  mode?: string;
  tone?: string;
  userProfile?: UserProfileInput | null;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

/** 将用户画像整理为 prompt 段落（全空时返回空串，不注入画像段） */
export function buildProfileBlock(userProfile?: UserProfileInput | null): string {
  const p = userProfile || {};
  const lines: Array<[string, string]> = [
    ['性格特征', p.personality || ''],
    ['工作情况', p.work || ''],
    ['学习情况', p.study || ''],
    ['生活情况', p.life || ''],
    ['当下状态', p.currentState || ''],
  ];
  const filled = lines.filter(([, v]) => v && String(v).trim());
  if (filled.length === 0) return '';
  return `用户基本场景画像（请将以下画像作为决策依据的核心输入，所有分析必须结合画像细节，直接引用用户的性格、工作、学习、生活与当下状态给出量身定制的建议）：
${filled.map(([label, value]) => `- ${label}：${value}`).join('\n')}

`;
}

/** 构建发送给 DeepSeek 的用户 prompt */
export function buildPrompt(input: DecisionInput): string {
  const { dilemma, optionA, optionB, mode, tone } = input;
  return `你是一个兼具顶尖逻辑博弈、现实毒舌洞察与赛博玄学幽默的「赛博决策神殿裁决官」。
用户面临一个纠结/决策困境：
纠结议题："${dilemma}"
选项A: "${optionA || '执行/选择此项'}"
选项B: "${optionB || '放弃/维持现状'}"
模式: "${mode || 'comparison'}"
风格偏好: "${tone || 'balanced'}"
${buildProfileBlock(input.userProfile)}请针对该议题展开严密的「决策天平博弈分析」：
0. 若提供了上方用户基本场景画像，则所有角度（天使/恶魔/预言家）、决策砝码与最终裁决都必须结合该用户画像给出，直接引用其性格、工作、学习、生活与当下状态等细节，说明「为什么这个选择适合/不适合这位用户」，输出量身定制的个性化决策依据；若未提供画像，则给出通用的优质分析。
1. 给出双边倾向打分 scoreA (0-100) 与 scoreB (0-100，两者之和必须为100)。
2. 计算天平倾斜角度 tiltAngle (-25 到 25 之间的整数，正数偏向A，负数偏向B)。
3. 【理性天使】(Angel)：从长期价值、复利效应、成长维度提供沉着冷静的建设性支持。
4. 【毒舌恶魔】(Devil)：用一针见血、幽默辛辣、撕碎借口的大实话直击痛点与自欺欺人之处。
5. 【赛博预言家】(Oracle)：用平行宇宙、量子纠缠或赛博玄学给出充满哲思与神秘感的预言和今日吉凶征兆。
6. 为选项A和选项B分别提炼 2-4 个具体的决策砝码（含 label 简短标签、weight 1-5 权重分、reason 核心理由）。
7. 给出最终神圣裁决令（finalVerdict），包含金句一击（punchline）和推荐选项（A 或 B）。
8. 给出 24 小时内无需深思即可执行的「最小启动微行动指南」（microAction）。
9. 评估能量消耗指数 (energyCost, 1-5) 与后悔概率 (regretProbability)。

请严格以 JSON 格式输出，不要包含任何 markdown 代码块外部的多余文字。请确保输出的 JSON 字段完全符合以下结构：
{
  "dilemma": "string",
  "optionA": "string",
  "optionB": "string",
  "scoreA": "number(0-100)",
  "scoreB": "number(0-100，与 scoreA 之和为 100)",
  "tiltAngle": "number(-25~25 的整数，正数偏向A，负数偏向B)",
  "category": "string",
  "angelPerspective": { "title": "string", "quote": "string", "arguments": ["string"], "impact5Years": "string" },
  "devilPerspective": { "title": "string", "quote": "string", "arguments": ["string"], "spicyRoast": "string" },
  "oraclePerspective": { "title": "string", "prophecy": "string", "cosmicSign": "string" },
  "weightsA": [{ "label": "string", "weight": "number(1-5)", "reason": "string" }],
  "weightsB": [{ "label": "string", "weight": "number(1-5)", "reason": "string" }],
  "finalVerdict": { "title": "string", "summary": "string", "punchline": "string", "recommendedOption": "A 或 B" },
  "microAction": { "step1": "string", "step2": "string", "deadline": "string" },
  "energyCost": "number(1-5)",
  "regretProbability": { "ifChooseA": "number(0-100)", "ifChooseB": "number(0-100)" }
}`;
}

/** DeepSeek Key 未配置 / 调用失败时的启发式降级裁决 */
export function generateFallbackDecision(input: DecisionInput): Record<string, unknown> {
  const { dilemma, optionA, optionB, mode } = input;
  const isBinary = mode === 'binary' || (optionA && optionB);
  const optA = optionA || '放手去做 / 勇敢选择 A';
  const optB = optionB || '保持现状 / 稳妥选择 B';

  const hash = dilemma.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const scoreA = 40 + (hash % 25);
  const scoreB = 100 - scoreA;
  const tiltAngle = Math.round((scoreA - scoreB) * 0.4);

  return {
    dilemma,
    optionA: optA,
    optionB: optB,
    scoreA,
    scoreB,
    tiltAngle,
    category: '生活/职场综合',
    angelPerspective: {
      title: '理性天使 · 长期价值视角',
      quote: `“从 3 年后的维度来看，任何带来增量认知的选择，试错成本都远低于错过成本。”`,
      arguments: [
        `选择【${scoreA >= scoreB ? optA : optB}】能最大化你掌控生活的主动权。`,
        '短期内可能会经历不适应，但边际收益会随着时间递增。',
        '将不确定性拆解为可量化的小目标，风险完全在可控范围内。',
      ],
      impact5Years: '五年后你会感谢今天没有在犹豫中消耗精神内耗。',
    },
    devilPerspective: {
      title: '毒舌恶魔 · 现实痛点与毒舌吐槽',
      quote: `“别装作很纠结了，你其实只是既想要收益又不想承担代价。”`,
      arguments: [
        `如果选【${optA}】，你真的能忍受前两个月的阵痛期而不是第三天就想放弃？`,
        `如果选【${optB}】，别在深夜又emo后悔自己当初为什么不敢冲。`,
        '选择困难症的本质不是选项太好，而是钱包和实力都不够支撑任性。',
      ],
      spicyRoast: '硬币抛上去的那一刻，你的潜意识早就在为某一方疯狂祈祷了。',
    },
    oraclePerspective: {
      title: '赛博预言家 · 平行宇宙与玄学征兆',
      prophecy: `宇宙全息模拟显示：在 87% 的平行宇宙中，选择主动出击的世界线最终满意度更高。`,
      cosmicSign: '今日宜断舍离，忌拖延反刍。顺风方向在东南，行动胜过千言万语。',
    },
    weightsA: [
      { label: '认知与个人成长', weight: 4, reason: '跳出舒适圈带来的不可替代经验' },
      { label: '潜在回报上限', weight: 5, reason: '收益天花板明显更高' },
      { label: '心理内耗解除', weight: 3, reason: '做了就不用天天念叨' },
    ],
    weightsB: [
      { label: '安全与风险缓冲', weight: 4, reason: '现阶段现金流与情绪缓冲更足' },
      { label: '即时舒适度', weight: 3, reason: '不需要重新适应新环境' },
    ],
    finalVerdict: {
      title: scoreA >= scoreB ? `倾斜裁决：偏向选择【${optA}】` : `倾斜裁决：偏向选择【${optB}】`,
      summary: `天平经综合博弈测算，【${scoreA >= scoreB ? optA : optB}】以 ${Math.max(scoreA, scoreB)}% 对 ${Math.min(scoreA, scoreB)}% 胜出。`,
      punchline: '人生最大的遗憾往往不是做错了什么，而是什么都没做却一直在耗尽心力。',
      recommendedOption: scoreA >= scoreB ? 'A' : 'B',
    },
    microAction: {
      step1: '设立 15 分钟倒计时：不再搜寻额外信息，关闭比较网页。',
      step2: `立刻执行【${scoreA >= scoreB ? optA : optB}】的最小启动动作（如发一条消息或写下第一步计划）。`,
      deadline: '今天 24:00 前完成最小启动动作。',
    },
    energyCost: 3,
    regretProbability: {
      ifChooseA: 28,
      ifChooseB: 65,
    },
  };
}

/**
 * 调用 DeepSeek Chat Completions（OpenAI 兼容），返回解析后的 JSON 对象。
 * 失败时抛出异常，由调用方决定如何降级。
 */
export async function callDeepSeekJson(
  input: DecisionInput,
  config: DeepSeekConfig,
): Promise<Record<string, unknown>> {
  const baseURL = (config.baseURL || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = config.model || 'deepseek-chat';
  const prompt = buildPrompt(input);

  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            '你是一个严格输出 JSON 的「赛博决策神殿裁决官」。你只输出合法 JSON 对象，不输出任何多余文字、解释或 markdown 代码块。',
        },
        { role: 'user', content: prompt },
      ],
      // deepseek-reasoner 不支持 json_object 模式，只有 deepseek-chat 才启用
      ...(model === 'deepseek-reasoner' ? {} : { response_format: { type: 'json_object' } }),
      temperature: 0.9,
      max_tokens: 4096,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`DeepSeek API error ${resp.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = data?.choices?.[0]?.message?.content || '';
  // 防御性清理：剥离可能出现的 markdown 代码块围栏后解析
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 免费额度（quota）——纯 TS，内存实现，Express 与 Cloudflare Pages Function 共用
// 说明：内存计数在服务重启/冷启动后会重置；适合轻量免费额度。生产级可换
// Cloudflare KV / SQLite / 数据库持久化（本模块接口不变）。
// ---------------------------------------------------------------------------

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

/** 简单的按用户内存计数额度存储 */
export class MemoryQuotaStore {
  private counts = new Map<string, number>();

  constructor(private limit: number) {}

  /** 当前额度状态（不消耗） */
  status(userId: string): QuotaInfo {
    const used = this.counts.get(userId) || 0;
    return { used, limit: this.limit, remaining: Math.max(0, this.limit - used) };
  }

  /** 是否仍可用（不消耗） */
  canUse(userId: string): boolean {
    return (this.counts.get(userId) || 0) < this.limit;
  }

  /** 记录一次成功消耗，返回最新状态 */
  consume(userId: string): QuotaInfo {
    const used = (this.counts.get(userId) || 0) + 1;
    this.counts.set(userId, used);
    return { used, limit: this.limit, remaining: Math.max(0, this.limit - used) };
  }

  /** 清空（可按用户） */
  reset(userId?: string): void {
    if (userId) this.counts.delete(userId);
    else this.counts.clear();
  }
}

/** 从环境变量解析免费次数上限（默认 3） */
export function resolveFreeLimit(value?: string | number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}
