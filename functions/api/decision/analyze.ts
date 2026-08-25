/**
 * Cloudflare Pages Function —— 对应路由 POST /api/decision/analyze
 *
 * 前端（dist/ 静态资源）与函数同源部署在 xxx.pages.dev 上，
 * 前端 fetch('/api/decision/analyze') 会自动命中此函数。
 * 环境变量（DEEPSEEK_API_KEY 等）在 Pages 项目 Settings → Environment variables 中配置，
 * 运行时通过 context.env 注入，切勿写进代码。
 *
 * 免费额度：内存计数。Workers 的 isolate 可能分散在多个实例/区域，计数为近似值；
 * 如需严格持久化，可换成 Cloudflare KV（本文件与 decisionEngine 的接口保持不变）。
 */
import {
  callDeepSeekJson,
  generateFallbackDecision,
  DecisionInput,
  MemoryQuotaStore,
  MemoryCreditStore,
  resolveFreeLimit,
} from '../../../src/decisionEngine';

interface Env {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  DEEPSEEK_BASE_URL?: string;
  FREE_QUOTA_LIMIT?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// 模块级单例（同一 isolate 内跨请求复用）
let quotaStore: MemoryQuotaStore | null = null;
let creditStore: MemoryCreditStore | null = null;

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { dilemma, optionA, optionB, mode, tone, userProfile, userId, userKey } = body;

    if (!dilemma || typeof dilemma !== 'string' || !dilemma.trim()) {
      return json({ error: '请提供您面临的纠结或选择！' }, 400);
    }

    const input: DecisionInput = {
      dilemma: dilemma.trim(),
      optionA: typeof optionA === 'string' ? optionA : undefined,
      optionB: typeof optionB === 'string' ? optionB : undefined,
      mode: typeof mode === 'string' ? mode : undefined,
      tone: typeof tone === 'string' ? tone : undefined,
      userProfile: (userProfile as DecisionInput['userProfile']) ?? undefined,
    };

    if (!quotaStore) {
      quotaStore = new MemoryQuotaStore(resolveFreeLimit(env.FREE_QUOTA_LIMIT));
    }
    if (!creditStore) {
      creditStore = new MemoryCreditStore();
    }

    // BYOK：用户自带 Key 时费用走用户自己的 DeepSeek 账户，不消耗任何额度
    const userKeyTrimmed = typeof userKey === 'string' ? userKey.trim() : '';
    const usingOwnerKey = !userKeyTrimmed;
    const apiKey = (userKeyTrimmed || env.DEEPSEEK_API_KEY) || undefined;

    // 没有任何可用 Key（站长未配置且用户未提供）→ 启发式降级，不计额度
    if (!apiKey) {
      return json(generateFallbackDecision(input));
    }

    const uid = typeof userId === 'string' && userId.trim() ? userId.trim() : 'anonymous';

    // 使用站长 Key 时：付费余额优先，余额为 0 才走免费额度
    if (usingOwnerKey && creditStore.balance(uid) <= 0 && !quotaStore.canUse(uid)) {
      return json(
        {
          error: '免费次数已用完',
          code: 'FREE_LIMIT_EXCEEDED',
          quota: { ...quotaStore.status(uid), credits: 0 },
        },
        403,
      );
    }

    try {
      const data = await callDeepSeekJson(input, {
        apiKey,
        baseURL: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: env.DEEPSEEK_MODEL || 'deepseek-chat',
      });
      // 只有真正调用了 LLM（产生费用）才扣减额度：付费余额优先，其次免费额度
      if (usingOwnerKey) {
        if (!creditStore.consume(uid)) {
          quotaStore.consume(uid);
        }
      }
      return json({
        ...data,
        quota: { ...quotaStore.status(uid), credits: creditStore.balance(uid) },
      });
    } catch (err) {
      console.error('DeepSeek API execution error:', err);
      return json(generateFallbackDecision(input));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return json({ error: '服务器内部错误，请稍后再试' }, 500);
  }
};
