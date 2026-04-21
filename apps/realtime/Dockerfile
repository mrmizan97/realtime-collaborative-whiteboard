FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/realtime ./apps/realtime
RUN corepack enable && pnpm install --frozen-lockfile=false
RUN pnpm --filter @canvasly/realtime build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/realtime
EXPOSE 4000
CMD ["node", "dist/server.js"]
