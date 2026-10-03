# Multi-stage Dockerfile for Cosmo Note (Multi-Architecture amd64 & arm64)
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install
RUN pnpm rebuild better-sqlite3

COPY . .
RUN pnpm build
RUN pnpm prune --prod

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/cosmo.db

RUN mkdir -p /data && chown -R node:node /data

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.sql ./

EXPOSE 3000
VOLUME ["/data"]

USER node
CMD ["node", "dist/server.js"]
