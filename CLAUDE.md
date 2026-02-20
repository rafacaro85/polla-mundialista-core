# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a monorepo with two apps inside `Polla/`:

- `Polla/apps/api/` — NestJS backend (port 3001)
- `Polla/apps/web/` — Next.js frontend (port 3000)
- `Polla/scripts/` — Database seeders and utilities
- `Polla/docs/` — Internal technical documentation

All commands below assume you `cd` into the respective app directory first.

## Commands

### Backend (`Polla/apps/api`)

```bash
npm run start:dev           # Development with watch mode
npm run start:prod          # Production (runs compiled dist/)
npm run build               # Compile TypeScript

npm run test                # Jest unit tests
npm run test:watch          # Watch mode
npm run test:cov            # Coverage report
npm run test:e2e            # End-to-end tests

npm run lint                # ESLint with auto-fix
npm run format              # Prettier

# Database
npm run typeorm:migration:generate   # Generate migration from entity diff
npm run typeorm:migration:run        # Apply pending migrations
npm run typeorm:migration:revert     # Rollback last migration

# Seeders
npm run seed:wc2026                  # World Cup 2026 matches
npm run seed:champions:prod          # UEFA Champions League
npm run seed:complete                # Full tournament dataset
npm run seed:bracket-playable        # Pre-configured brackets
npm run seed:reset-matches           # Clear match data
npm run promote:me                   # Promote current user to admin
```

### Frontend (`Polla/apps/web`)

```bash
npm run dev                 # Development server
npm run build               # Next.js production build
npm run start               # Production server

npm run lint                # ESLint
```

### Database (root `Polla/`)

```bash
docker-compose up -d        # Start PostgreSQL 15 on port 5432
```

Default credentials: user `postgres`, password `password123`, database `polla_db`.

## Architecture

### Backend (NestJS 11)

Feature-based NestJS modules. Entry point: `src/main.ts`, root module: `src/app.module.ts`.

**Key modules:**

| Module | Purpose |
|--------|---------|
| `auth/` | JWT + Google OAuth2 via Passport strategies |
| `leagues/` | League CRUD (VIP/CLASSIC/PUBLIC types), invite codes, Redis-cached rankings |
| `matches/` | Fixture management, live scores, phase control |
| `predictions/` | User match predictions with joker system (upsert pattern) |
| `scoring/` | Points engine: 1pt correct goal tally + 2pt correct sign + 3pt exact score + joker multiplier |
| `brackets/` | Knockout phase bracket predictions |
| `knockout-phases/` | Dynamic phase unlock (controls when users can predict knockout rounds) |
| `bonus/` | Admin-created trivia questions per league |
| `standings/` | League rankings, Redis-cached |
| `payments/` | Wompi payment gateway for league entry fees |
| `notifications/` | Email (Nodemailer + Handlebars templates) + Telegram |
| `ai-prediction/` | Match predictions via Google Generative AI |

**Database**: TypeORM 0.3 with PostgreSQL. `synchronize: false` — always use migrations in production. Entities are in `src/database/entities/`.

**Caching**: Redis via `cache-manager-redis-yet`. Falls back to in-memory if `REDIS_URL` is not set. Used primarily in `leagues/leagues.service.ts` for rankings.

**Auth flow**: `POST /api/auth/login` → JWT access token. Guards use `@UseGuards(JwtAuthGuard)`. Role-based access via `@Roles(UserRole.ADMIN)`.

**Global config**: rate limiting at 500 req/60s, Helmet security headers, global validation pipe (whitelist + forbid non-whitelisted), prefix `/api`.

### Frontend (Next.js 16 + React 19)

Uses the Next.js App Router. State management with Zustand (`src/store/`). Data fetching with SWR. Styling with Tailwind CSS + Radix UI components.

API calls go through `src/services/` which hit `NEXT_PUBLIC_API_URL`. Set this to `http://localhost:3001/api` for local development.

Key env var for frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Deployment

- Frontend: Vercel
- Backend + DB + Redis: Railway
- Images: Cloudinary
- Payments: Wompi (Colombian payment gateway)

## Important Patterns

- **DTOs**: All API inputs validated with `class-validator` decorators. Adding new endpoints always requires a DTO.
- **Migrations**: Never rely on `synchronize: true`. Generate a migration after any entity change.
- **Scoring system**: 7-point max per match (1 goal count + 2 sign + 3 exact + joker doubles). Logic lives in `scoring/scoring.service.ts`.
- **League types**: `PUBLIC` (anyone joins), `CLASSIC` (invite code), `VIP` (invite + payment).
- **Knockout phase unlocking**: Controlled by `KnockoutPhaseStatus` entity. The `knockout-phases` module handles when users can start submitting bracket predictions.
- **TypeORM config**: Reads `DATABASE_URL` env var or individual `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` vars. See `src/data-source.ts`.
