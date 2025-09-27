# syntax=docker/dockerfile:1

# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
# Dependências do sistema que o Next pode precisar
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Aqui está o "Build Command" efetivo (dentro do Dockerfile)
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copia artefatos necessários para rodar `next start`
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Para `next start` funcionar sem output standalone, precisamos de node_modules
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000

# Isto é o "Start Command" efetivo (dentro do Dockerfile)
CMD ["npm", "start"]
