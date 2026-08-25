import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  callDeepSeekJson,
  generateFallbackDecision,
  DecisionInput,
  MemoryQuotaStore,
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

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Decision Analysis Endpoint
  app.post('/api/decision/analyze', async (req, res) => {
    const { dilemma, optionA, optionB, mode, tone, userProfile, userId, userKey } = req.body;

    if (!dilemma) {
      return res.status(400).json({ error: '请提供您面临的纠结或选择！' });
    }

    const input: DecisionInput = { dilemma, optionA, optionB, mode, tone, userProfile };

    const ownerApiKey = process.env.DEEPSEEK_API_KEY;
    // BYOK：用户自带 Key 时，API 费用走用户自己的 DeepSeek 账户，不消耗免费额度
    const userKeyTrimmed = typeof userKey === 'string' ? userKey.trim() : '';
    const usingOwnerKey = !userKeyTrimmed;
    const apiKey = (userKeyTrimmed || ownerApiKey) || undefined;

    // 没有任何可用 Key（站长未配置且用户未提供）→ 启发式降级，不计额度
    if (!apiKey) {
      return res.json(generateFallbackDecision(input));
    }

    const uid = typeof userId === 'string' && userId.trim() ? userId.trim() : 'anonymous';

    // 使用站长 Key 时检查免费额度；超出则返回 403 + 额度信息
    if (usingOwnerKey && !quotaStore.canUse(uid)) {
      return res.status(403).json({
        error: '免费次数已用完',
        code: 'FREE_LIMIT_EXCEEDED',
        quota: quotaStore.status(uid),
      });
    }

    try {
      const data = await callDeepSeekJson(input, {
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      });
      // 只有真正调用了 LLM（产生费用）才消耗免费额度
      if (usingOwnerKey) {
        quotaStore.consume(uid);
      }
      res.json({ ...data, quota: quotaStore.status(uid) });
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
