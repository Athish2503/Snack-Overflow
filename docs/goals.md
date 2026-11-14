# Snack Overflow — Goals and Definition of Done

## Project purpose

Build a production-minded office pantry tracker that lets employees see snack availability, consume stock, vote for favourites, and lets admins manage pantry inventory.

The central engineering problem is **correctness when multiple people act at the same time**. A visually polished app with broken inventory logic does not meet the assignment.

## Primary goals

### G1. Correct inventory
- Stock quantity is always an integer greater than or equal to zero.
- Members can consume a positive amount only when sufficient stock exists.
- Concurrent consumption is handled atomically at the database level.
- A failed consume request returns HTTP 409 with a useful message.
- Every successful consume/restock creates exactly one activity record in the same transaction as the stock update.

### G2. Real role-based access control
- Seeded users can log in.
- Passwords are stored only as secure hashes.
- There are exactly two roles: `ADMIN` and `MEMBER`.
- Both roles can view, consume, and vote.
- Only admins can create, edit, delete, and restock snacks.
- Authorization is enforced by backend middleware/service logic, not merely by hiding frontend controls.

### G3. Reliable voting
- A user can vote for a snack once.
- A user can remove their vote.
- Duplicate votes are prevented by a database unique constraint, including concurrent attempts.
- Vote counts and the current user's vote state are reflected in the UI.

### G4. Useful pantry experience
- Users can log in and see a dashboard.
- Dashboard displays summary counts and Snack of the Week.
- Snack list supports server-side search, category filter, status filter, and pagination.
- Low-stock and out-of-stock items are visually distinct.
- Users can consume and vote from the interface.
- Admins can add, edit, restock, and delete/archive snacks.
- UI includes loading, empty, error, and action-rejection states.
- Layout works on mobile and desktop.

### G5. Maintainable and explainable implementation
- Code is organized into clear frontend, backend, and database layers.
- API responses and errors follow a consistent contract.
- Critical paths have automated tests.
- Seed script creates sample snacks, one admin, and one member.
- README explains setup, demo credentials, endpoints, schema, authorization, and concurrency handling.
- Design note explains trade-offs and likely bottlenecks at 100x usage.

## Mandatory acceptance criteria

The project is not complete until all of these are true:

- [ ] Admin and member demo accounts can log in.
- [ ] Password hashes, not plain passwords, are stored in PostgreSQL.
- [ ] Member cannot create, edit, delete, or restock through direct API calls.
- [ ] Admin can create, edit, delete/archive, and restock snacks.
- [ ] Both roles can view, consume, and vote.
- [ ] Snack list filtering, search, and pagination execute on the server.
- [ ] Status is derived correctly:
  - `stocked`: quantity > low_stock_threshold
  - `running_low`: quantity from 1 through low_stock_threshold
  - `gone`: quantity = 0
- [ ] Quantity cannot become negative.
- [ ] Ten simultaneous requests attempting to consume the last three units result in exactly three successes and seven 409 responses, when each request consumes one unit.
- [ ] The concurrency test confirms final quantity is zero and exactly three consume activity rows exist.
- [ ] Duplicate concurrent votes cannot create duplicate rows.
- [ ] Consume and restock activity records are transactionally consistent with inventory changes.
- [ ] API errors use the agreed JSON error shape.
- [ ] Automated tests cover auth, RBAC, stock, votes, filters, and concurrency.
- [ ] Seed script is repeatable or safely handles existing seed data.
- [ ] README setup instructions work from a clean checkout.
- [ ] Production build succeeds for frontend and backend.

## Priority order

| Priority | Meaning | Examples |
|---|---|---|
| P0 | Must work; blocks submission | Atomic stock, RBAC, auth, vote uniqueness, transactional activity |
| P1 | Required product behavior | API filters, dashboard, snack list, admin CRUD, validation, tests |
| P2 | Submission quality | Responsive polish, README, design note, recording |
| P3 | Bonus only | Docker Compose, activity page, optimistic UI, real-time updates, idempotency, CI, deployment |

## Explicit non-goals

Do not spend time on these before mandatory criteria pass:
- Multi-company or multi-tenant support.
- Complex configurable roles and permissions.
- Billing, payments, or employee management.
- AI recommendations.
- Real-time updates.
- Mobile native app.
- Microservices.
- Production-scale distributed caching.

## Definition of success

A reviewer can clone the public repository, follow the README, seed the database, log in as either role, verify role restrictions, use the pantry features, and run a test that proves concurrent consumption cannot oversell stock.

The candidate can explain the atomic SQL operation, transaction boundary, unique vote constraint, authorization flow, and main trade-offs without relying on the coding assistant.
