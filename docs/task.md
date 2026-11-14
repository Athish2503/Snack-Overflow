# Snack Overflow — Implementation Tasks

**Working deadline:** Monday, 16 November 2026  
**Priority rule:** Finish all P0 and P1 tasks before touching P3 bonus work.

Use this file as the source of truth for implementation progress. Mark a checkbox complete only after the code is implemented and verified.

## Phase 0 — Repository inspection and project setup

**Goal:** Understand the current repository and establish a reproducible development environment.

- [x] Inspect the existing repository and report current structure before changing anything.
- [x] Confirm Node.js/npm versions and available PostgreSQL setup.
- [x] Create or verify the monorepo structure:
  - `apps/web`
  - `apps/api`
  - shared configuration only where useful.
- [x] Configure TypeScript, linting, formatting, and environment variable loading.
- [x] Add root scripts for development, lint, type-check, test, and build.
- [x] Add `.gitignore` and `.env.example`.
- [x] Confirm real `.env` files and secrets are excluded from Git.
- [x] Add a concise root README placeholder with setup prerequisites.

**Exit criteria:** A clean checkout can install dependencies and run the chosen development commands.

## Phase 1 — Database foundation and seed data

**Priority:** P0

- [x] Configure PostgreSQL connection.
- [x] Add Prisma and initialize schema/migrations.
- [x] Implement `User`, `Snack`, `Vote`, and `Activity` models.
- [x] Add enums for role, category, and activity action.
- [x] Add unique email constraint.
- [x] Add unique snack name constraint.
- [x] Add composite unique constraint on `(userId, snackId)` for votes.
- [x] Add indexes for common snack/activity queries.
- [x] Add database check constraints:
  - snack quantity >= 0
  - low stock threshold >= 0
  - activity amount > 0
- [x] Add `archivedAt` for soft deletion, if using the recommended archive approach.
- [x] Create migration and verify it applies from an empty database.
- [x] Create seed script with one admin, one member, and sample snacks.
- [x] Hash seed passwords; never store plain-text passwords.
- [x] Document demo credentials in README using development-only credentials.

**Exit criteria:** Database migrations and seed work from a clean database; constraints are visible in PostgreSQL.

## Phase 2 — API foundation, authentication, and authorization

**Priority:** P0

- [x] Create Express application and route structure.
- [x] Add centralized error classes/handler.
- [x] Add Zod validation middleware/helpers.
- [x] Implement password verification.
- [x] Implement `POST /auth/login`.
- [x] Implement `GET /auth/me` to restore the current session.
- [x] Implement `POST /auth/logout`.
- [x] Configure secure HttpOnly cookie or another documented secure session strategy.
- [x] Implement authentication middleware.
- [x] Implement `requireAdmin` middleware.
- [x] Ensure role is derived from the authenticated user, never the request body.
- [x] Verify protected routes return 401 when unauthenticated.
- [x] Verify member receives 403 on admin-only routes.
- [x] Add basic auth and RBAC tests.

**Exit criteria:** Login works and direct API calls cannot bypass role restrictions.

## Phase 3 — Snack read APIs and derived status

**Priority:** P1

- [x] Implement `GET /snacks`.
- [x] Support server-side category filtering.
- [x] Support server-side status filtering.
- [x] Support case-insensitive name search.
- [x] Support pagination with validated page and limit.
- [x] Return pagination metadata.
- [x] Return derived status; do not store status in the database.
- [x] Return vote count and whether the current user has voted, where practical.
- [x] Implement `GET /snacks/:id`.
- [x] Implement `GET /snacks/summary`.
- [x] Implement status counts for stocked, running_low, and gone.
- [x] Implement and document the Snack of the Week rule.
- [x] Add tests for filters, search, pagination, status boundaries, and summary.

**Exit criteria:** API results are correct for all status boundaries and filters are executed by the server/database.

## Phase 4 — Inventory mutations and concurrency safety

**Priority:** P0, highest-risk phase

### Consume
- [ ] Implement `POST /snacks/:id/consume`.
- [ ] Validate amount as a positive integer.
- [ ] Use one conditional atomic database update:
  `UPDATE Snack SET quantity = quantity - amount WHERE id = snackId AND quantity >= amount RETURNING ...`
- [ ] Do not use a read-then-write check in application memory.
- [ ] Insert `CONSUMED` activity in the same transaction.
- [ ] Return 404 for missing/archived snack.
- [ ] Return 409 for insufficient stock.
- [ ] Ensure failed consumption creates no activity row.

### Restock
- [ ] Implement admin-only `POST /snacks/:id/restock`.
- [ ] Validate amount as a positive integer.
- [ ] Increment stock atomically.
- [ ] Insert `RESTOCKED` activity in the same transaction.
- [ ] Ensure failed restock creates no partial activity.

### Required concurrency proof
- [ ] Use a real PostgreSQL test database.
- [ ] Seed one snack with quantity 3.
- [ ] Send 10 simultaneous consume requests, each for amount 1.
- [ ] Assert exactly 3 requests succeed.
- [ ] Assert exactly 7 requests return 409.
- [ ] Assert final quantity is exactly 0.
- [ ] Assert exactly 3 `CONSUMED` activity rows exist.
- [ ] Add a test for concurrent consumes with varied amounts if time permits.
- [ ] Explain the database-level atomicity in README.

**Exit criteria:** Concurrency test passes repeatedly against PostgreSQL. This phase must not be skipped.

## Phase 5 — Voting and admin snack management

**Priority:** P1

### Voting
- [ ] Implement `POST /snacks/:id/vote`.
- [ ] Implement `DELETE /snacks/:id/vote`.
- [ ] Use the database composite unique constraint as the final duplicate-vote guard.
- [ ] Translate duplicate vote conflict into HTTP 409.
- [ ] Add tests for vote, unvote, duplicate vote, and concurrent duplicate vote.

### Admin CRUD
- [ ] Implement admin-only `POST /snacks`.
- [ ] Implement admin-only `PATCH /snacks/:id`.
- [ ] Implement admin-only `DELETE /snacks/:id`.
- [ ] Prefer soft archive so historical activity remains meaningful.
- [ ] Validate name, category, quantity, and threshold.
- [ ] Handle duplicate snack names consistently.
- [ ] Add tests for admin success and member rejection.

**Exit criteria:** All snack mutation APIs are protected and covered by tests.

## Phase 6 — Frontend foundation and authentication UI

**Priority:** P1

- [ ] Create shared layout, navigation, and responsive page shell.
- [ ] Create login page with validation and useful errors.
- [ ] Restore session using `/auth/me`.
- [ ] Implement logout.
- [ ] Implement role-aware navigation and controls.
- [ ] Add centralized API client with credentials configured correctly.
- [ ] Configure TanStack Query.
- [ ] Add reusable loading, empty, and error components.
- [ ] Ensure frontend does not treat client role state as authorization.

**Exit criteria:** Admin and member can log in and see the correct navigation/actions.

## Phase 7 — Dashboard and snack list

**Priority:** P1

- [ ] Build dashboard summary cards.
- [ ] Build Snack of the Week section.
- [ ] Build low-stock / gone section.
- [ ] Build snack list and snack cards.
- [ ] Connect category filter to API.
- [ ] Connect status filter to API.
- [ ] Connect search to API.
- [ ] Connect pagination to API.
- [ ] Make running-low and gone states visually obvious.
- [ ] Add consume action with amount input or a sensible default.
- [ ] Add vote/unvote action.
- [ ] Invalidate/refetch relevant queries after mutations.
- [ ] Show clear 409 feedback, e.g. “Someone beat you to the last packet!”
- [ ] Test responsive layout on phone-sized viewport.

**Exit criteria:** Member can use the complete read, consume, and vote flow.

## Phase 8 — Admin UI

**Priority:** P1

- [ ] Add snack creation form.
- [ ] Add edit form.
- [ ] Add restock action.
- [ ] Add delete/archive confirmation.
- [ ] Hide admin-only controls from members.
- [ ] Ensure backend still rejects member direct API calls.
- [ ] Show validation and server errors clearly.

**Exit criteria:** Admin can manage inventory from the UI; member cannot.

## Phase 9 — Integration, regression, and hardening

**Priority:** P0/P1

- [ ] Run all API tests against PostgreSQL.
- [ ] Run concurrency test more than once.
- [ ] Verify activity and stock changes remain transactionally consistent.
- [ ] Verify duplicate votes are impossible.
- [ ] Verify every protected route has authorization coverage.
- [ ] Verify all request inputs are validated.
- [ ] Verify error responses follow the shared contract.
- [ ] Verify no password hash or secret is returned by API.
- [ ] Verify no secret or `.env` is committed.
- [ ] Run lint and type-check.
- [ ] Run frontend and backend production builds.
- [ ] Fix console errors and obvious accessibility issues.
- [ ] Test mobile layout and empty/error/loading states.

**Exit criteria:** All mandatory acceptance criteria in `goals.md` pass.

## Phase 10 — Submission quality

**Priority:** P2

- [ ] Write complete README setup instructions.
- [ ] Document demo credentials.
- [ ] Document endpoints and example requests.
- [ ] Document schema and key constraints.
- [ ] Explain atomic consumption and transaction boundaries.
- [ ] Explain authentication and role authorization.
- [ ] Add design note: decisions, trade-offs, and what breaks first at 100x.
- [ ] Clean up meaningful Git commit history.
- [ ] Push to a public GitHub repository.
- [ ] Record a 3–5 minute demo.
- [ ] Verify the repository can be cloned and run from scratch.
- [ ] Prepare submission email with repository link and recording link.
- [ ] Submit before the corrected working deadline.

**Exit criteria:** A reviewer can run the app and understand the important engineering decisions without assistance.

## Phase 11 — Bonus work (only after all mandatory work passes)

**Priority:** P3

Choose only what can be completed and tested safely:
- [ ] Docker Compose for database, API, and frontend.
- [ ] Admin-only paginated activity page.
- [ ] Optimistic UI with rollback on failure.
- [ ] Server-side sorting by name, quantity, or votes.
- [ ] Idempotency-Key support for consume retries.
- [ ] CI pipeline for lint, type-check, tests, and build.
- [ ] Live deployment.
- [ ] WebSocket/SSE real-time updates.

Do not sacrifice correctness or submission readiness for bonus features.

## Suggested execution schedule

### Saturday, 14 November
- Phase 0
- Phase 1
- Phase 2
- Start Phase 3
- Start Phase 4 as soon as authentication and DB are ready

### Sunday, 15 November
- Finish Phase 3 and Phase 4
- Phase 5
- Phase 6
- Phase 7
- Start Phase 8

### Monday, 16 November
- Finish Phase 8
- Phase 9 regression and fixes
- Phase 10 README, demo, and submission
- Bonus only if every mandatory item is already complete

If time becomes tight, cut bonus work and decorative UI polish first. Never cut the concurrency proof, RBAC, or transactional activity logging.
