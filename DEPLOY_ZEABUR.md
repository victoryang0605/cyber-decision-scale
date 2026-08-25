# 部署指南：Zeabur（免费、零代码改造、国内友好）

本应用是标准的 Node.js + Express 服务（`server.ts`），Zeabur 可以**原样部署，无需任何改造**（不像 Cloudflare 需要 serverless 化）。代码已支持 `PORT` 环境变量注入。

> ⚠️ 免费版注意：Zeabur **Free Plan（US$0/月）** 的服务在空闲一段时间后会**自动休眠**，下次访问需等待几秒冷启动唤醒；若希望始终在线，可升级 Dev Plan（US$5/月，14 天免费试用）。详见 [Zeabur Free Plan](https://zeabur.com/zh-TW/pricing/free-plan)。

---

## 部署步骤

### 第 1 步：注册并登录

打开 [zeabur.com](https://zeabur.com)（中文界面，支持 GitHub 登录，免费、无需信用卡）。

### 第 2 步：创建项目并关联仓库

1. 点击 **创建项目**（Create Project），输入项目名，例如 `cyber-decision-scale`
2. 在项目内点击 **部署服务** → **从 GitHub 部署** → 授权并选择 `victoryang0605/cyber-decision-scale`
3. Zeabur 会自动检测为 Node.js 项目

### 第 3 步：配置构建与启动

在服务的 **Variables（变量）** 面板（或服务配置）中设置：

| 键 | 值 | 说明 |
|---|---|---|
| `BUILD_COMMAND` | `npm run build` | **必须**：先构建出 `dist/`（否则 start 无产物可跑） |
| `START_COMMAND` | `npm run start` | 默认即可（`node dist/server.cjs`） |
| `NODE_ENV` | `production` | **建议**：走生产静态托管分支（否则会启动 Vite 中间件） |

> Zeabur 若自动识别了 `start` 脚本，`START_COMMAND` 可不填；但 `BUILD_COMMAND` 一定要设。

### 第 4 步：配置环境变量（API Key）

在服务的 **Variables** 中添加：

| 键 | 值 |
|---|---|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek Key（`sk-...`） |
| `DEEPSEEK_MODEL` | `deepseek-chat`（可选） |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com`（可选） |

### 第 5 步：部署

点击 **部署**（或保存后自动部署）。完成后 Zeabur 会分配 `https://<服务名>.zeabur.app` 公网地址；若需自定义域名，在服务 **Networking** 中绑定（国内自定义域名需备案，用 `.zeabur.app` 则无需）。

---

## 验证

部署完成后打开你的 `.zeabur.app` 地址：

- 首页能打开（赛博决策天平界面）
- 输入议题点「启动赛博天平推演」能返回 DeepSeek 个性化裁决（有画像更佳）
- 若返回的是固定文案（"理性天使 · 长期价值视角"），说明 `DEEPSEEK_API_KEY` 未生效——检查变量是否已保存并重新部署

## 与 Cloudflare Pages 的关系

同一份代码两边可同时部署：

- **Cloudflare Pages**（`functions/`）：始终在线、免费额度 10 万请求/天，适合做主站
- **Zeabur**：Express 直接跑、无单请求时长限制、国内访问更友好，适合做国内备用站

改代码只需改一处（`src/decisionEngine.ts` 或前端），两边各自重新部署即可。
