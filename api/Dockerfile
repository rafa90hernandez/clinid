# -------- Builder --------
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# deps
COPY package*.json ./
RUN npm ci

# código
COPY . .

# Prisma client + build Nest
RUN npx prisma generate
RUN npm run build

# -------- Runner --------
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# 👉 aplica migrations no start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
