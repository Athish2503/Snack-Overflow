# Test Plan — Snack Overflow

Use a real PostgreSQL test database for transaction and concurrency tests. SQLite or mocked repositories do not prove PostgreSQL concurrency behavior.

## 1. Authentication

- [ ] Valid admin login succeeds.
- [ ] Valid member login succeeds.
- [ ] Invalid password returns 401.
- [ ] Unknown email returns 401 without leaking account details.
- [ ] Password hash is not returned in any response.
- [ ] Unauthenticated protected request returns 401.
- [ ] Logout clears the session.

## 2. Authorization

- [ ] Admin can create snack.
- [ ] Member cannot create snack; returns 403.
- [ ] Admin can edit snack.
- [ ] Member cannot edit snack; returns 403.
- [ ] Admin can restock.
- [ ] Member cannot restock; returns 403.
- [ ] Admin can archive/delete snack.
- [ ] Member cannot archive/delete snack; returns 403.
- [ ] Both roles can list and view snacks.
- [ ] Both roles can consume and vote.

Test direct API requests. A hidden frontend button is not an authorization test.

## 3. Snack validation and reads

- [ ] Empty name rejected.
- [ ] Duplicate name rejected with 409.
- [ ] Invalid category rejected.
- [ ] Negative quantity rejected.
- [ ] Negative threshold rejected.
- [ ] Invalid pagination rejected or safely normalized.
- [ ] Search returns matching names.
- [ ] Category filter works.
- [ ] Status filter works.
- [ ] Pagination metadata is correct.
- [ ] Archived snacks are excluded.
- [ ] Status boundary cases are correct.

## 4. Consumption

- [ ] Consume one unit when stock is available.
- [ ] Consume amount greater than stock returns 409.
- [ ] Consume zero returns 400.
- [ ] Consume negative amount returns 400.
- [ ] Consume decimal amount returns 400.
- [ ] Consume missing snack returns 404.
- [ ] Successful consume creates one activity row.
- [ ] Failed consume creates no activity row.
- [ ] Activity amount matches consumed amount.
- [ ] Stock never becomes negative.

## 5. Required concurrency test

Setup:
- Create a snack with quantity 3.
- Authenticate a test user or users.
- Send 10 requests concurrently, each consuming amount 1.

Assertions:
- Exactly 3 requests return success.
- Exactly 7 requests return 409.
- Final quantity equals 0.
- Exactly 3 `CONSUMED` activity rows exist for this test snack.
- No quantity below zero exists.

Run this against PostgreSQL. Repeat the test to catch race-condition mistakes.

## 6. Restocking

- [ ] Admin restocks positive amount.
- [ ] Member restock returns 403.
- [ ] Zero/negative/decimal amount rejected.
- [ ] Successful restock creates one activity row.
- [ ] Activity amount matches restocked amount.
- [ ] Failed restock creates no activity row.

## 7. Voting

- [ ] User can vote once.
- [ ] Vote count increments.
- [ ] User can unvote.
- [ ] Vote count decrements.
- [ ] Repeated vote returns 409.
- [ ] Concurrent duplicate vote attempts create only one row.
- [ ] A user's vote state is reflected correctly in snack responses.

## 8. Frontend verification

- [ ] Login validation and server errors display.
- [ ] Session restores after page refresh.
- [ ] Member never sees admin controls.
- [ ] Member direct API access is still rejected.
- [ ] Loading states display.
- [ ] Empty states display.
- [ ] Error states display.
- [ ] 409 consumption feedback is clear.
- [ ] Query data refreshes after consume/restock/vote.
- [ ] Layout works at phone width and desktop width.
- [ ] Keyboard focus and form labels are usable.

## 9. Release checks

- [ ] Lint passes.
- [ ] Type-check passes.
- [ ] Backend tests pass.
- [ ] Frontend tests pass where implemented.
- [ ] Production build passes.
- [ ] Fresh database migration succeeds.
- [ ] Seed script succeeds.
- [ ] README instructions work from a clean checkout.
