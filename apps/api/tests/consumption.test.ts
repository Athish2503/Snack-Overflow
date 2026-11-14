import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { SnackCategory, ActivityAction } from '@prisma/client';

const app = createApp();

describe('Inventory Mutations & Concurrency Safety (Phase 4)', () => {
  let memberCookie: string;
  let adminCookie: string;
  let memberUserId: string;

  beforeAll(async () => {
    // 1. Login member
    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@snackoverflow.local', password: 'member123' });
    const mCookies = memberLogin.headers['set-cookie'];
    memberCookie = Array.isArray(mCookies) ? mCookies.join(';') : (mCookies as unknown as string);
    memberUserId = memberLogin.body.user.id;

    // 2. Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@snackoverflow.local', password: 'admin123' });
    const aCookies = adminLogin.headers['set-cookie'];
    adminCookie = Array.isArray(aCookies) ? aCookies.join(';') : (aCookies as unknown as string);
  });

  describe('Basic Consumption & Validation', () => {
    it('validates amount as a positive integer', async () => {
      const res = await request(app)
        .post('/api/snacks/00000000-0000-0000-0000-000000000000/consume')
        .set('Cookie', memberCookie)
        .send({ amount: -2 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for missing or archived snack', async () => {
      const res = await request(app)
        .post('/api/snacks/00000000-0000-0000-0000-000000000000/consume')
        .set('Cookie', memberCookie)
        .send({ amount: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 409 when stock is insufficient and inserts no activity log', async () => {
      // Create a test snack with quantity 1
      const snack = await prisma.snack.create({
        data: {
          name: `Test Snack Insufficient ${Date.now()}`,
          category: SnackCategory.SWEET,
          quantity: 1,
          lowStockThreshold: 5,
        },
      });

      const initialActivityCount = await prisma.activity.count({
        where: { snackId: snack.id },
      });

      // Try consuming 2 units
      const res = await request(app)
        .post(`/api/snacks/${snack.id}/consume`)
        .set('Cookie', memberCookie)
        .send({ amount: 2 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

      // Verify no activity was logged
      const finalActivityCount = await prisma.activity.count({
        where: { snackId: snack.id },
      });
      expect(finalActivityCount).toBe(initialActivityCount);

      // Verify stock remained unchanged
      const currentSnack = await prisma.snack.findUnique({ where: { id: snack.id } });
      expect(currentSnack?.quantity).toBe(1);
    });

    it('consumes successfully when stock is available and logs CONSUMED activity', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Test Snack Consume Success ${Date.now()}`,
          category: SnackCategory.SAVOURY,
          quantity: 5,
          lowStockThreshold: 3,
        },
      });

      const res = await request(app)
        .post(`/api/snacks/${snack.id}/consume`)
        .set('Cookie', memberCookie)
        .send({ amount: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(3);
      expect(res.body.data.status).toBe('running_low');

      // Verify activity was created in database
      const activity = await prisma.activity.findFirst({
        where: { snackId: snack.id, action: ActivityAction.CONSUMED },
      });
      expect(activity).toBeDefined();
      expect(activity?.amount).toBe(2);
      expect(activity?.userId).toBe(memberUserId);
    });
  });

  describe('Restock (Admin Only)', () => {
    it('forbids members from restocking with 403', async () => {
      const res = await request(app)
        .post('/api/snacks/00000000-0000-0000-0000-000000000000/restock')
        .set('Cookie', memberCookie)
        .send({ amount: 10 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to restock and logs RESTOCKED activity in transaction', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Test Snack Restock ${Date.now()}`,
          category: SnackCategory.DRINK,
          quantity: 0,
          lowStockThreshold: 5,
        },
      });

      const res = await request(app)
        .post(`/api/snacks/${snack.id}/restock`)
        .set('Cookie', adminCookie)
        .send({ amount: 15 });

      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(15);
      expect(res.body.data.status).toBe('stocked');

      const activity = await prisma.activity.findFirst({
        where: { snackId: snack.id, action: ActivityAction.RESTOCKED },
      });
      expect(activity).toBeDefined();
      expect(activity?.amount).toBe(15);
    });
  });

  describe('Required Concurrency Proof (10 simultaneous requests for stock 3)', () => {
    it('executes 10 concurrent consume requests: exactly 3 succeed, 7 return 409, final stock is 0, exactly 3 activities exist', async () => {
      // 1. Seed one snack with initial quantity 3 in PostgreSQL
      const concurrencySnack = await prisma.snack.create({
        data: {
          name: `Concurrency Snack ${Date.now()}`,
          category: SnackCategory.SAVOURY,
          quantity: 3,
          lowStockThreshold: 2,
        },
      });

      // 2. Fire 10 simultaneous consume requests, each requesting amount 1
      const requests = Array.from({ length: 10 }).map(() =>
        request(app)
          .post(`/api/snacks/${concurrencySnack.id}/consume`)
          .set('Cookie', memberCookie)
          .send({ amount: 1 })
      );

      const results = await Promise.all(requests);

      // 3. Count status responses
      const successful = results.filter((r) => r.status === 200);
      const conflicts = results.filter((r) => r.status === 409);

      expect(successful.length).toBe(3);
      expect(conflicts.length).toBe(7);

      for (const conflict of conflicts) {
        expect(conflict.body.error.code).toBe('INSUFFICIENT_STOCK');
      }

      // 4. Assert final quantity in database is exactly 0
      const finalSnack = await prisma.snack.findUnique({
        where: { id: concurrencySnack.id },
      });
      expect(finalSnack?.quantity).toBe(0);

      // 5. Assert exactly 3 CONSUMED activity rows exist in database
      const activities = await prisma.activity.findMany({
        where: {
          snackId: concurrencySnack.id,
          action: ActivityAction.CONSUMED,
        },
      });
      expect(activities.length).toBe(3);
      for (const act of activities) {
        expect(act.amount).toBe(1);
      }
    });
  });
});
