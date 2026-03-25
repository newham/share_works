# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制 package.json 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 生产阶段
FROM node:20-alpine AS production

# 添加不具特权用户的 shell，用于安全运行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001

WORKDIR /app

# 复制 node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制应用代码
COPY --chown=nodeapp:nodejs . .

# 创建数据目录并设置权限
RUN mkdir -p data/works && chown -R nodeapp:nodejs data

# 切换到非 root 用户
USER nodeapp

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# 启动命令
CMD ["node", "server.js"]
