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
import { CsvUserStore, signSessionToken, verifySessionToken } from './src/userStore';

dotenv.config({ path: ['.env.local', '.env'] });

async function startServer() {
  const app = express();
  // 兼容 Zeabur / Render / Fly 等 PaaS：由平台注入 PORT，本地默认 3000
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  const freeLimit = resolveFreeLimit(process.env.FREE_QUOTA_LIMIT);
  // 微信登录用户：CSV 持久化存储（users.csv / recharges.csv）
  const userStore = new CsvUserStore();
  // 匿名兜底（未配置微信时）：内存额度
  const quotaStore = new MemoryQuotaStore(freeLimit);
  const creditStore = new MemoryCreditStore();

  const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || 'dev-session-secret';
  const wechatEnabled = Boolean(process.env.WECHAT_APPID && process.env.WECHAT_APPSECRET);

  /** 从请求提取会话令牌（Authorization: Bearer 或 ?token） */
  const extractToken = (req: express.Request): string | null => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    if (typeof req.query.token === 'string') return req.query.token;
    return null;
  };

  /** 返回当前登录用户（未登录返回 null） */
  const currentUser = (req: express.Request) => {
    const token = extractToken(req);
    if (!token || !SESSION_SECRET) return null;
    const openid = verifySessionToken(token, SESSION_SECRET);
    if (!openid) return null;
    return userStore.get(openid) || null;
  };

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ---- 微信登录 ----
  app.get('/api/auth/status', (req, res) => {
    const token = extractToken(req);
    const user = currentUser(req);
    res.json({
      wechatEnabled,
      loggedIn: Boolean(user),
      user: user
        ? {
            openid: user.openid,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone,
            balance: user.balance,
            freeUsed: user.freeUsed,
            freeLimit: user.freeLimit,
            remaining: Math.max(0, user.freeLimit - user.freeUsed),
          }
        : undefined,
    });
  });

  // 跳转微信网页授权（须在微信内打开；公众号后台需配置网页授权域名）
  app.get('/api/auth/wechat', (req, res) => {
    if (!wechatEnabled) {
      return res.status(503).json({ error: '微信登录未配置（缺少 WECHAT_APPID / WECHAT_APPSECRET）' });
    }
    const appid = process.env.WECHAT_APPID!;
    const base = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${base}/api/auth/wechat/callback`;
    const state = Math.random().toString(36).slice(2);
    const url =
      `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
    res.cookie('wx_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
    res.redirect(url);
  });

  // 微信授权回调：换取用户信息 → 注册/登录 → 签发会话令牌 → 跳回前端
  app.get('/api/auth/wechat/callback', async (req, res) => {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code) return res.status(400).send('缺少授权 code');
    if (!state || state !== (req.cookies as Record<string, string> | undefined)?.wx_state) {
      return res.status(400).send('state 校验失败，请重试');
    }
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_APPSECRET;
    if (!appid || !secret) return res.status(503).send('微信登录未配置');

    try {
      const tokenRes = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`,
      );
      const tokenData = (await tokenRes.json()) as { openid?: string; access_token?: string; errcode?: number; errmsg?: string };
      if (!tokenData.openid || !tokenData.access_token) {
        return res.status(400).send(`微信授权失败：${tokenData.errmsg || 'unknown'}`);
      }

      const infoRes = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`,
      );
      const info = (await infoRes.json()) as { nickname?: string; headimgurl?: string; errcode?: number };
      const user = userStore.getOrCreate(tokenData.openid, info.nickname || '微信用户', info.headimgurl || '', freeLimit);
      const token = signSessionToken(user.openid, SESSION_SECRET);
      const base = process.env.APP_URL || `http://localhost:${PORT}`;
      res.redirect(`${base}/?login_token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.error('WeChat OAuth error:', err);
      res.status(500).send('微信登录失败，请稍后再试');
    }
  });

  // ---- 用户信息 ----
  app.get('/api/user/me', (req, res) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: '未登录' });
    res.json({
      openid: user.openid,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      balance: user.balance,
      freeUsed: user.freeUsed,
      freeLimit: user.freeLimit,
      remaining: Math.max(0, user.freeLimit - user.freeUsed),
    });
  });

  // 绑定/更新手机号
  app.post('/api/user/phone', (req, res) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: '未登录' });
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    if (!/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    const updated = userStore.updatePhone(user.openid, phone);
    res.json({ ok: true, phone: updated?.phone });
  });

  // 注销账号：删除 CSV 中的用户与充值记录
  app.delete('/api/user', (req, res) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: '未登录' });
    userStore.removeUser(user.openid);
    res.json({ ok: true, message: '账号已注销，你的信息已从服务器删除' });
  });

  // ---- 管理员：发放付费次数（收款码 + 人工确认）----
  app.post('/api/admin/add-credits', (req, res) => {
    const { userId, amount, secret, note } = req.body ?? {};
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return res.status(403).json({ error: '无权限：请配置并传入 ADMIN_SECRET' });
    }
    const uid = typeof userId === 'string' && userId.trim() ? userId.trim() : '';
    const amt = Number(amount);
    if (!uid || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: '参数无效：userId 与 amount(>0) 必填' });
    }
    // 优先写入 CSV（登录用户）；否则写内存（匿名兜底）
    const existing = userStore.get(uid);
    if (existing) {
      const balance = userStore.addCredits(uid, amt, typeof note === 'string' ? note : '');
      res.json({ ok: true, userId: uid, added: Math.floor(amt), balance });
    } else {
      const balance = creditStore.add(uid, amt);
      res.json({ ok: true, userId: uid, added: Math.floor(amt), balance, note: '匿名内存余额' });
    }
  });

  // ---- 决策分析 ----
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

    // 登录用户：openid（CSV 持久化）；匿名兜底：内存
    const loginUser = currentUser(req);
    const uid = loginUser ? loginUser.openid : typeof userId === 'string' && userId.trim() ? userId.trim() : 'anonymous';

    if (usingOwnerKey) {
      if (loginUser) {
        if (!userStore.canUse(uid)) {
          return res.status(403).json({
            error: '免费次数已用完',
            code: 'FREE_LIMIT_EXCEEDED',
            quota: {
              used: loginUser.freeUsed,
              limit: loginUser.freeLimit,
              remaining: Math.max(0, loginUser.freeLimit - loginUser.freeUsed),
              credits: loginUser.balance,
            },
          });
        }
      } else if (creditStore.balance(uid) <= 0 && !quotaStore.canUse(uid)) {
        return res.status(403).json({
          error: '免费次数已用完',
          code: 'FREE_LIMIT_EXCEEDED',
          quota: { ...quotaStore.status(uid), credits: 0 },
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
        if (loginUser) {
          userStore.consume(uid);
          const u = userStore.get(uid)!;
          quota = {
            used: u.freeUsed,
            limit: u.freeLimit,
            remaining: Math.max(0, u.freeLimit - u.freeUsed),
            credits: u.balance,
          };
        } else {
          if (!creditStore.consume(uid)) {
            quotaStore.consume(uid);
          }
          quota = { ...quotaStore.status(uid), credits: creditStore.balance(uid) };
        }
      } else {
        quota = loginUser
          ? { used: loginUser.freeUsed, limit: loginUser.freeLimit, remaining: Math.max(0, loginUser.freeLimit - loginUser.freeUsed), credits: loginUser.balance }
          : { ...quotaStore.status(uid), credits: creditStore.balance(uid) };
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
    console.log(`微信登录：${wechatEnabled ? '已启用' : '未配置（当前为匿名模式）'}`);
    console.log(`用户数据：${path.join(process.cwd(), 'data', 'users.csv')}`);
  });
}

startServer();
