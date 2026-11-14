# Coding Assistant Instructions

You are implementing **Snack Overflow**, a production-minded office pantry tracker for the Bipolar Factory Round 2 Full Stack Intern assignment.

## 1. Primary objective

Build a correct, secure, tested full-stack application. Prioritize data integrity and server-side authorization over visual polish or bonus features.

The assignment explicitly evaluates:
- Correctness under concurrent consumption.
- Database-enforced one-vote-per-user-per-snack.
- Hashed passwords and server-side authorization.
- Validated inputs and a consistent API error contract.
- Activity records written in the same transaction as stock changes.
- Automated critical-path tests, including a concurrency test.
- Role-aware, responsive UI with proper loading, empty, and error states.

## 2. Agreed stack

Use this stack unless the repository already contains a deliberate, working equivalent:
- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend: Node.js, Express, TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- Validation: Zod.
- Frontend data fetching/cache: TanStack Query.
- Tests: Vitest and Supertest.
- Local infrastructure: Docker Compose where practical.

Do not introduce a second backend, second ORM, or unnecessary state-management library.

## 3. Work process

1. Read `goals.md`, `task.md`, `architecture.md`, `api-contract.md`, `database.md`, `testing.md`, and `decisions.md` before making changes.
2. Inspect the existing repository before creating or overwriting files.
3. Identify the current phase in `task.md`.
4. Work on the highest-priority incomplete task only.
5. Implement in small, coherent changes.
6. Run relevant tests, lint, type-check, and build commands after changes.
7. Update task checkboxes only when the work is actually complete and verified.
8. Report changed files, commands run, results, and remaining issues after each phase.

## 4. Non-negotiable engineering rules

### Stock consumption
- Never implement consumption as a read-then-write sequence in application memory.
- Use a conditional atomic database update that decrements only when sufficient stock exists.
- If the update affects zero rows, return a clear 409 for insufficient stock, or 404 if the snack does not exist/is archived.
- Insert the `CONSUMED` activity record in the same database transaction as the stock update.
- Quantity must never become negative, including under concurrent requests.
- Validate `amount` as a positive integer.

### Restocking
- Restock must be admin-only on the server.
- Increment stock atomically.
- Insert the `RESTOCKED` activity record in the same transaction.
- Validate amount as a positive integer.

### Voting
- Enforce one vote per user per snack with a database composite unique constraint.
- Do not rely only on a prior application-level lookup.
- Translate duplicate-vote conflicts into a consistent 409 response.

### Authentication and authorization
- Hash passwords using Argon2id or bcrypt. Never store plain-text passwords.
- Protect every private route on the server.
- Read role from the verified authenticated user, not from request payloads or client state.
- Only `ADMIN` can create, edit, delete, and restock snacks.
- Both `ADMIN` and `MEMBER` can view snacks, consume, and vote.
- Hiding admin buttons in the frontend is UX, not security.
- Prefer an HttpOnly cookie for session/JWT storage. Do not put long-lived auth tokens in localStorage.

### Data integrity
- Status is derived from quantity and threshold. Do not persist a separate status field.
- Add database constraints for non-negative quantity and threshold, and positive activity amount.
- Do not delete activity history when a snack is removed. Prefer soft archive and document the behavior.
- Use database transactions for multi-write business operations.

### API behavior
- Use the error format:
  `{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }`
- Use appropriate HTTP codes: 400, 401, 403, 404, 409, and 500.
- Validate path params, query params, and request bodies.
- Do not leak stack traces, SQL, secrets, password hashes, or internal error details to clients.

## 5. Scope discipline

Do not start bonus work until all mandatory acceptance criteria in `goals.md` are met and tested.

Do not add:
- Microservices.
- Redis or queues.
- WebSockets/SSE.
- Complex permission frameworks.
- Signup unless the required app is already complete.
- Premature caching or elaborate abstractions.

If a requirement is ambiguous, make the smallest reasonable assumption, record it in `decisions.md`, and keep implementation consistent.

## 6. Code quality

- Use TypeScript types; avoid `any` unless there is a documented reason.
- Keep route handlers thin. Put business logic in service modules.
- Keep database access out of React components.
- Reuse shared validation schemas and API error utilities.
- Use clear names and small functions.
- Avoid duplicated business rules.
- Do not silently swallow errors.
- Do not add dependencies for functionality already available in the stack.

## 7. Completion report

At the end of each phase, report:
- What was implemented.
- Important files created/changed.
- Tests and checks executed, with pass/fail results.
- Any known limitations.
- Which `task.md` items were marked complete.
- The next recommended task.

Never claim a task is complete if it has not been run and verified.
