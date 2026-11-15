import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { SnackCategory, Role } from '@prisma/client';
import { cleanupTestSnacks } from './setup.js';

const app = createApp();

describe('Admin Dashboard API (GET /api/admin/dashboard)', () => {
  let adminCookie: string;
  let memberCookie: string;

  afterAll(async () => {
    await cleanupTestSnacks();
  });

  it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBeDefined();
  });

  it('rejects member requests with 403 FORBIDDEN', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'member@snackoverflow.local',
      password: 'member123',
    });
    expect(loginRes.status).toBe(200);
    memberCookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', memberCookie);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toBeDefined();
  });

  it('allows admin requests with 200 and returns the exact dashboard structure with smart restock and average', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@snackoverflow.local',
      password: 'admin123',
    });
    expect(loginRes.status).toBe(200);
    adminCookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    const body = res.body;

    // 1. Counts validation
    expect(body.counts).toBeDefined();
    expect(typeof body.counts.total).toBe('number');
    expect(typeof body.counts.stocked).toBe('number');
    expect(typeof body.counts.low).toBe('number');
    expect(typeof body.counts.gone).toBe('number');
    expect(body.counts.total).toBe(body.counts.stocked + body.counts.low + body.counts.gone);

    // 2. NeedsRestock validation with suggestedRestock
    expect(Array.isArray(body.needsRestock)).toBe(true);
    expect(body.needsRestock.length).toBeLessThanOrEqual(8);
    for (const item of body.needsRestock) {
      expect(item.id).toBeDefined();
      expect(typeof item.name).toBe('string');
      expect(item.category).toBeDefined();
      expect(typeof item.quantity).toBe('number');
      expect(typeof item.lowStockThreshold).toBe('number');
      expect(['gone', 'low']).toContain(item.status);
      if (item.quantity === 0) {
        expect(item.status).toBe('gone');
      } else {
        expect(item.status).toBe('low');
        expect(item.quantity).toBeLessThanOrEqual(item.lowStockThreshold);
      }

      // Check smart suggestedRestock math: X = max(1, 2*threshold - quantity), Y = quantity + X
      expect(item.suggestedRestock).toBeDefined();
      const expectedAmount = Math.max(1, 2 * item.lowStockThreshold - item.quantity);
      expect(item.suggestedRestock.amount).toBe(expectedAmount);
      expect(item.suggestedRestock.target).toBe(item.quantity + expectedAmount);
    }

    // 3. Urgency ordering verification: 'gone' items must come before 'low' items
    let seenLow = false;
    for (const item of body.needsRestock) {
      if (item.status === 'low') {
        seenLow = true;
      }
      if (seenLow) {
        expect(item.status).not.toBe('gone');
      }
    }

    // 4. RecentActivity validation (last 10)
    expect(Array.isArray(body.recentActivity)).toBe(true);
    expect(body.recentActivity.length).toBeLessThanOrEqual(10);
    for (const act of body.recentActivity) {
      expect(act.id).toBeDefined();
      expect(typeof act.userName).toBe('string');
      expect(typeof act.snackName).toBe('string');
      expect(['CONSUMED', 'RESTOCKED']).toContain(act.action);
      expect(typeof act.amount).toBe('number');
      expect(act.createdAt).toBeDefined();
    }

    // 5. ConsumptionLast7Days & consumptionAverage validation
    expect(Array.isArray(body.consumptionLast7Days)).toBe(true);
    expect(body.consumptionLast7Days.length).toBe(7);
    for (const day of body.consumptionLast7Days) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof day.units).toBe('number');
      expect(day.units).toBeGreaterThanOrEqual(0);
    }
    // Verify chronological order
    for (let i = 1; i < body.consumptionLast7Days.length; i++) {
      expect(body.consumptionLast7Days[i].date > body.consumptionLast7Days[i - 1].date).toBe(true);
    }

    expect(typeof body.consumptionAverage).toBe('number');
    expect(body.consumptionAverage).toBeGreaterThanOrEqual(0);

    // 6. MostConsumedThisWeek validation (up to 3)
    expect(Array.isArray(body.mostConsumedThisWeek)).toBe(true);
    expect(body.mostConsumedThisWeek.length).toBeLessThanOrEqual(3);
    for (const snack of body.mostConsumedThisWeek) {
      expect(snack.id).toBeDefined();
      expect(typeof snack.name).toBe('string');
      expect(typeof snack.units).toBe('number');
    }

    // 7. Snack of the week validation including stock fields and unitsConsumedThisWeek
    if (body.snackOfTheWeek) {
      expect(body.snackOfTheWeek.id).toBeDefined();
      expect(body.snackOfTheWeek.name).toBeDefined();
      expect(typeof body.snackOfTheWeek.quantity).toBe('number');
      expect(typeof body.snackOfTheWeek.lowStockThreshold).toBe('number');
      expect(body.snackOfTheWeek.status).toBeDefined();
      expect(typeof body.snackOfTheWeek.unitsConsumedThisWeek).toBe('number');
    }
  });

  it('correctly computes suggestedRestock math for gone snacks and threshold edge cases', async () => {
    // 1. Create a gone snack (quantity: 0, threshold: 4) -> suggestedRestock: amount = max(1, 2*4 - 0) = 8, target = 8
    const goneSnack = await prisma.snack.create({
      data: {
        name: `TEST_GONE_RESTOCK_MATH_${Date.now()}`,
        category: SnackCategory.SWEET,
        quantity: 0,
        lowStockThreshold: 4,
      },
    });

    // 2. Create a low snack where quantity = threshold (quantity: 3, threshold: 3) -> amount = max(1, 2*3 - 3) = 3, target = 6
    const lowSnack = await prisma.snack.create({
      data: {
        name: `TEST_LOW_RESTOCK_MATH_${Date.now()}`,
        category: SnackCategory.SAVOURY,
        quantity: 3,
        lowStockThreshold: 3,
      },
    });

    try {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);

      const foundGone = res.body.needsRestock.find((s: any) => s.id === goneSnack.id);
      expect(foundGone).toBeDefined();
      expect(foundGone.suggestedRestock.amount).toBe(8);
      expect(foundGone.suggestedRestock.target).toBe(8);

      const foundLow = res.body.needsRestock.find((s: any) => s.id === lowSnack.id);
      if (foundLow) {
        expect(foundLow.suggestedRestock.amount).toBe(3);
        expect(foundLow.suggestedRestock.target).toBe(6);
      }
    } finally {
      await prisma.snack.deleteMany({
        where: { id: { in: [goneSnack.id, lowSnack.id] } },
      });
    }
  });

  it('correctly excludes archived snacks from counts, needsRestock, and activity', async () => {
    // Create an archived snack with 0 quantity that would otherwise appear in gone/needsRestock
    const testArchivedSnack = await prisma.snack.create({
      data: {
        name: 'TEST_ARCHIVED_SNACK_FOR_DASHBOARD',
        category: SnackCategory.SWEET,
        quantity: 0,
        lowStockThreshold: 5,
        archivedAt: new Date(),
      },
    });

    try {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);

      // Verify archived snack is NOT in needsRestock
      const inNeedsRestock = res.body.needsRestock.some(
        (s: any) => s.id === testArchivedSnack.id || s.name === testArchivedSnack.name
      );
      expect(inNeedsRestock).toBe(false);

      // Verify archived snack is NOT in mostConsumedThisWeek
      const inMostConsumed = res.body.mostConsumedThisWeek.some(
        (s: any) => s.id === testArchivedSnack.id
      );
      expect(inMostConsumed).toBe(false);
    } finally {
      await prisma.snack.delete({
        where: { id: testArchivedSnack.id },
      });
    }
  });
});
