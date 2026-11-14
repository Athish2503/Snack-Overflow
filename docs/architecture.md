# SNACK OVERFLOW
# Technical Implementation Blueprint

**Architecture:** TypeScript Monorepo  
**Frontend:** Next.js + React  
**Backend:** Express.js  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Validation:** Zod  
**Testing:** Vitest + Supertest  
**Styling:** Tailwind CSS + shadcn/ui

---

# 1. System Architecture

## 1.1 Architecture Overview

The application will have three main components:

1. Next.js frontend: handles the user interface and client interactions.
2. Express API: handles authentication, authorization, business logic, validation and data operations.
3. PostgreSQL: stores users, snacks, votes and activity records.

```text
                   USERS
                     |
                     v
              NEXT.JS FRONTEND
                     |
              HTTP / JSON API
                     |
                     v
               EXPRESS API
                     |
          +----------+----------+
          |          |          |
          v          v          v
       AUTH       RBAC       SERVICES
          |          |          |
          +----------+----------+
                     |
                     v
                 PRISMA ORM
                     |
                     v
                POSTGRESQL
                     |
          +----------+----------+
          |          |          |
          v          v          v
        USERS      SNACKS     VOTES
                                |
                                v
                             ACTIVITY
```

## 1.2 Request Flow

Example: A member consumes two packets of chips.

1. User clicks Consume.
2. Frontend sends `POST /api/snacks/:id/consume`.
3. Express authentication middleware validates the session.
4. Request validation checks the amount.
5. Controller calls the snack service.
6. Service executes an atomic database update.
7. If stock is sufficient, the service creates an activity record in the same transaction.
8. API returns the updated quantity.
9. Frontend updates the snack card and displays a success notification.

If insufficient stock exists, the API returns HTTP 409 without changing the inventory or creating an activity record.

---

# 2. Repository Structure

Use a monorepo with two applications.

```text
snack-overflow/
│
├── apps/
│   │
│   ├── web/
│   │   ├── public/
│   │   │
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── snacks/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── snacks/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── activities/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   │
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── snacks/
│   │   │   │   ├── admin/
│   │   │   │   ├── forms/
│   │   │   │   └── ui/
│   │   │   │
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── providers/
│   │   │   └── types/
│   │   │
│   │   └── package.json
│   │
│   └── api/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       │
│       ├── src/
│       │   ├── config/
│       │   │   ├── env.ts
│       │   │   └── database.ts
│       │   │
│       │   ├── middleware/
│       │   │   ├── authenticate.ts
│       │   │   ├── authorize.ts
│       │   │   ├── validate.ts
│       │   │   ├── errorHandler.ts
│       │   │   └── notFound.ts
│       │   │
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── auth.schema.ts
│       │   │   │
│       │   │   ├── snacks/
│       │   │   │   ├── snack.routes.ts
│       │   │   │   ├── snack.controller.ts
│       │   │   │   ├── snack.service.ts
│       │   │   │   └── snack.schema.ts
│       │   │   │
│       │   │   ├── votes/
│       │   │   │   ├── vote.routes.ts
│       │   │   │   └── vote.service.ts
│       │   │   │
│       │   │   ├── activities/
│       │   │   │   ├── activity.routes.ts
│       │   │   │   └── activity.service.ts
│       │   │   │
│       │   │   └── dashboard/
│       │   │       ├── dashboard.routes.ts
│       │   │       └── dashboard.service.ts
│       │   │
│       │   ├── utils/
│       │   │   ├── ApiError.ts
│       │   │   ├── asyncHandler.ts
│       │   │   └── pagination.ts
│       │   │
│       │   ├── app.ts
│       │   └── server.ts
│       │
│       ├── tests/
│       │   ├── auth.test.ts
│       │   ├── authorization.test.ts
│       │   ├── snacks.test.ts
│       │   ├── consumption.test.ts
│       │   ├── concurrency.test.ts
│       │   └── voting.test.ts
│       │
│       └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Architecture rules

- Routes define URLs and attach middleware.
- Controllers handle HTTP request and response logic.
- Services contain business logic.
- Prisma handles database access.
- Middleware handles authentication, authorization and validation.
- Frontend components should not contain business rules that belong on the server.

Do not put all the logic into route handlers. That becomes difficult to test and maintain very quickly.

---

# 3. Database Design

## 3.1 Entity Relationships

```text
USER
 |
 | 1
 |
 |--------< VOTE >--------|
 |                       |
 |                       |
 |                       |
 |                       v
 |                     SNACK
 |
 |
 |--------< ACTIVITY >---|
```

Relationships:

- One user can create multiple votes.
- One snack can receive multiple votes.
- A user can vote for a snack only once.
- One user can generate multiple activity records.
- One snack can have multiple activity records.

## 3.2 Prisma Schema

Recommended initial schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  MEMBER
}

enum SnackCategory {
  SWEET
  SAVOURY
  DRINK
  HEALTHY_ISH
}

enum ActivityAction {
  CONSUMED
  RESTOCKED
}

model User {
  id         String   @id @default(uuid())
  name       String
  email      String   @unique
  password   String
  role       Role     @default(MEMBER)

  votes      Vote[]
  activities Activity[]

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Snack {
  id                 String        @id @default(uuid())
  name               String        @unique
  category           SnackCategory
  quantity           Int           @default(0)
  lowStockThreshold  Int           @default(5)

  votes              Vote[]
  activities         Activity[]

  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  archivedAt         DateTime?

  @@index([category])
  @@index([quantity])
  @@index([archivedAt])
}

model Vote {
  id        String   @id @default(uuid())

  userId    String
  snackId   String

  user      User     @relation(fields: [userId], references: [id])
  snack     Snack    @relation(fields: [snackId], references: [id])

  createdAt DateTime @default(now())

  @@unique([userId, snackId])
  @@index([snackId])
}

model Activity {
  id        String         @id @default(uuid())

  userId    String
  snackId   String
  action    ActivityAction
  amount    Int

  user      User           @relation(fields: [userId], references: [id])
  snack     Snack          @relation(fields: [snackId], references: [id])

  createdAt DateTime       @default(now())

  @@index([snackId, createdAt])
  @@index([userId, createdAt])
  @@index([createdAt])
}
```

### Important database constraints

Prisma models alone do not express every required database-level check.

Add a SQL migration containing:

```sql
ALTER TABLE "Snack"
ADD CONSTRAINT "snack_quantity_nonnegative"
CHECK ("quantity" >= 0);

ALTER TABLE "Snack"
ADD CONSTRAINT "snack_threshold_nonnegative"
CHECK ("lowStockThreshold" >= 0);

ALTER TABLE "Activity"
ADD CONSTRAINT "activity_amount_positive"
CHECK ("amount" > 0);
```

These constraints protect the data even if an application bug bypasses normal validation.

### Why archivedAt?

The assignment provides a DELETE endpoint, but permanent deletion could destroy the relationship between snacks and their activity history.

Recommended behaviour:

- DELETE sets `archivedAt` to the current timestamp.
- Archived snacks are excluded from normal inventory queries.
- Archived snacks cannot be consumed or restocked.
- Activity history remains available.

Document this behaviour in the README.

---

# 4. Authentication and RBAC Implementation

## 4.1 Authentication Strategy

Use JWT-based authentication stored in an HttpOnly cookie.

Recommended flow:

1. User submits email and password.
2. API finds the user by email.
3. API verifies the password hash.
4. API creates a signed JWT.
5. JWT is stored in an HttpOnly cookie.
6. Protected API requests include the cookie automatically.

Cookie settings:

- HttpOnly: true.
- Secure: true in production.
- SameSite: Lax when frontend and API share the same site.
- Appropriate expiration time.

If frontend and API are hosted cross-site, configure cookie and CSRF protections accordingly.

Never store plain passwords or trust a role sent from the frontend.

## 4.2 Authentication Middleware

`middleware/authenticate.ts`

Responsibilities:

- Read the session token.
- Verify JWT signature and expiration.
- Extract user ID.
- Load the current user from the database.
- Attach authenticated user information to the request.
- Reject invalid or expired sessions.

Example:

```typescript
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Authentication required"
      );
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Invalid session"
      );
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
```

The example assumes an `AuthRequest` type and a centralized `ApiError` class.

## 4.3 Authorization Middleware

`middleware/authorize.ts`

```typescript
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "ADMIN") {
    return next(
      new ApiError(
        403,
        "FORBIDDEN",
        "Admin access required"
      )
    );
  }

  next();
};
```

## 4.4 Route Protection

```typescript
router.get("/", authenticate, getSnacks);

router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createSnackSchema),
  createSnack
);

router.post(
  "/:id/consume",
  authenticate,
  validate(consumeSchema),
  consumeSnack
);

router.post(
  "/:id/restock",
  authenticate,
  requireAdmin,
  validate(restockSchema),
  restockSnack
);
```

Authentication and authorization must be applied consistently to every protected route.

---

# 5. Backend API Implementation

Base URL:

`/api`

## 5.1 Authentication Routes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/logout` | Clear session |
| GET | `/auth/me` | Return current user |

`GET /auth/me` is a recommended supporting endpoint for restoring the frontend session after refresh.

### Login request

```json
{
  "email": "admin@snackoverflow.com",
  "password": "Admin@123"
}
```

### Login response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@snackoverflow.com",
      "role": "ADMIN"
    }
  }
}
```

The JWT is sent in the HttpOnly cookie, not exposed in the JSON response.

## 5.2 Snack Routes

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/snacks` | List snacks | Both |
| GET | `/snacks/:id` | Snack details | Both |
| POST | `/snacks` | Create snack | Admin |
| PATCH | `/snacks/:id` | Edit snack | Admin |
| DELETE | `/snacks/:id` | Archive snack | Admin |

### List snacks

Example:

`GET /api/snacks?page=1&limit=12&search=chips&category=SAVOURY&status=STOCKED&sortBy=name&sortOrder=asc`

Supported parameters:

- `page`
- `limit`
- `search`
- `category`
- `status`
- `sortBy`
- `sortOrder`

The assignment requires server-side search, filtering and pagination. Sorting is an optional enhancement.

### Response format

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Masala Chips",
        "category": "SAVOURY",
        "quantity": 12,
        "lowStockThreshold": 5,
        "status": "STOCKED",
        "voteCount": 8,
        "hasVoted": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

`status`, `voteCount` and `hasVoted` are computed or joined data, not separate mutable snack fields.

## 5.3 Consumption Route

`POST /api/snacks/:id/consume`

Request:

```json
{
  "amount": 2
}
```

Response:

```json
{
  "success": true,
  "data": {
    "snackId": "uuid",
    "consumed": 2,
    "remainingQuantity": 10
  }
}
```

If stock is insufficient:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Someone beat you to the last packet!"
  }
}
```

HTTP status: `409 Conflict`.

## 5.4 Restock Route

`POST /api/snacks/:id/restock`

Request:

```json
{
  "amount": 10
}
```

Response:

```json
{
  "success": true,
  "data": {
    "snackId": "uuid",
    "restocked": 10,
    "remainingQuantity": 20
  }
}
```

## 5.5 Voting Routes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/snacks/:id/vote` | Vote |
| DELETE | `/snacks/:id/vote` | Remove vote |

The authenticated user ID must come from the verified session, never from the request body.

Duplicate votes should return HTTP 409 with a consistent error response.

## 5.6 Dashboard Route

`GET /api/snacks/summary`

Example response:

```json
{
  "success": true,
  "data": {
    "totalSnacks": 24,
    "stocked": 15,
    "runningLow": 6,
    "gone": 3,
    "snackOfTheWeek": {
      "id": "uuid",
      "name": "Masala Peanuts",
      "voteCount": 18
    }
  }
}
```

### Snack of the Week calculation

The assignment does not define the calculation.

Recommended assumption:

- Count votes created during the current calendar week.
- Start the week on Monday.
- Use the application's configured timezone, preferably Asia/Kolkata.
- The snack with the highest weekly vote count wins.
- Break ties consistently, such as by most recent qualifying vote.

Document this assumption in the README.

## 5.7 Activity Routes

Bonus:

`GET /api/activities?page=1&limit=20`

Admin-only.

Response should contain:

- Activity ID.
- User name.
- Snack name.
- Action.
- Amount.
- Timestamp.
- Pagination metadata.

---

# 6. Most Important Part: Atomic Inventory Operations

This is the most important backend implementation decision.

Do not implement consumption like this:

```typescript
const snack = await prisma.snack.findUnique({
  where: { id }
});

if (snack.quantity >= amount) {
  await prisma.snack.update({
    where: { id },
    data: {
      quantity: snack.quantity - amount
    }
  });
}
```

This is unsafe under concurrent requests.

Two requests could read the same quantity before either update happens.

## 6.1 Correct Consumption Implementation

Use a conditional SQL update inside a Prisma transaction.

```typescript
async function consumeSnack(
  snackId: string,
  userId: string,
  amount: number
) {
  return prisma.$transaction(async (tx) => {

    const updated = await tx.$queryRaw<
      { id: string; quantity: number }[]
    >`
      UPDATE "Snack"
      SET
        "quantity" = "quantity" - ${amount},
        "updatedAt" = NOW()
      WHERE
        "id" = ${snackId}
        AND "quantity" >= ${amount}
        AND "archivedAt" IS NULL
      RETURNING "id", "quantity"
    `;

    if (updated.length === 0) {
      const snack = await tx.snack.findFirst({
        where: {
          id: snackId,
          archivedAt: null
        }
      });

      if (!snack) {
        throw new ApiError(
          404,
          "SNACK_NOT_FOUND",
          "Snack not found"
        );
      }

      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        "Someone beat you to the last packet!"
      );
    }

    await tx.activity.create({
      data: {
        userId,
        snackId,
        action: "CONSUMED",
        amount
      }
    });

    return {
      snackId,
      consumed: amount,
      remainingQuantity: updated[0].quantity
    };
  });
}
```

### Why this works

PostgreSQL executes the conditional update atomically.

If multiple requests target the same row:

1. One request obtains the necessary row lock.
2. It checks the quantity condition and updates the row.
3. Other requests wait for that row operation to finish.
4. PostgreSQL evaluates the update condition against the current row version.
5. Requests that can no longer be fulfilled update zero rows.
6. The service returns HTTP 409 for those requests.

The activity insert happens inside the same transaction.

Therefore:

- Stock changes without an activity record cannot commit.
- An activity record cannot commit for a failed stock update.
- Quantity cannot become negative.

The database CHECK constraint provides an additional safety layer.

## 6.2 Atomic Restocking

Restocking should also use a transaction.

```typescript
async function restockSnack(
  snackId: string,
  userId: string,
  amount: number
) {
  return prisma.$transaction(async (tx) => {

    const snack = await tx.snack.updateMany({
      where: {
        id: snackId,
        archivedAt: null
      },
      data: {
        quantity: {
          increment: amount
        }
      }
    });

    if (snack.count === 0) {
      throw new ApiError(
        404,
        "SNACK_NOT_FOUND",
        "Snack not found"
      );
    }

    const updated = await tx.snack.findUniqueOrThrow({
      where: { id: snackId }
    });

    await tx.activity.create({
      data: {
        userId,
        snackId,
        action: "RESTOCKED",
        amount
      }
    });

    return updated;
  });
}
```

The increment is atomic, and the activity record is created in the same transaction.

---

# 7. Voting Implementation

The database must guarantee one vote per user per snack.

The critical Prisma constraint is:

```prisma
@@unique([userId, snackId])
```

Voting service:

```typescript
async function voteForSnack(
  userId: string,
  snackId: string
) {
  try {
    return await prisma.vote.create({
      data: {
        userId,
        snackId
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "ALREADY_VOTED",
        "You have already voted for this snack"
      );
    }

    throw error;
  }
}
```

Unvote:

```typescript
async function removeVote(
  userId: string,
  snackId: string
) {
  await prisma.vote.deleteMany({
    where: {
      userId,
      snackId
    }
  });

  return { success: true };
}
```

The unique constraint handles concurrent duplicate vote attempts even if both requests reach the server simultaneously.

---

# 8. Validation Layer

Use Zod for request validation.

Example: `snack.schema.ts`

```typescript
const createSnackSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    category: z.enum([
      "SWEET",
      "SAVOURY",
      "DRINK",
      "HEALTHY_ISH"
    ]),
    quantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0)
      .default(5)
  })
});
```

Consumption validation:

```typescript
const consumeSchema = z.object({
  body: z.object({
    amount: z.number().int().positive()
  })
});
```

Restock validation:

```typescript
const restockSchema = z.object({
  body: z.object({
    amount: z.number().int().positive()
  })
});
```

Validate:

- Request bodies.
- Route parameters.
- Query parameters.
- Login credentials.
- Pagination limits.
- Sort fields.
- Category and status enums.

Never pass arbitrary client-supplied sorting fields directly into SQL.

---

# 9. Centralized Error Handling

Create one standard error structure.

`utils/ApiError.ts`

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}
```

`middleware/errorHandler.ts`

```typescript
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong"
    }
  });
};
```

Avoid returning stack traces or internal database errors to users.

---

# 10. Frontend Implementation

## 10.1 Main Pages

| Route | Purpose | Access |
|---|---|---|
| `/login` | Authentication | Public |
| `/dashboard` | Pantry overview | Both |
| `/snacks` | Snack inventory | Both |
| `/snacks/[id]` | Snack details | Both |
| `/admin/snacks` | Inventory management | Admin |
| `/admin/activities` | Activity history | Admin |

The activity page is optional.

## 10.2 Dashboard Components

```text
Dashboard
│
├── DashboardHeader
│   ├── WelcomeMessage
│   └── UserMenu
│
├── SummaryCards
│   ├── TotalSnacksCard
│   ├── StockedCard
│   ├── RunningLowCard
│   └── GoneCard
│
├── SnackOfTheWeek
│
├── LowStockSection
│
└── RecentActivity
```

## 10.3 Snack Inventory Components

```text
SnackPage
│
├── SnackHeader
├── SnackSearch
├── CategoryFilter
├── StatusFilter
├── SortDropdown
│
├── SnackGrid
│   └── SnackCard
│       ├── SnackImage (optional)
│       ├── SnackName
│       ├── CategoryBadge
│       ├── StockIndicator
│       ├── QuantityDisplay
│       ├── VoteButton
│       ├── ConsumeButton
│       └── AdminActions
│
└── Pagination
```

## 10.4 Admin UI

Only administrators should see:

- Add snack button.
- Edit snack action.
- Delete snack action.
- Restock action.
- Activity navigation.

Use a shared user/session context for frontend presentation.

However, the backend remains the security authority.

## 10.5 Frontend API Layer

Create a centralized API client.

`lib/api.ts`

Responsibilities:

- Set API base URL.
- Send cookies with requests.
- Parse successful responses.
- Normalize API errors.
- Handle unauthorized responses.
- Provide reusable API methods.

Example:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true
});
```

Do not scatter raw fetch or Axios calls across every component.

## 10.6 State Management

For this project:

- React state for local component interactions.
- TanStack Query for API data fetching and caching.
- Session provider for current user information.

Use query invalidation after consumption, voting, restocking and snack modifications.

Optimistic updates are optional. Implement them only after the normal server-confirmed flow works.

---

# 11. Testing Blueprint

Use a real PostgreSQL test database for database integrity and concurrency tests.

Do not rely on SQLite to prove PostgreSQL concurrency behaviour.

## 11.1 Backend Test Matrix

| Test | Expected result |
|---|---|
| Valid login | 200 |
| Invalid login | 401 |
| Member creates snack | 403 |
| Admin creates snack | 201 |
| Invalid quantity | 400 |
| Duplicate snack name | 409 |
| Consume available stock | 200 |
| Consume unavailable stock | 409 |
| Restock as member | 403 |
| Restock as admin | 200 |
| Duplicate vote | 409 |
| Remove vote | 200 |
| Member accesses activity page | 403 |

## 11.2 Critical Concurrency Test

Initial stock: 3.

Launch 10 concurrent requests, each attempting to consume 1 packet.

Expected result:

```text
Total requests: 10

Successful requests: 3
Failed requests: 7

Final quantity: 0

Consumption activity records: 3
```

Example:

```typescript
const requests = Array.from(
  { length: 10 },
  () => request(app)
    .post(`/api/snacks/${snackId}/consume`)
    .set("Cookie", memberCookie)
    .send({ amount: 1 })
);

const responses = await Promise.all(requests);

const successful = responses.filter(
  response => response.status === 200
);

const conflicts = responses.filter(
  response => response.status === 409
);

expect(successful).toHaveLength(3);
expect(conflicts).toHaveLength(7);
```

After the requests finish, query PostgreSQL directly or through Prisma and verify:

- Quantity is zero.
- Exactly three consumption activities exist.
- No failed request generated an activity.

Run the same test with varying amounts as an additional check.

---

# 12. Seed Data

The application must have reproducible demo accounts and sample snacks.

Recommended demo accounts:

| User | Email | Role |
|---|---|---|
| Admin | admin@snackoverflow.com | ADMIN |
| Member | member@snackoverflow.com | MEMBER |

Use a development-only password supplied in the README. Hash both passwords in the seed script.

Example snack data:

| Snack | Category | Quantity | Threshold |
|---|---|---:|---:|
| Masala Peanuts | SAVOURY | 3 | 5 |
| Potato Chips | SAVOURY | 15 | 5 |
| Chocolate Bar | SWEET | 8 | 5 |
| Orange Juice | DRINK | 0 | 5 |
| Mixed Nuts | HEALTHY_ISH | 4 | 5 |
| Biscuits | SWEET | 20 | 5 |

The seed script should be repeatable without creating duplicate users or snacks.

---

# 13. Environment Configuration

Root `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/snack_overflow

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d

API_PORT=4000
NODE_ENV=development

WEB_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Never commit the actual `.env` file.

Validate required environment variables at application startup.

---

# 14. Docker Setup

Docker Compose is a bonus requirement.

Recommended services:

```text
docker-compose.yml
│
├── postgres
│   └── Persistent database volume
│
├── api
│   └── Express backend
│
└── web
    └── Next.js frontend
```

PostgreSQL should use a persistent named volume.

The API should wait for database health before running migrations and starting.

The frontend should communicate with the API using the configured API URL.

---

# 15. GitHub Actions CI

Recommended workflow:

```text
On push / pull request
          |
          v
      Install dependencies
          |
          v
       Run lint
          |
          v
    TypeScript checks
          |
          v
     Start test database
          |
          v
      Run migrations
          |
          v
      Run API tests
          |
          v
       Build frontend
          |
          v
      Build backend
          |
          v
        SUCCESS
```

This is a bonus, so do not let CI configuration delay the required application.

---

# 16. README and Design Note

The README must contain:

1. Project overview.
2. Technology stack.
3. Prerequisites.
4. Installation steps.
5. Environment variables.
6. Database setup.
7. Migration commands.
8. Seed instructions.
9. Demo credentials.
10. API endpoint documentation.
11. Database schema explanation.
12. Authentication and RBAC implementation.
13. Atomic consumption explanation.
14. Voting uniqueness explanation.
15. Automated testing instructions.
16. Design decisions and trade-offs.
17. What would break first at 100x usage.

### Design note: 100x scale

Discuss realistic bottlenecks:

- Database connection capacity.
- Contention on heavily consumed snack rows.
- Pagination and query performance.
- Vote aggregation costs.
- API instance scaling.
- Caching dashboard summaries.
- Observability and error monitoring.

Do not claim the current application supports massive scale without testing it.

---

# 17. Implementation Order

Follow this order rather than building random screens and hoping the backend eventually catches up.

## Phase 1: Foundation

- [ ] Create monorepo.
- [ ] Initialize Next.js.
- [ ] Initialize Express + TypeScript.
- [ ] Configure PostgreSQL.
- [ ] Configure Prisma.
- [ ] Create database schema.
- [ ] Run migrations.
- [ ] Implement seed script.

## Phase 2: Backend Core

- [ ] Implement login and logout.
- [ ] Implement authentication middleware.
- [ ] Implement admin authorization.
- [ ] Implement snack CRUD.
- [ ] Implement search and pagination.
- [ ] Implement snack summary.
- [ ] Implement atomic consumption.
- [ ] Implement restocking.
- [ ] Implement transactional activity logging.
- [ ] Implement voting.
- [ ] Implement error handling.

## Phase 3: Backend Testing

- [ ] Authentication tests.
- [ ] RBAC tests.
- [ ] CRUD tests.
- [ ] Consumption tests.
- [ ] Restock tests.
- [ ] Voting tests.
- [ ] Concurrency test.

## Phase 4: Frontend

- [ ] Login page.
- [ ] Dashboard layout.
- [ ] Session restoration.
- [ ] Role-aware navigation.
- [ ] Summary cards.
- [ ] Snack list.
- [ ] Search and filters.
- [ ] Snack detail page.
- [ ] Consume interaction.
- [ ] Voting interaction.
- [ ] Admin snack management.
- [ ] Responsive layouts.
- [ ] Loading and error states.

## Phase 5: Finalization

- [ ] Verify all permissions.
- [ ] Verify database constraints.
- [ ] Test concurrent consumption.
- [ ] Verify activity records.
- [ ] Test on mobile.
- [ ] Write README.
- [ ] Create demo recording.
- [ ] Submit repository.

---

# 18. Definition of Done

The project is ready for submission when:

- Both roles can authenticate.
- Every protected route has server-side authorization.
- Admin-only operations cannot be accessed by members.
- Snack CRUD works.
- Search, filtering and pagination work on the server.
- Dashboard summary is accurate.
- Consumption is atomic.
- Concurrent requests cannot oversell inventory.
- Restock and consumption are transactionally logged.
- Duplicate votes are prevented by the database.
- API responses use consistent error structures.
- Critical automated tests pass.
- Seed data works.
- README explains the important engineering decisions.
- The application is usable on desktop and mobile.

**Implementation priority:**

1. Data integrity.
2. Backend authorization.
3. API correctness.
4. Automated tests.
5. Complete frontend experience.
6. Optional enhancements.

Build the reliable pantry tracker first. The optional features are dessert, not the meal.   