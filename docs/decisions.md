# Design Decisions and Assumptions

Record decisions here as they are made. Keep this file honest: distinguish assignment requirements from implementation choices.

## Confirmed assignment requirements

- Roles are admin and member.
- User accounts may be seeded; signup is not required.
- Snack categories are sweet, savoury, drink, and healthy-ish.
- Quantity is an integer and must never be below zero.
- Low stock threshold defaults to 5.
- Status is derived, not stored.
- A user can vote once per snack.
- Activity records who, what, amount, and when.
- Activity actions include restocked and consumed.
- Consumption must be atomic at the database level.
- Vote uniqueness must be enforced in the schema.
- Consume/restock activity must be written in the same transaction as the stock change.
- Server-side authorization, validation, and consistent error responses are required.

## Implementation choices to confirm

### 1. Snack of the Week
The assignment asks for Snack of the Week but does not define its calculation.

Recommended assumption:
- Count votes created during the current Monday-to-Sunday week.
- Use Asia/Kolkata as the business timezone.
- Choose the snack with the most votes in that period.
- Use a deterministic tie-breaker, such as highest total lifetime votes and then alphabetical name.
- If there are no votes this week, show an empty-state message or a documented fallback.

Confirm and document the final rule in README.

### 2. Snack deletion
Recommended: soft archive using `archivedAt` to preserve activity history. Archived snacks disappear from normal lists and cannot be consumed/restocked.

### 3. Authentication
Recommended: HttpOnly cookie-based session/JWT. Document cookie, expiry, CORS, SameSite, Secure, and CSRF choices.

### 4. Consume amount
The endpoint accepts `{ "amount": positive integer }`. The UI may default to one unit, but the API must support validated amounts.

### 5. Error contract
Use:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### 6. Deadline discrepancy
The assignment PDF states Saturday, 14 November 2026 at 11:00 AM IST. The user has clarified that the working deadline to plan against is Monday, 16 November 2026. Treat Monday as the user's updated deadline, but verify the actual submission arrangement with the contact if there is any uncertainty.

## Trade-offs to explain in README

- Why a modular monolith instead of microservices.
- Why PostgreSQL and relational constraints.
- How conditional atomic update prevents overselling.
- Why transactionally inserting activity matters.
- Why database uniqueness is necessary for votes.
- Why authorization is enforced on the server.
- Why status is derived instead of stored.
- What becomes a bottleneck at 100x:
  - database connection pool and write contention on popular snacks
  - expensive vote aggregation and summary queries
  - pagination and indexes for larger snack/activity tables
  - API horizontal scaling and session strategy
  - observability, backups, and operational monitoring

Do not claim the app is production-scalable at 100x without measurements. Describe likely bottlenecks and a sensible next step for each.
