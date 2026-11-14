# API Contract — Snack Overflow

Base path may be `/api`; keep it consistent and document it.

All JSON errors use:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Someone beat you to the last packet!"
  }
}
```

## Authentication

### `POST /auth/login`
Public.

Request:
```json
{
  "email": "member@example.com",
  "password": "development-password"
}
```

Success: `200`, sets the configured session cookie and returns safe user fields:
```json
{
  "user": {
    "id": "uuid",
    "name": "Demo Member",
    "email": "member@example.com",
    "role": "MEMBER"
  }
}
```

### `GET /auth/me`
Authenticated. Returns the current safe user object.

### `POST /auth/logout`
Clears the session cookie and returns `204` or a documented success response.

## Snacks

### `GET /snacks`
Authenticated.

Query parameters:
- `page`: positive integer, default 1
- `limit`: positive integer with a sensible maximum, e.g. 20
- `search`: optional snack-name search
- `category`: `SWEET | SAVOURY | DRINK | HEALTHY_ISH`
- `status`: `stocked | running_low | gone`
- Optional `sortBy` and `sortOrder` only if implemented.

Example response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Masala Peanuts",
      "category": "SAVOURY",
      "quantity": 3,
      "lowStockThreshold": 5,
      "status": "running_low",
      "voteCount": 4,
      "hasVoted": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### `GET /snacks/:id`
Authenticated. Returns snack detail with derived status and vote information.

### `POST /snacks`
Admin only.

Example:
```json
{
  "name": "Masala Peanuts",
  "category": "SAVOURY",
  "quantity": 12,
  "lowStockThreshold": 5
}
```

Success: `201`.

### `PATCH /snacks/:id`
Admin only. Accept only editable fields. Validate all supplied fields.

### `DELETE /snacks/:id`
Admin only. Prefer soft archive to preserve activity history. Return a documented success response such as `204`.

## Inventory actions

### `POST /snacks/:id/consume`
Authenticated as either role.

Request:
```json
{
  "amount": 1
}
```

Success: `200` with updated snack quantity/status.

Insufficient stock: `409`:
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Someone beat you to the last packet!"
  }
}
```

The stock update and activity insert must occur in the same database transaction.

### `POST /snacks/:id/restock`
Admin only.

Request:
```json
{
  "amount": 10
}
```

Success: `200` with updated snack quantity/status. Stock update and activity insert must share one transaction.

## Votes

### `POST /snacks/:id/vote`
Authenticated as either role. Creates the current user's vote.

Duplicate vote: `409` with code `ALREADY_VOTED`.

### `DELETE /snacks/:id/vote`
Authenticated as either role. Removes the current user's vote. Define whether removing a non-existent vote is idempotent; recommended: return `204`.

## Summary

### `GET /snacks/summary`
Authenticated.

Suggested response:
```json
{
  "counts": {
    "stocked": 12,
    "running_low": 3,
    "gone": 2
  },
  "snackOfTheWeek": {
    "id": "uuid",
    "name": "Masala Peanuts",
    "voteCount": 8
  }
}
```

The Snack of the Week calculation is an implementation assumption because the assignment does not define its exact calculation. Document the chosen time window and tie-break rule in `decisions.md`.

## Status codes

| Code | Meaning |
|---|---|
| 200 | Successful read/update/action |
| 201 | Resource created |
| 204 | Successful action with no response body |
| 400 | Invalid input |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but role is not allowed |
| 404 | Resource not found |
| 409 | Conflict, insufficient stock, duplicate vote/name |
| 500 | Unexpected server error |

Do not expose internal stack traces or database errors to clients.
