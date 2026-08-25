# 拿个主意 · AI 决策助手

治愈选择困难症的 AI 决策助手。纠结的时候，让 AI 多重人格辩论帮你拿个主意：物理级天平博弈、抛硬币/命运轮盘与一键生成社交裁决卡片。

**核心功能：**
- ⚖️ 天平推演：DeepSeek 多重人格（理性天使/毒舌恶魔/赛博预言家）博弈 + 量化砝码 + 神圣裁决令
- 🧠 **用户画像个性化决策**：填写性格、工作、学习、生活与当下状态等基本场景，每次推演时作为参数录入，LLM 结合画像给出量身定制的决策依据（仅存于浏览器 localStorage）
- 👤 **账号体系（用户名 + 手机号注册）**：注册即送 3 次免费使用；额度跟随账号，换设备登录依然受限
- 💰 **充值套餐**：¥5=20 次 / ¥10=50 次 / ¥100=500 次，收款码支付，站长人工确认后到账（`recharges.csv` 记录流水）
- 🆓 **游客模式**：不注册也可用，但每台设备（浏览器指纹）仅限 3 次
- 🔑 **BYOK**：用户可接入自己的 DeepSeek API Key，调用走用户自己的账户计费
- 🪙 命运硬币 / 🎡 赛博轮盘 / 🗄️ 决策档案馆 / 🎴 社交裁决卡片一键导出

**LLM 后端：DeepSeek（OpenAI 兼容 API）**，默认模型 `deepseek-chat`（DeepSeek-V3），可选 `deepseek-reasoner`（DeepSeek-R1）。

## 站长运营说明（收款码 + 人工确认）

1. 把你的微信/支付宝收款码图片命名为 `qr-pay.png` 放到 `public/` 目录（构建后即部署到站点根路径 `/qr-pay.png`，充值弹窗自动展示）
2. 配置环境变量 `ADMIN_SECRET`（强随机串）
3. 用户付款后，按套餐发放次数（套餐 id：`p5`=¥5/20次、`p10`=¥10/50次、`p100`=¥100/500次）：

```bash
curl -X POST https://你的域名/api/admin/add-credits \
  -H 'Content-Type: application/json' \
  -d '{"username":"用户的用户名","package":"p10","secret":"你的ADMIN_SECRET"}'
```

> 计费顺序：付费余额 → 注册赠送/游客设备额度。发放与消费全部写入 CSV，服务重启不丢失。

## 数据存储（服务器端 CSV，`data/` 目录，已 gitignore）

| 文件 | 内容 |
|---|---|
| `users.csv` | 用户名、手机号、密码哈希、付费余额、注册赠送剩余次数、时间 |
| `recharges.csv` | 充值流水：套餐、金额、发放次数、时间 |
| `devices.csv` | 游客设备指纹与已用次数（每设备限 3 次）、最近登录账号 |

## 使用规则

- **游客**：不注册也可用，浏览器指纹每设备免费 3 次；用完后提示注册/充值
- **注册用户**：注册送 3 次；额度存在账号上，**换任何设备登录都使用同一份额度**（天然防止"换设备绕过"）
- **注销**：额度弹窗内可注销账号，删除 `users.csv` 与 `recharges.csv` 中的记录

## 本地运行

**环境要求：** Node.js 18+

1. 安装依赖：`npm install`
2. 复制 [.env.example](.env.example) 为 `.env.local`，配置 `DEEPSEEK_API_KEY`（https://platform.deepseek.com/）
3. 运行：`npm run dev`（访问 http://localhost:3000）

未配置 `DEEPSEEK_API_KEY` 时，`/api/decision/analyze` 自动降级为内置启发式裁决，应用仍可演示。

## 免费部署到公网

- **Zeabur（推荐主站）**：Express 服务原样部署，账号/CSV/充值体系依赖可写文件系统，请部署在 Zeabur，步骤见 **[DEPLOY_ZEABUR.md](DEPLOY_ZEABUR.md)**（需配置 `ADMIN_SECRET`、`SESSION_SECRET` 环境变量）
- **Cloudflare Pages**：仅前端 + 匿名额度（serverless 无文件系统，不含账号/CSV），步骤见 **[DEPLOY.md](DEPLOY.md)**

## 常用命令

- `npm run dev` — 本地开发（Vite HMR + Express）
- `npm run build` — 构建前端（Vite）并打包服务端（esbuild → `dist/server.cjs`）
- `npm run start` — 以生产模式运行 `dist/server.cjs`
- `npm run lint` — TypeScript 类型检查
