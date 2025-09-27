# syntax=docker/dockerfile:1

############################
# deps
############################
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
# instala TODAS as deps (inclui dev) para compilar
RUN npm ci

############################
# builder
############################
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Recebe a URL da API no build. Se não vier, seu next.config.js ignora o rewrite.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Build do Next
RUN npm run build

############################
# runner
############################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Artefatos necessários pra rodar com `next start`
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Deps de runtime (aproveita deps e remove devDependencies)
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

EXPOSE 3000

# Usa PORT do Render e faz bind em 0.0.0.0
CMD ["sh", "-c", "npx next start -p ${PORT:-3000} -H 0.0.0.0"]
