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


## Concurrency Strategy & Atomic Consumption

### The Problem with Read-Then-Write
Under concurrent load (e.g. two users clicking "Consume" on the last snack simultaneously), reading quantity into application memory, checking if `quantity >= amount`, and writing `quantity - amount` causes race conditions that oversell inventory below zero.

### The Solution: Database-Level Conditional Update
Snack Overflow guarantees inventory safety at the PostgreSQL level via a single atomic update wrapped in an explicit transaction:

```sql
UPDATE "Snack"
SET "quantity" = "quantity" - $1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $2
  AND "archivedAt" IS NULL
  AND "quantity" >= $1
RETURNING "id", "name", "category", "quantity", "lowStockThreshold";
```

- If rows returned $= 0$: The application distinguishes between non-existent/archived snacks (`404 NOT_FOUND`) and depleted stock (`409 INSUFFICIENT_STOCK`).
- If rows returned $> 0$: The `CONSUMED` activity record is inserted in the exact same database transaction (`prisma.$transaction`). If either fails, the transaction rolls back completely.
- Secondary safety net: The database check constraint `CHECK ("quantity" >= 0)` guarantees that quantity cannot become negative under any circumstance.

### Concurrency Proof
Verified via automated integration test in `apps/api/tests/consumption.test.ts`:
- **Initial condition**: 1 snack seeded with `quantity = 3`.
- **Concurrent load**: 10 simultaneous HTTP requests, each requesting `amount = 1`.
- **Result**:
  - Exactly **3** requests succeed (`200 OK`).
  - Exactly **7** requests receive `409 Conflict` (`INSUFFICIENT_STOCK`).
  - Final database quantity is exactly **0** (never negative).
  - Exactly **3** `CONSUMED` activity records created in PostgreSQL.
