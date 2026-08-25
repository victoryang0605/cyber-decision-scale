/**
 * Cloudflare Pages Function —— 对应路由 POST /api/decision/analyze
 *
 * 前端（dist/ 静态资源）与函数同源部署在 xxx.pages.dev 上，
 * 前端 fetch('/api/decision/analyze') 会自动命中此函数。
 * 环境变量（DEEPSEEK_API_KEY 等）在 Pages 项目 Settings → Environment variables 中配置，
 * 运行时通过 context.env 注入，切勿写进代码。
 */
import { callDeepSeekJson, generateFallbackDecision, DecisionInput } from '../../../src/decisionEngine';

interface Env {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  DEEPSEEK_BASE_URL?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { dilemma, optionA, optionB, mode, tone, userProfile } = body;

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

    // 未配置 Key 时直接返回启发式降级结果
    if (!env.DEEPSEEK_API_KEY) {
      return json(generateFallbackDecision(input));
    }

    try {
      const data = await callDeepSeekJson(input, {
        apiKey: env.DEEPSEEK_API_KEY,
        baseURL: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: env.DEEPSEEK_MODEL || 'deepseek-chat',
      });
      return json(data);
    } catch (err) {
      console.error('DeepSeek API execution error:', err);
      return json(generateFallbackDecision(input));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return json({ error: '服务器内部错误，请稍后再试' }, 500);
  }
};
