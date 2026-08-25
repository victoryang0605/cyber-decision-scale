/**
 * Cloudflare Pages Function —— 管理员发放付费次数（收款码 + 人工确认流程的后台入口）
 * 路由：POST /api/admin/add-credits
 *
 * 调用示例：
 *   POST /api/admin/add-credits
 *   {"userId":"u_xxx","amount":50,"secret":"<ADMIN_SECRET>"}
 *
 * ADMIN_SECRET 在 Pages 项目 Settings → Environment variables 中配置，请使用强随机串。
 */
import { MemoryCreditStore } from '../../../src/decisionEngine';

interface Env {
  ADMIN_SECRET?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// 模块级单例（同一 isolate 内跨请求复用）
let creditStore: MemoryCreditStore | null = null;

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { userId, amount, secret } = body;

    const adminSecret = env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return json({ error: '无权限：请配置并传入 ADMIN_SECRET' }, 403);
    }

    const uid = typeof userId === 'string' && userId.trim() ? userId.trim() : '';
    const amt = Number(amount);
    if (!uid || !Number.isFinite(amt) || amt <= 0) {
      return json({ error: '参数无效：userId 与 amount(>0) 必填' }, 400);
    }

    if (!creditStore) {
      creditStore = new MemoryCreditStore();
    }
    const balance = creditStore.add(uid, amt);
    return json({ ok: true, userId: uid, added: Math.floor(amt), balance });
  } catch (err) {
    console.error('Unexpected error:', err);
    return json({ error: '服务器内部错误' }, 500);
  }
};
