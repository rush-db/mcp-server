FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . ./
RUN pnpm build

FROM node:22-alpine AS prod-deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

FROM node:22-alpine
LABEL org.opencontainers.image.title="rushdb-mcp-server" \
      org.opencontainers.image.description="MCP server for RushDB, the database for AI: schema-first tools for Claude, Cursor and other MCP clients" \
      org.opencontainers.image.source="https://github.com/rush-db/mcp-server" \
      org.opencontainers.image.licenses="Apache-2.0"
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY --from=builder /app/build ./build
COPY --from=prod-deps /app/node_modules ./node_modules
CMD ["node", "build/index.js"]
