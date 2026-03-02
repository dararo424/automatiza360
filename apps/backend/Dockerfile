# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.30.3

# Install all dependencies (devDeps needed for nest build + ts compilation)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Generate Prisma Client — must happen before TypeScript compilation so that
# the schema-specific types inside @prisma/client are available to tsc.
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost/build pnpm prisma generate

# Compile TypeScript → dist/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/
RUN pnpm build

# Remove devDependencies from node_modules, keeping only production deps.
# @prisma/client (prod dep) retains the generated schema client.
RUN pnpm prune --prod

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Copy pruned node_modules (prod-only) that already contain the generated
# Prisma Client — no reinstall or re-generate needed.
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled output
COPY --from=builder /app/dist ./dist/

# package.json is required for Node.js module resolution
COPY package.json ./

EXPOSE 3000

CMD ["node", "dist/src/main"]
