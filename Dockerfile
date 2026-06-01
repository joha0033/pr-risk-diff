FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm build

ENV PORT=8080
EXPOSE 8080

# ADK api_server for Phase 2 hybrid deployment
CMD ["npx", "adk", "api_server", "src/root-agent.ts", "--port", "8080"]
