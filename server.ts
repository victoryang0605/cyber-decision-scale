import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { callDeepSeekJson, generateFallbackDecision, DecisionInput } from './src/decisionEngine';
import {
  CsvStore,
  RECHARGE_PACKAGES,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from './src/userStore';

dotenv.config({ path: ['.env.local', '.env'] });

const USERNAME_RE = /^[\w\u4e00-\u9fa5]{2,20}$/;
const PHONE_RE = /^1\d{10}$/;

async function startServer() {
  const app = express();
  // 兼容 Zeabur / Render / Fly 等 PaaS：由平台注入 PORT，本地默认 3000
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CSV 持久化存储：users.csv / recharges.csv / devices.csv
  const store = new CsvStore();
  const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || 'dev-session-secret';

  /** 从请求提取会话令牌（Authorization: Bearer 或 ?token） */
  const extractToken = (req: express.Request): string | null => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    if (typeof req.query.token === 'string') return req.query.token;
    return null;
  };

  /** 返回当前登录用户名（未登录返回 null） */
  const currentUsername = (req: express.Request): string | null => {
    const token = extractToken(req);
    if (!token) return null;
    return verifySessionToken(token, SESSION_SECRET);
  };

  /** 序列化用户信息给前端 */
  const serializeUser = (username: string) => {
    const u = store.accountStatus(username);
    if (!u) return null;
    return {
      username: u.username,
      phone: u.phone,
      balance: u.balance,
      freeRemaining: u.freeRemaining,
    };
  };

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ---- 注册 / 登录 ----

  app.get('/api/auth/status', (req, res) => {
    const username = currentUsername(req);
    const user = username ? store.findByUsername(username) : undefined;
    res.json({ loggedIn: Boolean(user), user: user ? serializeUser(username) : undefined });
  });

  // 注册：用户名 + 手机号 + 密码，注册送 3 次免费使用
  app.post('/api/auth/register', (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: '用户名需为 2-20 位中文/字母/数字/下划线' });
    }
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 位' });
    }

    const result = store.register(username, phone, password);
    if (result.ok === false) {
      return res.status(400).json({ error: result.error });
    }
    const token = signSessionToken(username, SESSION_SECRET);
    res.json({ ok: true, token, user: serializeUser(username), freeGift: true, message: '注册成功，已赠送 3 次免费使用' });
  });

  // 登录：用户名 + 密码
  app.post('/api/auth/login', (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = store.findByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    // 关联设备：记录该设备曾被此账号使用
    if (typeof req.body?.deviceId === 'string' && req.body.deviceId) {
      store.linkDeviceToUser(req.body.deviceId, username);
    }
    const token = signSessionToken(username, SESSION_SECRET);
    res.json({ ok: true, token, user: serializeUser(username) });
  });

  // ---- 用户信息 ----

  app.get('/api/user/me', (req, res) => {
    const username = currentUsername(req);
    const user = serializeUser(username || '');
    if (!user) return res.status(401).json({ error: '未登录' });
    res.json(user);
  });

  // 修改手机号
  app.post('/api/user/phone', (req, res) => {
    const username = currentUsername(req);
    if (!username || !store.findByUsername(username)) return res.status(401).json({ error: '未登录' });
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    if (!PHONE_RE.test(phone)) return res.status(400).json({ error: '手机号格式不正确' });
    const updated = store.updatePhone(username, phone);
    if (!updated) return res.status(400).json({ error: '手机号已被其他账号使用' });
    res.json({ ok: true, phone: updated.phone });
  });

  // 注销账号：删除 users.csv 中的账号与 recharges.csv 流水
  app.delete('/api/user', (req, res) => {
    const username = currentUsername(req);
    if (!username || !store.findByUsername(username)) return res.status(401).json({ error: '未登录' });
    store.removeUser(username);
    res.json({ ok: true, message: '账号已注销，你的信息已从服务器删除' });
  });

  // ---- 充值套餐 ----

  app.get('/api/packages', (req, res) => {
    res.json({ packages: RECHARGE_PACKAGES });
  });

  // ---- 管理员：按套餐发放次数（收款码 + 人工确认）----
  // body: { username, package?: 'p5'|'p10'|'p100', credits?, amountYuan?, secret }
  app.post('/api/admin/add-credits', (req, res) => {
    const { username, package: pkg, credits, amountYuan, secret, note } = req.body ?? {};
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return res.status(403).json({ error: '无权限：请配置并传入 ADMIN_SECRET' });
    }
    const uname = typeof username === 'string' && username.trim() ? username.trim() : '';
    if (!uname || !store.findByUsername(uname)) {
      return res.status(400).json({ error: '用户不存在，请确认用户提供的用户名' });
    }

    let pkgId = 'custom';
    let yuan = 0;
    let creditsNum = 0;
    const matched = RECHARGE_PACKAGES.find((p) => p.id === pkg);
    if (matched) {
      pkgId = matched.id;
      yuan = matched.price;
      creditsNum = matched.credits;
    } else {
      yuan = Number(amountYuan) || 0;
      creditsNum = Number(credits) || 0;
      if (creditsNum <= 0) return res.status(400).json({ error: '参数无效：请传 package 套餐，或 credits(>0)' });
    }

    const balance = store.addCredits(uname, pkgId, yuan, creditsNum, typeof note === 'string' ? note : '');
    res.json({ ok: true, username: uname, package: pkgId, amountYuan: yuan, added: creditsNum, balance });
  });

  // ---- 决策分析 ----
  app.post('/api/decision/analyze', async (req, res) => {
    const { dilemma, optionA, optionB, mode, tone, userProfile, deviceId, userKey } = req.body;

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

    // 登录用户按账号限额度（跨设备跟随账号）；匿名按设备指纹限 3 次
    const username = currentUsername(req);
    const loggedInUser = username ? store.findByUsername(username) : undefined;
    const deviceFp = typeof deviceId === 'string' && deviceId.trim() ? deviceId.trim() : '';

    const quotaFor403 = (used: number, limit: number, credits: number) => ({
      used,
      limit,
      remaining: Math.max(0, limit - used),
      credits,
    });

    if (usingOwnerKey) {
      if (loggedInUser) {
        if (!store.canUseAccount(loggedInUser.username)) {
          const s = store.accountStatus(loggedInUser.username)!;
          return res.status(403).json({
            error: '使用次数已用完',
            code: 'FREE_LIMIT_EXCEEDED',
            quota: quotaFor403(0, 0, s.balance),
          });
        }
      } else if (!store.canUseDevice(deviceFp)) {
        const d = store.deviceStatus(deviceFp);
        return res.status(403).json({
          error: '游客免费次数（3 次/设备）已用完，请注册登录后继续使用',
          code: 'FREE_LIMIT_EXCEEDED',
          quota: quotaFor403(d.used, d.limit, 0),
        });
      }
    }

    try {
      const data = await callDeepSeekJson(input, {
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      });
      // 只有真正调用了 LLM（产生费用）才扣减额度
      let quota;
      if (usingOwnerKey) {
        if (loggedInUser) {
          store.consumeAccount(loggedInUser.username);
          const s = store.accountStatus(loggedInUser.username)!;
          quota = {
            username: s.username,
            balance: s.balance,
            freeRemaining: s.freeRemaining,
            used: 0,
            limit: 0,
            remaining: s.balance + s.freeRemaining,
            credits: s.balance,
          };
        } else {
          store.consumeDevice(deviceFp);
          const d = store.deviceStatus(deviceFp);
          quota = quotaFor403(d.used, d.limit, 0);
        }
      } else {
        quota = loggedInUser
          ? { username: loggedInUser.username, balance: 0, freeRemaining: 0, used: 0, limit: 0, remaining: -1, credits: 0 }
          : { used: 0, limit: 0, remaining: -1, credits: 0 };
      }
      res.json({ ...data, quota });
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
    console.log(`数据文件：${path.join(process.cwd(), 'data')} (users.csv / recharges.csv / devices.csv)`);
  });
}

startServer();
