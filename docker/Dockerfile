# ===================================================================
# SkillMatrix Multi-stage Dockerfile (Offline Capable)
# ===================================================================

# -------------------------------------------------------------------
# Stage 1: Build Stage
# -------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# パッケージ定義のコピー
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/prisma ./packages/backend/prisma/

RUN npm ci

# ソースコードのコピー
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared/
COPY packages/backend ./packages/backend/
COPY packages/frontend ./packages/frontend/

# ビルド実行
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/backend
RUN npm run build --workspace=packages/frontend

# -------------------------------------------------------------------
# Stage 2: Production Runtime
# -------------------------------------------------------------------
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 実行に必要な最小限のアセットをコピー
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# プロダクション依存のみインストール & Prismaクライアント生成
RUN npm ci --omit=dev && npx prisma generate --schema=./packages/backend/prisma/schema.prisma

EXPOSE 3000

USER node

CMD ["node", "packages/backend/dist/index.js"]
