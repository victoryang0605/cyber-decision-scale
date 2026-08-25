import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { callDeepSeekJson, generateFallbackDecision, DecisionInput } from './src/decisionEngine';

dotenv.config({ path: ['.env.local', '.env'] });

async function startServer() {
  const app = express();
  // 兼容 Zeabur / Render / Fly 等 PaaS：由平台注入 PORT，本地默认 3000
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Decision Analysis Endpoint
  app.post('/api/decision/analyze', async (req, res) => {
    const { dilemma, optionA, optionB, mode, tone, userProfile } = req.body;

    if (!dilemma) {
      return res.status(400).json({ error: '请提供您面临的纠结或选择！' });
    }

    const input: DecisionInput = { dilemma, optionA, optionB, mode, tone, userProfile };

    const apiKey = process.env.DEEPSEEK_API_KEY;
    // Fallback heuristic generator if DeepSeek key is not configured
    if (!apiKey) {
      return res.json(generateFallbackDecision(input));
    }

    try {
      const data = await callDeepSeekJson(input, {
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      });
      res.json(data);
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
    console.log(`[Cyber Decision Scale] Server running on http://localhost:${PORT}`);
  });
}

startServer();
