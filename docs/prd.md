# PRODUCT REQUIREMENTS DOCUMENT
# Snack Overflow

**Project:** Snack Overflow  
**Type:** Full Stack Web Application  
**Assignment:** Round 2 – Full Stack Intern  
**Company:** Bipolar Factory  
**Planning deadline:** Monday, November 16, 2026  
**Document version:** 1.0

---

## 1. Product Overview

### 1.1 Purpose

Snack Overflow is an internal office pantry management application that allows employees to view available snacks, consume snacks, vote for their favourites, and monitor pantry stock levels.

Administrators can manage the pantry inventory, restock snacks, and monitor activity.

The application must maintain accurate inventory even when multiple employees attempt to consume the same snack simultaneously.

### 1.2 Problem Statement

The existing pantry tracking process is unreliable. Employees may consume snacks without updating inventory, multiple people may attempt to take the last available packet, and administrators may not know when stock is running low.

Snack Overflow solves this by providing:

- Centralized snack inventory management.
- Accurate stock tracking.
- Concurrent consumption handling.
- Role-based access control.
- Snack voting and popularity tracking.
- Activity history for inventory changes.

### 1.3 Product Objectives

1. Maintain accurate pantry inventory.
2. Prevent stock quantities from becoming negative.
3. Allow employees to consume and vote for snacks.
4. Provide administrators with inventory management capabilities.
5. Maintain an auditable record of consumption and restocking.
6. Deliver a responsive and intuitive user experience.

---

## 2. User Roles and Access Control

The application will use Role-Based Access Control (RBAC).

There are exactly two roles in the initial release.

### 2.1 Admin

Administrators are responsible for managing the pantry.

Permissions:

- Log in.
- View dashboard and inventory.
- Search, filter, and paginate snacks.
- View snack details.
- Consume snacks.
- Vote and remove votes.
- Add new snacks.
- Edit existing snacks.
- Delete or archive snacks.
- Restock snacks.
- View the activity log.

### 2.2 Member

Members are regular employees who interact with the pantry.

Permissions:

- Log in.
- View dashboard and inventory.
- Search, filter, and paginate snacks.
- View snack details.
- Consume snacks.
- Vote and remove votes.

Members cannot:

- Add snacks.
- Edit snacks.
- Delete snacks.
- Restock snacks.
- Access administrator-only activity pages.

### 2.3 Permission Matrix

| Functionality | Admin | Member |
|---|---|---|
| Login | Yes | Yes |
| View dashboard | Yes | Yes |
| View snacks | Yes | Yes |
| Search and filter | Yes | Yes |
| Consume snacks | Yes | Yes |
| Vote / Unvote | Yes | Yes |
| Add snacks | Yes | No |
| Edit snacks | Yes | No |
| Delete snacks | Yes | No |
| Restock snacks | Yes | No |
| View activity logs | Yes | No |

**Security requirement:** Permissions must be enforced on the backend. Hiding administrative buttons in the frontend is not sufficient authorization.

---

## 3. Functional Requirements

### FR-01: Authentication

Users must authenticate before accessing the application.

Requirements:

- Login using email and password.
- Support seeded administrator and member accounts.
- Passwords must be hashed using bcrypt or Argon2.
- Authentication must use JWT or secure session-based authentication.
- The authenticated user must have an associated role.
- Protected endpoints must reject unauthenticated requests.
- Invalid credentials must return a consistent error response.

Sign-up is not required for the initial release.

### FR-02: Dashboard

The dashboard is the primary landing page after login.

It must display:

**Inventory summary cards:**

- Total snacks.
- Stocked snacks.
- Running-low snacks.
- Gone snacks.

**Snack of the Week:**

Display the most-voted snack for the current week.

**Additional dashboard content:**

- Recently updated or consumed snacks.
- Low-stock snack highlights.
- Quick access to the snack inventory.

The summary must be retrieved from the API rather than calculated from only the currently visible frontend page.

### FR-03: Snack Inventory

Users must be able to browse all available snacks.

Each snack must contain:

- Name.
- Category.
- Available quantity.
- Low-stock threshold.
- Stock status.
- Vote count.

Supported categories:

- Sweet.
- Savoury.
- Drink.
- Healthy-ish.

Supported stock statuses:

| Status | Condition |
|---|---|
| Stocked | Quantity greater than threshold |
| Running Low | Quantity greater than 0 and less than or equal to threshold |
| Gone | Quantity equals 0 |

Stock status must be derived from quantity and threshold. It must not be stored as an independent database field.

### FR-04: Search, Filtering and Pagination

The snack inventory must support:

- Search by snack name.
- Filter by category.
- Filter by stock status.
- Server-side pagination.

Recommended query parameters:

`GET /snacks?page=1&limit=12&search=chips&category=savoury&status=stocked`

All filtering, searching, pagination, and optional sorting must be handled by the backend.

### FR-05: Snack Details

Users must be able to view an individual snack's information.

The detail view should include:

- Snack name.
- Category.
- Current quantity.
- Stock status.
- Low-stock threshold.
- Total votes.
- Current user's vote status.

Administrators additionally receive inventory management actions.

### FR-06: Consume Snack

Members and administrators can consume snacks.

Requirements:

- User selects a snack.
- User specifies the quantity to consume.
- Quantity must be a positive integer.
- The server validates available stock.
- Stock must never become negative.
- Every successful consumption must create an activity record.
- Stock modification and activity creation must happen in the same database transaction.

**Concurrency requirement:**

If 10 users attempt to consume the final 3 packets simultaneously:

- Exactly 3 packets can be consumed.
- Only requests that can be fulfilled should succeed.
- Remaining requests must receive HTTP 409 Conflict.
- The final quantity must be zero.
- Quantity must never become negative.

The implementation must use an atomic database-level update, not an application-level read-then-update check.

### FR-07: Restock Snack

Only administrators can restock snacks.

Requirements:

- Administrator selects a snack.
- Administrator specifies a positive integer quantity.
- The quantity is added to existing inventory.
- An activity record is created.
- Stock modification and activity creation happen in the same transaction.

### FR-08: Voting

Authenticated users can vote for snacks.

Requirements:

- A user can vote for a particular snack.
- A user can remove their vote.
- Each user can have only one vote per snack.
- Duplicate votes must be prevented at the database level.
- Vote counts must update correctly.
- The application must display whether the current user has already voted.

### FR-09: Snack Management

Only administrators can manage snack records.

**Create snack:**

Required fields:
- Name.
- Category.
- Initial quantity.
- Low-stock threshold.

**Edit snack:**

Administrators can update:
- Name.
- Category.
- Low-stock threshold.

Quantity changes should happen through the restock or consumption operations rather than an unrestricted edit operation.

**Delete snack:**

Administrators can remove snacks from the active pantry inventory.

Recommended implementation: archive snacks rather than permanently deleting records with activity history, preserving audit information.

### FR-10: Activity Log

This is an optional bonus feature in the assignment.

An administrator-only activity page should display:

- User who performed the action.
- Snack involved.
- Action type.
- Quantity affected.
- Timestamp.

Supported activity types:

- CONSUMED.
- RESTOCKED.

The page should support server-side pagination.

### FR-11: UI Feedback and States

The application must provide:

- Loading states.
- Empty states.
- Error states.
- Success notifications.
- Form validation feedback.
- Clear messages for rejected operations.
- Responsive layouts for mobile and desktop.

Example conflict message:

"Someone beat you to the last packet! Refresh the inventory and try again."

---

## 4. Data Model

The initial release requires four primary entities.

### 4.1 User

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required |
| email | String | Required, unique |
| password | String | Required, hashed |
| role | Enum | ADMIN / MEMBER |

### 4.2 Snack

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| name | String | Required, unique |
| category | Enum | SWEET / SAVOURY / DRINK / HEALTHY_ISH |
| quantity | Integer | Required, minimum 0 |
| lowStockThreshold | Integer | Default 5 |

An optional `isArchived` field can be added to preserve historical records when an administrator removes a snack.

### 4.3 Vote

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | Foreign key |
| snackId | UUID | Foreign key |
| createdAt | DateTime | Required |

Database constraint:

`UNIQUE(userId, snackId)`

### 4.4 Activity

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | Foreign key |
| snackId | UUID | Foreign key |
| action | Enum | CONSUMED / RESTOCKED |
| amount | Integer | Positive integer |
| createdAt | DateTime | Required |

Every successful consumption and restock must produce exactly one corresponding activity record.

---

## 5. API Requirements

Base path: `/api`

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/login` | Public |

### Snacks

| Method | Endpoint | Access |
|---|---|---|
| GET | `/snacks` | Admin / Member |
| GET | `/snacks/:id` | Admin / Member |
| POST | `/snacks` | Admin |
| PATCH | `/snacks/:id` | Admin |
| DELETE | `/snacks/:id` | Admin |

### Inventory Operations

| Method | Endpoint | Access |
|---|---|---|
| POST | `/snacks/:id/consume` | Admin / Member |
| POST | `/snacks/:id/restock` | Admin |

Consumption request:

`POST /snacks/:id/consume`

Body:

`{ "amount": 2 }`

Restock request:

`POST /snacks/:id/restock`

Body:

`{ "amount": 10 }`

### Voting

| Method | Endpoint | Access |
|---|---|---|
| POST | `/snacks/:id/vote` | Admin / Member |
| DELETE | `/snacks/:id/vote` | Admin / Member |

### Dashboard

| Method | Endpoint | Access |
|---|---|---|
| GET | `/snacks/summary` | Admin / Member |

The summary endpoint returns:

- Total snack count.
- Stocked count.
- Running-low count.
- Gone count.
- Snack of the Week.

### Activity

| Method | Endpoint | Access |
|---|---|---|
| GET | `/activities` | Admin |

This is a bonus endpoint.

---

## 6. API Error Contract

All API errors must follow one consistent structure.

Example:

`{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Someone beat you to the last packet!" } }`

Expected HTTP status codes:

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid input |
| 401 | Authentication required or invalid credentials |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Stock conflict or duplicate vote |
| 500 | Unexpected server error |

---

## 7. Non-Functional Requirements

### Security

- Passwords must never be stored in plain text.
- Every protected endpoint must authenticate the user.
- Admin-only endpoints must validate the user's role on the server.
- Request bodies and query parameters must be validated.
- Secrets must be stored in environment variables.
- Database queries must be parameterized or handled safely through the ORM.
- Authentication tokens and sessions must be handled securely.

### Data Integrity

- Snack quantity must never become negative.
- Vote uniqueness must be enforced by a database constraint.
- Stock updates must be atomic.
- Activity logging must be transactional.
- Invalid quantities must be rejected.

### Performance

- Use server-side pagination.
- Avoid fetching the entire inventory for every request.
- Add appropriate indexes for frequently queried fields.
- Return only the data required by each view.

### Usability

- Responsive mobile and desktop layouts.
- Clear stock indicators.
- Consistent feedback.
- Accessible forms and controls.
- Predictable navigation.

---

## 8. Recommended Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Authentication | JWT or secure sessions |
| Password hashing | bcrypt / Argon2 |
| Testing | Vitest + Supertest |
| Deployment | Docker Compose |

The assignment allows other technologies, but encourages TypeScript and relational databases, with PostgreSQL preferred.

---

## 9. Testing Requirements

The following tests are mandatory for the core implementation.

### Authentication Tests

- Valid login succeeds.
- Invalid password is rejected.
- Unauthenticated requests are rejected.

### Authorization Tests

- Member cannot create a snack.
- Member cannot edit a snack.
- Member cannot delete a snack.
- Member cannot restock a snack.
- Member cannot access activity logs.
- Admin can perform administrative operations.

### Inventory Tests

- Snack creation succeeds with valid data.
- Duplicate snack names are rejected.
- Invalid category is rejected.
- Negative quantities are rejected.
- Stock status is calculated correctly.
- Search and filters work correctly.

### Consumption Tests

- Valid consumption decreases stock.
- Consumption cannot exceed available stock.
- Zero and negative amounts are rejected.
- Activity is created after successful consumption.
- Failed consumption does not create an activity record.
- Concurrent consumption never makes stock negative.

### Voting Tests

- User can vote.
- User can remove a vote.
- Duplicate votes are prevented.
- Concurrent duplicate voting cannot create duplicate records.

---

## 10. Acceptance Criteria

The application is considered complete when all of the following are true:

1. Admin and member users can log in.
2. The interface adapts to the authenticated user's role.
3. Members cannot perform administrative operations, even through direct API calls.
4. Snacks can be created, edited, listed, and removed by administrators.
5. Inventory supports search, category filters, status filters, and pagination.
6. Dashboard summary cards display correct counts.
7. Snack of the Week is displayed.
8. Members and administrators can consume snacks.
9. Concurrent consumption cannot cause negative inventory.
10. Failed consumption returns HTTP 409.
11. Successful consumption and restocking are logged transactionally.
12. Each user can vote only once per snack.
13. Stock status is derived correctly.
14. Loading, empty, success, and error states work.
15. Critical automated tests pass.
16. Seed data creates demo admin and member accounts.
17. README explains setup, demo credentials, API endpoints, schema, authorization, and concurrency handling.

---

## 11. Optional Enhancements

These are not prerequisites for completing the assignment.

**Priority 1: High-value bonuses**
- Admin activity history page.
- Docker Compose setup.
- Idempotency-Key support for consumption requests.
- Server-side sorting by name, quantity, and votes.

**Priority 2: Additional polish**
- Optimistic UI with rollback.
- Real-time stock updates through SSE.
- GitHub Actions CI pipeline.
- Live deployment.

**Not included in the initial scope:**
- Dynamic permission management.
- Custom roles.
- User registration.
- Chat or messaging.
- AI recommendations.
- Complex analytics.
- Microservices.
- Advanced gamification.

---

## 12. Delivery Plan

### Phase 1: Backend Foundation

- Project setup.
- Database schema and migrations.
- Seed users and snacks.
- Authentication.
- RBAC middleware.
- Snack CRUD.
- Search, filtering, and pagination.

### Phase 2: Core Business Logic

- Atomic consumption.
- Restocking.
- Transactional activity logging.
- Voting and uniqueness constraints.
- Dashboard summary.
- Automated backend tests.

### Phase 3: Frontend

- Login screen.
- Role-aware navigation.
- Dashboard.
- Snack inventory.
- Snack details.
- Consume and vote interactions.
- Admin management controls.
- Loading and error states.
- Responsive design.

### Phase 4: Finalization

- Concurrency testing.
- Authorization testing.
- Docker setup.
- README and design notes.
- Deployment if time permits.
- Three-to-five-minute demo recording.

---

## 13. Submission Deliverables

The final submission must contain:

1. Public GitHub repository.
2. Meaningful commit history.
3. Complete README.
4. Demo administrator and member credentials.
5. Database schema documentation.
6. API endpoint documentation.
7. Explanation of concurrency handling.
8. Explanation of authorization.
9. Design decisions and trade-offs.
10. Explanation of what would break first at 100x the user load.
11. Three-to-five-minute screen recording.
12. Optional live deployment link.

**Final scope principle:** Correctness, security, data integrity, and a complete user experience take priority over optional features. A smaller application that reliably handles concurrent consumption is more valuable than a large application with unfinished functionality.