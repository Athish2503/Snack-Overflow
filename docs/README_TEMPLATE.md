# Snack Overflow

A full-stack office pantry tracker built for the Bipolar Factory Full Stack Intern Round 2 assignment.

## Features
- Role-based admin/member access
- Pantry dashboard and snack list
- Server-side search, filters, and pagination
- Atomic stock consumption and restocking
- One vote per user per snack
- Transactional activity history

## Tech stack
- Next.js + React + TypeScript
- Express + TypeScript
- PostgreSQL + Prisma
- Zod
- TanStack Query
- Vitest + Supertest

## Prerequisites
Document exact versions of Node.js, npm, and PostgreSQL/Docker used by this project.

## Setup
Add verified commands for:
1. Clone repository.
2. Install dependencies.
3. Copy `.env.example` to `.env`.
4. Configure database URL and secrets.
5. Start PostgreSQL.
6. Run migrations.
7. Seed demo data.
8. Start API and frontend.

Do not publish real production secrets. Demo credentials should be development-only.

## Demo credentials
| Role | Email | Password |
|---|---|---|
| Admin | Add seeded admin email | Add development-only password |
| Member | Add seeded member email | Add development-only password |

## API endpoints
Link to or summarize `api-contract.md`.

## Database schema
Explain User, Snack, Vote, Activity, key constraints, indexes, and derived status.

## Concurrency strategy
Explain the conditional SQL update, why a read-then-write check is unsafe, how the transaction includes the activity insert, and the result of the required 10-request/3-unit test.

## Authorization
Explain authentication middleware, admin middleware, role source, and protected operations.

## Tests
List exact commands and describe the concurrency test. State that concurrency tests run against PostgreSQL.

## Design decisions and trade-offs
Explain Snack of the Week calculation, soft deletion choice, session strategy, and what would become a bottleneck at 100x.

## Screenshots / demo
Add screenshots and a 3–5 minute recording link if available.

## Known limitations
Be honest about features not implemented. Do not list unfinished bonus features as completed.
