# -------- Builder --------
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# deps
COPY package*.json ./
RUN npm ci

# código
COPY . .

# build Next
RUN npm run build

# -------- Runner --------
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copiamos TUDO do builder, incluindo node_modules e .next
COPY --from=builder /usr/src/app ./

EXPOSE 3000
CMD ["npm", "start"]
