# Snack Overflow

A production-minded office pantry tracker built for the Bipolar Factory assignment.

## Monorepo Architecture

This project is organized as an npm workspace monorepo:

- [`apps/web`](apps/web): Next.js frontend (React 19, TypeScript, Tailwind CSS, App Router)
- [`apps/api`](apps/api): Express.js REST API (TypeScript, Prisma ORM, PostgreSQL, Zod validation)

## Prerequisites

- Node.js >= 20 (tested on v24.13.0)
- npm >= 10 (tested on 11.6.2)
- PostgreSQL 14+ (running on `localhost:5432`)

## Demo Credentials (Development Only)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@snackoverflow.local` | `admin123` |
| **Member** | `member@snackoverflow.local` | `member123` |

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` (and `apps/api/.env`):
   ```bash
   cp .env.example .env
   cp .env.example apps/api/.env
   ```

3. **Database Setup & Migrations:**
   ```bash
   # Run Prisma migrations
   npm --workspace=apps/api run prisma:migrate

   # Seed initial database records
   npm --workspace=apps/api run prisma:seed
   ```

4. **Run development servers:**
   - Run backend API: `npm run dev:api` (runs on http://localhost:4000)
   - Run frontend: `npm run dev:web` (runs on http://localhost:3000)

5. **Type-check & Build:**
   ```bash
   npm run type-check
   npm run build
   ```

## Database Design & Integrity Rules

- **User**: Stores role-based accounts (`ADMIN`, `MEMBER`) with bcrypt-hashed passwords.
- **Snack**: Unique snack names, categorized (`SWEET`, `SAVOURY`, `DRINK`, `HEALTHY_ISH`), with soft deletion via `archivedAt`.
- **Vote**: Enforces composite uniqueness on `(userId, snackId)` directly in the database.
- **Activity**: Audit log of all `CONSUMED` and `RESTOCKED` actions with amounts.
- **Check Constraints enforced at PostgreSQL level:**
  - `snack_quantity_nonnegative`: `quantity >= 0`
  - `snack_threshold_nonnegative`: `lowStockThreshold >= 0`
  - `activity_amount_positive`: `amount > 0`


## Snack of the Week Calculation Rule

- **Time Window**: Monday 00:00:00 to Sunday 23:59:59 based on `Asia/Kolkata` timezone (UTC+5:30).
- **Weekly Votes**: Calculated by counting votes created during the current week (`createdAt >= week_start`).
- **Tie-Breaking Order**:
  1. Highest weekly votes (`weeklyVotes DESC`)
  2. Highest total lifetime votes (`lifetimeVotes DESC`)
  3. Alphabetical snack name (`name ASC`)
- **Fallback**: If no votes were cast during the current week, `snackOfTheWeek` returns `null` so the UI can display an appropriate empty-state message.
