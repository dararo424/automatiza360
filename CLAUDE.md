# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Automatiza360 is a multi-tenant SaaS platform for small businesses (restaurants, tech stores, clinics). It is a **pnpm monorepo** managed with `pnpm-workspace.yaml`.

- `apps/backend` — NestJS v11 API (active development)
- `apps/frontend` — Placeholder (not yet started)
- `apps/ai-service` — Placeholder (not yet started)
- `packages/shared` — Placeholder for shared types/utilities

## Package Manager

Use **pnpm** exclusively. Do not use npm or yarn.

```bash
# Install all workspace dependencies from repo root
pnpm install
```

## Backend (`apps/backend`)

### Commands (run from `apps/backend/`)

```bash
pnpm start:dev          # Dev server with watch mode
pnpm build              # Compile TypeScript
pnpm start:prod         # Run compiled output

pnpm test               # Unit tests (Jest)
pnpm test:watch         # Unit tests in watch mode
pnpm test:e2e           # E2E tests
pnpm test:cov           # Coverage report

pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier format
```

### Run a single test file

```bash
pnpm test -- --testPathPattern=app.controller
```

### Prisma

```bash
# From apps/backend/
npx prisma migrate dev          # Create and apply a new migration
npx prisma migrate deploy       # Apply pending migrations (production)
npx prisma generate             # Regenerate Prisma Client after schema changes
npx prisma studio               # Open Prisma Studio GUI
```

The Prisma config is in `prisma.config.ts` (not in `package.json`). It reads `DATABASE_URL` from `.env`.

## Architecture

### Multi-tenancy

Every domain model (`Order`, `Product`, `Ticket`, `User`) belongs to a `Tenant`. All queries **must** be scoped to `tenantId`. Never return data across tenants.

### Data Model

- **Tenant** — One business client. Has a `plan` (STARTER/PRO/BUSINESS) and `industry` (RESTAURANT/TECH_STORE/CLINIC/OTHER).
- **User** — Belongs to one Tenant. Roles: OWNER > ADMIN > STAFF.
- **Order** + **OrderItem** — Order management (primarily for restaurants).
- **Product** — Inventory/menu items with stock tracking (`stock`, `minStock`).
- **Ticket** — Device repair workflow (primarily for tech stores).

### Backend Stack

- **NestJS** with standard module/controller/service/repository pattern
- **Prisma** ORM for PostgreSQL (hosted on Supabase)
- **JWT + Passport** for authentication (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`)
- **class-validator** + **class-transformer** for DTO validation
- **bcryptjs** for password hashing

### NestJS Conventions

- Feature modules go in `src/<feature>/<feature>.module.ts`
- DTOs use `class-validator` decorators and live in `src/<feature>/dto/`
- Guards should enforce both JWT authentication and tenant scoping
- Use `ValidationPipe` globally for DTO validation

## Environment

The backend requires a `.env` file in `apps/backend/` with:

```
DATABASE_URL="postgresql://..."
```

`.env` files are gitignored.
