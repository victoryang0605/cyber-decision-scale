import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  callDeepSeekJson,
  generateFallbackDecision,
  DecisionInput,
  MemoryQuotaStore,
  MemoryCreditStore,
  resolveFreeLimit,
} from './src/decisionEngine';

dotenv.config({ path: ['.env.local', '.env'] });

async function startServer() {
  const app = express();
  // 兼容 Zeabur / Render / Fly 等 PaaS：由平台注入 PORT，本地默认 3000
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 免费额度：每个匿名用户默认可免费调用 LLM 的次数（可用 FREE_QUOTA_LIMIT 覆盖）
  const quotaStore = new MemoryQuotaStore(resolveFreeLimit(process.env.FREE_QUOTA_LIMIT));
  // 付费余额（次数）：管理员人工确认收款后发放，有余额时优先消耗
  const creditStore = new MemoryCreditStore();

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 管理员发放付费次数（收款码 + 人工确认流程的后台入口）
  // 调用示例：POST /api/admin/add-credits  {"userId":"u_xxx","amount":50,"secret":"<ADMIN_SECRET>"}
  app.post('/api/admin/add-credits', (req, res) => {
    const { userId, amount, secret } = req.body ?? {};
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return res.status(403).json({ error: '无权限：请配置并传入 ADMIN_SECRET' });
    }
    const uid = typeof userId === 'string' && userId.trim() ? userId.trim() : '';
    const amt = Number(amount);
    if (!uid || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: '参数无效：userId 与 amount(>0) 必填' });
    }
    const balance = creditStore.add(uid, amt);
    res.json({ ok: true, userId: uid, added: Math.floor(amt), balance });
  });

  // Decision Analysis Endpoint
  app.post('/api/decision/analyze', async (req, res) => {
    const { dilemma, optionA, optionB, mode, tone, userProfile, userId, userKey } = req.body;

    if (!dilemma) {
      return res.status(400).json({ error: '请提供您面临的纠结或选择！' });
    }

    const input: DecisionInput = { dilemma, optionA, optionB, mode, tone, userProfile };

    const ownerApiKey = process.env.DEEPSEEK_API_KEY;
    // BYOK：用户自带 Key 时，API 费用走用户自己的 DeepSeek 账户，不消耗任何额度
    const userKeyTrimmed = typeof userKey === 'string' ? userKey.trim() : '';
    const usingOwnerKey = !userKeyTrimmed;
    const apiKey = (userKeyTrimmed || ownerApiKey) || undefined;

    // 没有任何可用 Key（站长未配置且用户未提供）→ 启发式降级，不计额度
    if (!apiKey) {
      return res.json(generateFallbackDecision(input));
    }

    const uid = typeof userId === 'string' && userId.trim() ? userId.trim() : 'anonymous';

    // 使用站长 Key 时：付费余额优先，余额为 0 才走免费额度
    if (usingOwnerKey && creditStore.balance(uid) <= 0 && !quotaStore.canUse(uid)) {
      return res.status(403).json({
        error: '免费次数已用完',
        code: 'FREE_LIMIT_EXCEEDED',
        quota: { ...quotaStore.status(uid), credits: 0 },
      });
    }

    try {
      const data = await callDeepSeekJson(input, {
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      });
      // 只有真正调用了 LLM（产生费用）才扣减额度：付费余额优先，其次免费额度
      if (usingOwnerKey) {
        if (!creditStore.consume(uid)) {
          quotaStore.consume(uid);
        }
      }
      res.json({
        ...data,
        quota: { ...quotaStore.status(uid), credits: creditStore.balance(uid) },
      });
    } catch (err: any) {
      console.error('DeepSeek API execution error:', err);
      // If error occurs, smoothly return high-quality heuristic result
      res.json(generateFallbackDecision(input));
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[拿个主意 · AI 决策助手] Server running on http://localhost:${PORT}`);
  });
}

startServer();
