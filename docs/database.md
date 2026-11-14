# Database Design — Snack Overflow

Use PostgreSQL as the source of truth. Prisma is the application ORM, but database constraints remain essential for correctness.

## Entities

### User
- `id`: generated UUID
- `name`: required
- `email`: required, unique
- `password`: secure password hash only
- `role`: `ADMIN` or `MEMBER`
- timestamps

### Snack
- `id`: generated UUID
- `name`: required, unique
- `category`: `SWEET`, `SAVOURY`, `DRINK`, `HEALTHY_ISH`
- `quantity`: integer, default 0, never negative
- `lowStockThreshold`: integer, default 5, never negative
- `archivedAt`: nullable timestamp if using soft deletion
- timestamps

### Vote
- `id`
- `userId`
- `snackId`
- `createdAt`
- Composite unique constraint on `(userId, snackId)`.

### Activity
- `id`
- `userId`
- `snackId`
- `action`: `CONSUMED` or `RESTOCKED`
- `amount`: positive integer
- `createdAt`

## Required database constraints

- Unique user email.
- Unique snack name.
- Unique vote pair `(userId, snackId)`.
- Check `Snack.quantity >= 0`.
- Check `Snack.lowStockThreshold >= 0`.
- Check `Activity.amount > 0`.
- Foreign keys from Vote and Activity to User and Snack.

Add SQL check constraints in a Prisma migration if they are not represented directly in the Prisma schema.

## Derived status

Do not store status as a column. Derive it:

```ts
function getSnackStatus(quantity: number, threshold: number) {
  if (quantity === 0) return "gone";
  if (quantity <= threshold) return "running_low";
  return "stocked";
}
```

Boundary examples:
- quantity 0, threshold 5 -> gone
- quantity 1, threshold 5 -> running_low
- quantity 5, threshold 5 -> running_low
- quantity 6, threshold 5 -> stocked

## Atomic consumption

Do not:
1. Read quantity into application memory.
2. Check quantity.
3. Update quantity in a separate query.

That sequence can oversell stock when requests overlap.

Use a conditional update:

```sql
UPDATE "Snack"
SET "quantity" = "quantity" - $1
WHERE "id" = $2
  AND "quantity" >= $1
  AND "archivedAt" IS NULL
RETURNING "id", "quantity";
```

Execute the update and activity insert in one transaction. If no row is returned, determine whether the snack is missing/archived (404) or stock is insufficient (409). A database check constraint provides a second line of defense.

## Atomic restock

Increment the quantity in the database, then insert the `RESTOCKED` activity row in the same transaction. Validate the amount before executing.

## Voting

The application may attempt to create a vote directly. The database unique constraint handles concurrent duplicate requests. Convert the unique-constraint conflict to a 409 response.

## Activity integrity

For successful consume/restock:
- The stock change and activity insert commit together.
- If activity insertion fails, the stock change must roll back.
- If stock update fails, no activity row should be inserted.

## Deletion strategy

Recommended: soft archive snacks with `archivedAt` so historical activity remains meaningful. Exclude archived snacks from normal list/detail/mutation queries. Explain this choice in README.

If using hard deletion instead, explicitly define foreign-key behavior and preserve the required activity history appropriately.
