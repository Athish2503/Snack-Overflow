# Snack Overflow 🍿

A production-grade, concurrency-safe office pantry management system built for the Bipolar Factory assignment. Snack Overflow ensures office snacks are tracked transparently, consumed safely under concurrent spikes without overselling, voted on weekly, and restocked by administrators.

---

## Table of Contents

1. [Architecture & Monorepo Structure](#monorepo-architecture)
2. [Prerequisites](#prerequisites)
3. [Setup & Installation](#quick-start)
4. [Demo Credentials & User Registration](#demo-credentials--registration)
5. [Database Schema & Integrity Constraints](#database-schema--integrity)
6. [Concurrency Handling Strategy](#concurrency-handling-strategy)
7. [Authentication & Authorization (RBAC)](#authentication--authorization-rbac)
8. [Comprehensive API Endpoints Reference](#api-endpoints-reference)
9. [Design Note: Decisions, Trade-offs & 100× Scale](#design-note-decisions-trade-offs--100x-scale)

---

## Monorepo Architecture

Snack Overflow is structured as an npm workspaces monorepo:

- [`apps/web`](apps/web): Modern Next.js 16 frontend (React 19, TypeScript, Tailwind CSS, App Router, Lucide icons, Canvas Confetti).
- [`apps/api`](apps/api): High-performance Express.js REST API (TypeScript, Prisma ORM, PostgreSQL, Zod validation, Server-Sent Events).
- [`docker-compose.yml`](docker-compose.yml): Multi-container orchestration providing PostgreSQL database, API, and Web services.

---

## Prerequisites

- **Node.js**: `>= 20.x` (tested on v24.13.0)
- **npm**: `>= 10.x` (tested on 11.6.2)
- **PostgreSQL**: `14+` running locally on port `5432` or via Docker Compose.

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/snack-overflow.git
cd SnackOverflow

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Files

Copy the provided example environment files:

```bash
# Root environment
cp .env.example .env

# Backend API environment
cp .env.example apps/api/.env
```

Ensure the database connection string in `.env` matches your PostgreSQL configuration:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/snackoverflow?schema=public"
JWT_SECRET="dev-super-secret-jwt-key-change-in-production"
PORT=4000
NODE_ENV=development
```

### 3. Database Migration & Seeding

Run Prisma migrations to set up the schema, composite indexes, and PostgreSQL check constraints, then seed initial snack and user records:

```bash
# Run migrations (directly from root)
npm run db:migrate

# Seed demo users (1 admin, 1 member) and sample snack inventory
npm run db:seed
```
*(Alternatively: `npm --workspace=apps/api run prisma:migrate` and `npm --workspace=apps/api run prisma:seed`)*

### 4. Run Development Servers

Run both services concurrently:

```bash
# Start backend API (http://localhost:4000)
npm run dev:api

# In a separate terminal, start frontend web app (http://localhost:3000)
npm run dev:web
```

### 5. Running via Docker Compose (Alternative)

To run the entire stack (Postgres, API, Web) in Docker:

```bash
docker-compose up --build
```

### 6. Test Suites & Verification

Snack Overflow includes an automated test suite covering unit, integration, authentication, RBAC, checkout, and concurrency tests:

```bash
# Run all vitest suites in the API package
npm --workspace=apps/api test

# Type-check all packages
npm run type-check

# Build both applications
npm run build
```

---

## Demo Credentials & Registration

### Pre-Seeded Development Accounts

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@snackoverflow.local` | `admin123` | Full access: snack CRUD, restocking, archiving, audit activity log, voting, consuming. |
| **Member** | `member@snackoverflow.local` | `member123` | Pantry browsing, consuming snacks (1–5 units), weekly voting, favorites, personal summary. |

### Registering a New User

New team members can register directly from the user interface or via the API:

1. **From the Login Screen**:
   - Navigate to `http://localhost:3000/login`.
   - Click the **Register** tab switch at the top of the card.
   - Enter your **Full Name**, **Email**, and **Password** (minimum 6 characters) and confirm the password.
   - Click **Create account**. You are immediately authenticated with an issued session cookie and redirected to the dashboard as an active `MEMBER`.
   - One-click demo buttons ("Use Admin demo" and "Use Member demo") remain available on the login tab for quick testing.

2. **Via REST API**:
   ```bash
   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Jordan Lee",
       "email": "jordan.lee@company.com",
       "password": "securePassword123"
     }'
   ```
   *Returns `201 Created` with user payload and sets an `access_token` HttpOnly cookie.*

---

## Database Schema & Integrity

Snack Overflow uses PostgreSQL with Prisma ORM. The relational schema is structured as follows:

```
┌──────────────┐          ┌──────────────┐          ┌────────────────┐
│     User     │───1:N───<│     Vote     │>───N:1───│     Snack      │
└──────────────┘          └──────────────┘          └────────────────┘
       │                         │                           │
      1:N                       1:N                         1:N
       │                         │                           │
       v                         v                           v
┌──────────────┐          ┌──────────────┐          ┌────────────────┐
│   Favorite   │          │   Activity   │          │ (Soft Delete)  │
└──────────────┘          └──────────────┘          │  archivedAt    │
                                                    └────────────────┘
```

### Prisma Models & Fields

- **User**:
  - `id`: UUID (Primary Key)
  - `name`: String (2–100 chars)
  - `email`: String (Unique, normalized lowercase)
  - `password`: String (bcrypt hash, 10 rounds)
  - `role`: Enum (`ADMIN`, `MEMBER`), defaults to `MEMBER`
  - `createdAt`, `updatedAt`: Timestamps

- **Snack**:
  - `id`: UUID (Primary Key)
  - `name`: String (Unique)
  - `category`: Enum (`SWEET`, `SAVOURY`, `DRINK`, `HEALTHY_ISH`)
  - `quantity`: Integer (Default 0, constrained $\ge 0$)
  - `lowStockThreshold`: Integer (Default 5, constrained $\ge 0$)
  - `calories`: Optional Integer
  - `imageUrl`: Optional String
  - `images`: Array of Strings (Multiple product photo angles)
  - `archivedAt`: Optional Timestamp (Enables soft-delete while preserving activity/voting history)
  - `createdAt`, `updatedAt`: Timestamps

- **Vote**:
  - `id`: UUID (Primary Key)
  - `userId`, `snackId`: Foreign keys with `onDelete: Cascade`
  - `createdAt`: Timestamp
  - **Composite Constraint**: `@@unique([userId, snackId])` guarantees that a user cannot vote twice for the same snack.

- **Favorite**:
  - `id`: UUID (Primary Key)
  - `userId`, `snackId`: Foreign keys with `onDelete: Cascade`
  - `createdAt`: Timestamp
  - **Composite Constraint**: `@@unique([userId, snackId])`

- **Activity** (Audit Log):
  - `id`: UUID (Primary Key)
  - `userId`, `snackId`: Foreign keys
  - `action`: Enum (`CONSUMED`, `RESTOCKED`)
  - `amount`: Integer (constrained $> 0$)
  - `createdAt`: Timestamp
  - **Indexes**: Composite indexes on `[snackId, createdAt]`, `[userId, createdAt]`, and `[snackId, action, createdAt]`.

### PostgreSQL Database-Level Check Constraints

In addition to application validation, check constraints are enforced directly in PostgreSQL to prevent data corruption:

```sql
ALTER TABLE "Snack" ADD CONSTRAINT "snack_quantity_nonnegative" CHECK ("quantity" >= 0);
ALTER TABLE "Snack" ADD CONSTRAINT "snack_threshold_nonnegative" CHECK ("lowStockThreshold" >= 0);
ALTER TABLE "Activity" ADD CONSTRAINT "activity_amount_positive" CHECK ("amount" > 0);
```

---

## Concurrency Handling Strategy

Handling concurrent pantry operations (e.g. multiple colleagues claiming the final packet of chips at the exact same millisecond) is a central design challenge.

### 1. The Race Condition Danger: Read-Then-Write

A naive implementation reads the current stock into memory (`SELECT quantity`), validates `quantity >= amount` in Node.js, and updates `quantity = quantity - amount`. Under concurrent traffic:

```
Client A: Read stock = 1  ──> Validates (1 >= 1)  ───────> Write stock = 0
Client B: Read stock = 1  ──> Validates (1 >= 1)  ───────> Write stock = -1  💥 (Oversold!)
```

### 2. The Solution: Database-Level Conditional Update

Snack Overflow prevents race conditions by pushing the inventory decrement down into a single atomic SQL statement executed within an explicit database transaction (`prisma.$transaction`):

```sql
UPDATE "Snack"
SET "quantity" = "quantity" - $1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $2
  AND "archivedAt" IS NULL
  AND "quantity" >= $1
RETURNING "id", "name", "category", "quantity", "lowStockThreshold";
```

- **Atomicity & Row Locks**: PostgreSQL evaluates the `WHERE quantity >= $1` predicate during the update operation under an exclusive row-level write lock. Only the request that acquires the lock when stock is sufficient succeeds.
- **Conflict Classification**: If zero rows are returned, the service determines whether the snack was missing/archived (`404 NOT_FOUND`) or depleted (`409 INSUFFICIENT_STOCK`).
- **Transactional Audit Log**: If the update succeeds, the corresponding `Activity` audit row is written inside the identical database transaction. If either operation fails, the transaction rolls back completely.
- **Database CHECK Constraint Defense-in-Depth**: `CHECK ("quantity" >= 0)` guarantees that even if application logic were bypassed, PostgreSQL rejects negative quantities at the engine level.

### 3. Duplicate Vote Concurrency

When users toggle votes concurrently, a unique composite index `(userId, snackId)` in PostgreSQL guarantees that only one vote can be recorded. If a duplicate request races, PostgreSQL throws code `P2002` (Unique Constraint Violation), which the service catches and translates into a clean `409 ALREADY_VOTED` HTTP response without server errors.

### 4. Idempotency Support for Cart Checkout

Network disconnects during checkout can prompt retries. Snack Overflow supports an `Idempotency-Key` header on checkout. Requests with an existing key return cached responses, preventing duplicate item consumption.

### 5. Automated Concurrency Test Proof

Verified via automated test in `apps/api/tests/consumption.test.ts`:
- **Scenario**: 1 snack item with `quantity = 3`.
- **Load**: 10 simultaneous concurrent HTTP requests each requesting `amount = 1`.
- **Verification**: Exactly 3 requests succeed (`200 OK`), exactly 7 receive `409 Conflict (INSUFFICIENT_STOCK)`, final stock is exactly `0`, and exactly 3 `CONSUMED` records exist in `Activity`.

---

## Authentication & Authorization (RBAC)

### Session Management

- **Storage**: JWT tokens are signed using `HS256` and transmitted in secure `HttpOnly`, `SameSite=lax` cookies (`access_token`).
- **Security**: Because tokens are not stored in browser `localStorage` or `sessionStorage`, they cannot be exfiltrated via Cross-Site Scripting (XSS) vectors.
- **Session Expiry**: Tokens are valid for 7 days.
- **Session Restoration**: The frontend invokes `GET /api/auth/me` on initial render to hydrate the authenticated user state.

### Role-Based Access Control (RBAC)

Two distinct roles are enforced:
1. **`MEMBER`**:
   - Access dashboard, inventory catalog, favorites.
   - Consume snacks (1 to 5 units per request).
   - Cast/toggle weekly snack votes.
   - Stream real-time inventory updates via SSE (`/api/events`).
2. **`ADMIN`**:
   - All `MEMBER` privileges.
   - Create new snacks (`POST /api/snacks`).
   - Edit snack name, category, calories, and low-stock threshold (`PATCH /api/snacks/:id`).
   - Restock snack inventory (`POST /api/snacks/:id/restock`).
   - Soft-delete / archive snacks (`DELETE /api/snacks/:id`).
   - Upload snack photography (`POST /api/upload`).
   - Inspect the global paginated audit activity log (`GET /api/activity`).

### Middleware Enforcement

Every protected API route passes through two Express middlewares:
1. `authenticate`: Verifies the cookie JWT, checks user existence in PostgreSQL, and attaches `req.user`.
2. `authorize(['ADMIN'])`: Rejects non-admin users with `403 FORBIDDEN` and an explicit error message (`Admin access required`).

---

## API Endpoints Reference

All API responses follow a consistent contract. Errors return `{ "error": { "code": "STRING", "message": "STRING" } }`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create new user account (`name`, `email`, `password`), sets session cookie. |
| `POST` | `/api/auth/login` | Public | Authenticate with `email` and `password`, sets session cookie. |
| `GET` | `/api/auth/me` | User | Retrieve current user profile `{ id, name, email, role }`. |
| `POST` | `/api/auth/logout` | User | Clear session cookie. |

### Snacks & Inventory

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/snacks` | User | List snacks with search, category filter, status filter, and sorting. |
| `GET` | `/api/snacks/summary` | User | Dashboard metrics: total snacks, low stock count, out of stock count, Snack of the Week. |
| `GET` | `/api/snacks/:id` | User | Retrieve details for a single snack. |
| `POST` | `/api/snacks/:id/consume` | User | Consume 1–5 packets (atomic conditional SQL). |
| `POST` | `/api/snacks/:id/vote` | User | Cast or toggle weekly vote. |
| `POST` | `/api/snacks/:id/favorite` | User | Toggle snack in user favorites. |
| `POST` | `/api/snacks/checkout` | User | Multi-item atomic cart checkout with optional `Idempotency-Key`. |
| `POST` | `/api/snacks` | Admin | Create a new snack item. |
| `PATCH` | `/api/snacks/:id` | Admin | Update snack metadata (name, category, threshold, calories, images). |
| `POST` | `/api/snacks/:id/restock` | Admin | Restock quantity by `amount`. |
| `DELETE` | `/api/snacks/:id` | Admin | Soft-delete/archive snack (`archivedAt = now()`). |

### Audit & System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/activity` | Admin | Paginated audit log of all `CONSUMED` and `RESTOCKED` events. |
| `POST` | `/api/upload` | Admin | Upload product images (`multipart/form-data`). |
| `GET` | `/api/events` | User | Server-Sent Events (SSE) stream for real-time inventory and voting updates. |

---

## Design Note: Decisions, Trade-offs & 100× Scale

### Key Architectural Decisions

1. **Conditional SQL over Pessimistic Row Locking (`SELECT ... FOR UPDATE`)**:
   - *Rationale*: Pessimistic row locking holds database connections open across network and application latency, creating lock queues and risking deadlocks under spikes.
   - *Advantage*: An atomic conditional `UPDATE ... WHERE quantity >= amount` executes in microseconds, guarantees strict consistency, and yields superior concurrency throughput.

2. **Soft Deletion (`archivedAt`) instead of Hard Deletions**:
   - *Rationale*: Deleting a snack row would orphan or require cascading deletion of historical consumption audits and vote tallies. Soft-deleting marks `archivedAt = NOW()`, preserving full relational integrity for analytics while filtering archived items from the active pantry.

3. **Server-Sent Events (SSE) over Full WebSockets**:
   - *Rationale*: The office pantry requires unidirectional real-time updates (stock counts, low stock alerts, weekly vote shifts) pushed from server to client.
   - *Advantage*: SSE operates natively over HTTP/2, automatically handles reconnects, works cleanly with corporate firewalls, and requires significantly less server state than bidirectional WebSockets.

4. **URL Query State as Single Source of Truth for Catalog Filtering**:
   - *Rationale*: Filters (`search`, `category`, `status`, `sort`) are reflected in the URL query string. Users can share links, refresh without losing state, and use native browser back/forward buttons seamlessly.

---

### Trade-offs Made

- **HttpOnly Cookies vs. Authorization Bearer Headers**:
  - *Trade-off*: HttpOnly cookies require careful CORS/cookie configuration (`sameSite=lax`, `credentials: 'include'`). However, this protects tokens against browser-based XSS token theft compared to storing JWTs in `localStorage`.
- **Synchronous Relational Transactions vs. Eventual Consistency**:
  - *Trade-off*: Wrapping stock updates and activity insertions inside `prisma.$transaction` incurs slight write overhead compared to an asynchronous message queue. However, for office pantry inventory, absolute consistency is preferred over eventual consistency to prevent overselling.

---

### What Would Break First at 100× the Users (e.g. 100,000+ Active Employees)

If Snack Overflow scaled by two orders of magnitude across large enterprise campuses, the following bottlenecks would emerge:

#### 1. High-Contention Row Hotspots on Viral Snacks
- **Failure Mode**: When fresh snacks are announced (e.g., 200 packets of a coveted snack arrive), thousands of simultaneous `UPDATE "Snack" WHERE id = :id` queries contend for the exact same database row lock. PostgreSQL connection queues saturate, increasing database query latency.
- **Solution & Mitigation**:
  - **In-Memory Token Bucket in Redis**: Move fast inventory decrements to Redis via an atomic Lua script (`EVAL "if redis.call('get', KEYS[1]) >= ARGV[1] then return redis.call('decrby', KEYS[1], ARGV[1]) else return -1 end"`).
  - **Asynchronous Ledger Drain**: Successful Redis decrements emit an event to a Kafka/RabbitMQ queue, where background workers batch-write `Activity` records and synchronize PostgreSQL in micro-batches (e.g. every 1 second).

#### 2. "Snack of the Week" Aggregate Query Overhead
- **Failure Mode**: Calculating weekly votes via `SELECT snackId, COUNT(*) FROM Vote WHERE createdAt >= :monday GROUP BY snackId` on every summary request becomes expensive with hundreds of thousands of vote rows.
- **Solution & Mitigation**:
  - **Redis Sorted Sets (ZSET)**: Maintain the current week's leaderboard in Redis (`ZINCRBY leaderboard:2026-W46 1 :snackId`). Reading the top snack is an $O(1)$ `ZREVRANGE leaderboard:2026-W46 0 0 WITHSCORES` operation.
  - **Materialized View**: Alternatively, maintain a PostgreSQL materialized view refreshed periodically via `pg_cron`.

#### 3. Database Connection Pool Exhaustion
- **Failure Mode**: Each Node.js API instance maintains a Prisma connection pool. Under horizontal scaling across 50 server instances, direct database connections exceed PostgreSQL's `max_connections` limit.
- **Solution & Mitigation**:
  - Deploy **PgBouncer** in transaction pooling mode between the API instances and PostgreSQL.
  - Read-heavy queries (`GET /api/snacks`, `GET /api/snacks/summary`) route to read replicas, reserving the primary database instance exclusively for write transactions.

#### 4. SSE Server Connection Limits & Cross-Instance Broadcasting
- **Failure Mode**: SSE connections hold open HTTP connections. A single Node.js process reaches socket limits (~10,000 file descriptors). Furthermore, stock changes on Server Instance A would not be broadcast to clients connected to Server Instance B.
- **Solution & Mitigation**:
  - Introduce **Redis Pub/Sub**: When stock changes on any API instance, publish to a Redis `inventory:updates` channel. All API instances subscribe and broadcast to their respective local client connections.
  - Offload real-time connections to an edge proxy or managed service (e.g. Cloudflare Durable Objects or AWS API Gateway HTTP SSE).

#### 5. Local File Upload Storage
- **Failure Mode**: Currently, uploaded snack images are saved to local disk (`apps/api/public/uploads`). In a multi-instance container cluster, images saved on Container 1 will 404 when requested through Container 2.
- **Solution & Mitigation**:
  - Transition file uploads to S3-compatible cloud object storage (AWS S3, Google Cloud Storage, or Cloudflare R2) backed by a global CDN (Cloudflare / CloudFront) with pre-signed upload URLs.
