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

# Copia tudo do builder (inclui node_modules e dist)
COPY --from=builder /usr/src/app ./

EXPOSE 3001
# aplica migrations e sobe API
CMD ["sh", "-lc", "npx prisma migrate deploy && node dist/main.js"]
