# 拿个主意 · AI 决策助手

治愈选择困难症的 AI 决策助手。纠结的时候，让 AI 多重人格辩论帮你拿个主意：物理级天平博弈、抛硬币/命运轮盘与一键生成社交裁决卡片。

**核心功能：**
- ⚖️ 天平推演：DeepSeek 多重人格（理性天使/毒舌恶魔/赛博预言家）博弈 + 量化砝码 + 神圣裁决令
- 🧠 **用户画像个性化决策**：填写性格、工作、学习、生活与当下状态等基本场景，每次推演时作为参数录入，LLM 结合画像给出量身定制的决策依据（仅存于浏览器 localStorage）
- 🪙 命运硬币 / 🎡 赛博轮盘 / 🗄️ 决策档案馆 / 🎴 社交裁决卡片一键导出

**LLM 后端：DeepSeek（OpenAI 兼容 API）**，默认模型 `deepseek-chat`（DeepSeek-V3），可选 `deepseek-reasoner`（DeepSeek-R1）。

## 本地运行

**环境要求：** Node.js 18+

1. 安装依赖：
   `npm install`
2. 配置 API Key：复制 [.env.example](.env.example) 为 `.env.local`，将 `DEEPSEEK_API_KEY` 设为你的 DeepSeek API Key（在 https://platform.deepseek.com/ 获取）：
   ```
   DEEPSEEK_API_KEY="sk-xxxx"
   DEEPSEEK_MODEL="deepseek-chat"
   ```
3. 运行应用：
   `npm run dev`

未配置 `DEEPSEEK_API_KEY` 时，`/api/decision/analyze` 会自动降级为内置启发式裁决结果，应用仍可正常演示。

## 免费部署到公网

- **Cloudflare Pages**（始终在线、免费，推荐主站）：前端与 API 整体部署，步骤见 **[DEPLOY.md](DEPLOY.md)**——推送到 GitHub 后在 Cloudflare 控制台连仓库即可，只需配置 `DEEPSEEK_API_KEY` 环境变量。
- **Zeabur**（零改造、国内友好，免费版空闲自动休眠）：Express 服务原样部署，步骤见 **[DEPLOY_ZEABUR.md](DEPLOY_ZEABUR.md)**。

## 常用命令

- `npm run dev` — 本地开发（Vite HMR + Express）
- `npm run build` — 构建前端（Vite）并打包服务端（esbuild → `dist/server.cjs`）
- `npm run start` — 以生产模式运行 `dist/server.cjs`
- `npm run lint` — TypeScript 类型检查
