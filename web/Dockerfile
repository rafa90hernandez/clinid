# -------- Builder --------
FROM node:20-alpine3.20 AS builder
WORKDIR /usr/src/app

# Para Next.js às vezes ajuda ter compat layer
RUN apk add --no-cache libc6-compat

# Opcional: configurar registry/timeouts (pode sobrescrever com --build-arg)
ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN npm set registry ${NPM_REGISTRY} \
 && npm set fetch-retries 5 \
 && npm set fetch-retry-maxtimeout 600000 \
 && npm set fetch-timeout 600000 \
 && npm set audit false \
 && npm set fund false

# Copie apenas manifests e instale deps com cache
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# Copie o restante do código
COPY . .

# Build do Next
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# -------- Runner --------
FROM node:20-alpine3.20 AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat

# node_modules do builder (evita reinstalar)
COPY --from=builder /usr/src/app/node_modules/ ./node_modules/

# artefatos da build e assets públicos
COPY --from=builder /usr/src/app/.next/ ./.next/
COPY --from=builder /usr/src/app/public/ ./public/
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]
