# 部署指南：Cloudflare Pages（免费、始终在线）

本应用由两部分组成，可整体免费部署到 Cloudflare Pages：

- **前端 + API 同源**：`dist/`（Vite 构建产物）由 Pages 静态托管，`functions/`（Pages Function）提供 `POST /api/decision/analyze`。前端用相对路径 `/api/...` 请求，部署后自动命中同源函数，无需任何 CORS 配置。
- **服务端逻辑**：本地 Express（`server.ts`）与 Pages Function（`functions/api/decision/analyze.ts`）共用同一份纯 TS 模块 [`src/decisionEngine.ts`](src/decisionEngine.ts)，提示词、DeepSeek 调用、降级逻辑完全一致。

> ⚠️ 安全要点：`DEEPSEEK_API_KEY` **绝不能写进代码或前端**，只能在 Cloudflare 控制台以环境变量形式注入。

---

## 方式一：GitHub 集成（推荐，零本地工具）

### 第 1 步：把代码推送到 GitHub

```bash
git init
git add .
git commit -m "init cyber decision scale"
git branch -M main
git remote add origin https://github.com/<你的用户名>/cyber-decision-scale.git
git push -u origin main
```

> `.env.local`、`.dev.vars` 已被 `.gitignore` 忽略，不会把 Key 传上去。

### 第 2 步：创建 Pages 项目

1. 注册/登录 [Cloudflare](https://dash.cloudflare.com/)（免费）→ 左侧菜单 **Workers & Pages**
2. **Create application → Pages → Connect to Git** → 授权 GitHub 并选择刚才的仓库
3. 构建设置：
   - **Framework preset**：`None`（或选择 `Vite`）
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
4. 展开 **Environment variables**，添加（必须）：
   | 变量名 | 值 |
   |---|---|
   | `DEEPSEEK_API_KEY` | 你的 DeepSeek Key（`sk-...`） |
   | `DEEPSEEK_MODEL` | `deepseek-chat`（可选） |
   | `DEEPSEEK_BASE_URL` | `https://api.deepseek.com`（可选） |
5. 点击 **Save and Deploy**

> ⚠️ **重要**：Build output directory 必须填 `dist`（不含前导斜杠）。仓库**不要**包含 `wrangler.toml`——Git 集成部署由控制台配置驱动，多余的 `wrangler.toml` 会导致部署阶段报 `Missing entry-point to Worker script or to assets directory`。

### 第 3 步：完成

部署完成后你会得到形如 `https://cyber-decision-scale.pages.dev` 的公网地址，可直接分享。

之后每次 `git push` 到 main 分支都会自动触发重新构建部署；也可以在 Pages 项目里绑定自定义域名（免费）。

### 常见问题：部署阶段报错 Missing entry-point

构建成功、但最后一步（Executing user deploy command）报 `Missing entry-point to Worker script or to assets directory` 时，依次检查：

1. **确认 Build output directory 已填 `dist`**（Pages 项目 → Settings → Builds & deployments → Build configurations）
2. **确认仓库根目录没有 `wrangler.toml`**（本项目已移除；Git 集成部署不需要它）
3. 若上述都没问题，把部署命令改为 Pages 专用命令：Settings → Builds & deployments → **Deploy command** 填 `npx wrangler pages deploy`
4. 修正后重新部署：Pages 项目 → Deployments → **Retry deployment**

---

## 方式二：本地 CLI 部署（可选）

需要 Node.js 18+：

```bash
# 1. 安装 wrangler（一次性）
npm i -D wrangler

# 2. 登录 Cloudflare（浏览器授权）
npx wrangler login

# 3. 构建并部署（functions/ 会自动一并上传）
npm run build
npm run deploy:pages
```

部署前可用本地模拟环境预览整个站点（静态 + 函数）：

```bash
# 把 .dev.vars.example 复制为 .dev.vars 并填入真实 Key
npx wrangler pages dev dist --port 8788
# 打开 http://localhost:8788
```

---

## 免费额度与注意事项

- **免费额度**：静态托管不限量；函数（含静态页面请求计数）**10 万次/天**，个人使用完全足够。
- **休眠**：Cloudflare Pages 无休眠，始终在线，无冷启动（优于 Render/Vercel 免费版的休眠策略）。
- **请求时长**：Workers 免费档对单个请求的 CPU/时长有限制；本应用已在调用中设置 `max_tokens: 4096` 控制 DeepSeek 输出长度以缩短耗时。若出现个别超时（长文本生成偶尔较慢），可考虑：减少画像字段、在 Pages 控制台限制并发、或升级 Workers 付费档（$5/月起，按量计费）。
- **环境变量修改**：改 Key 后无需重新部署，在 Pages 项目 Settings → Environment variables 保存即可生效。

## 本地开发不受影响

日常开发仍用 `npm run dev`（Express + Vite HMR，读取 `.env.local`）；`npm run build && npm run start` 可本地验证生产形态。`src/decisionEngine.ts` 是两端共用逻辑，改提示词只需改一处。
