# 赛博决策天平 · 拿个主意 —— Zeabur / Docker 容器化部署
# 只要仓库根目录存在 Dockerfile，Zeabur 即按 Web Service（容器）构建运行，
# 不再被误判为静态站点。构建产物由本文件负责，无需 BUILD_COMMAND / START_COMMAND 变量。

FROM node:22-alpine

WORKDIR /app

# 先装依赖（利用层缓存）：package-lock.json + 项目 .npmrc（registry 已统一为官方源）
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# 拷贝源码并构建（vite 前端 + esbuild 服务端 → dist/）
COPY . .
RUN npm run build

ENV NODE_ENV=production
# Zeabur 通过 PORT 环境变量注入端口（本地默认 3000）
EXPOSE 3000

# 用户数据（CSV）目录声明为卷，便于 Zeabur 挂载持久化存储
VOLUME ["/app/data"]

CMD ["node", "dist/server.cjs"]
