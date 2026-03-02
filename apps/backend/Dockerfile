# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.30.3

# Install all dependencies (devDeps needed for nest build + ts compilation)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Generate Prisma Client
# DATABASE_URL is not used by 'prisma generate' (no DB connection),
# but prisma.config.ts imports dotenv so we provide a dummy value.
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost/build pnpm prisma generate

# Compile TypeScript → dist/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/
RUN pnpm build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@10.30.3

# Install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# Copy compiled output from builder (includes dist/src/**/*.js)
COPY --from=builder /app/dist ./dist/

# Copy the Prisma-generated client into dist/generated/prisma.
# Compiled files live at dist/src/<module>/*.js; their relative import
# "../../generated/prisma" resolves to dist/generated/prisma at runtime.
COPY --from=builder /app/generated/prisma ./dist/generated/prisma

EXPOSE 3000

# Run node directly — equivalent to 'pnpm start:prod' but without the pnpm overhead
CMD ["node", "dist/src/main"]
