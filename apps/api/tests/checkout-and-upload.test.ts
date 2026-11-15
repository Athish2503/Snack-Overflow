import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { SnackCategory, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = createApp();

describe('Checkout & Image Upload APIs', () => {
  let adminCookie: string;
  let memberCookie: string;
  let snack1Id: string;
  let snack2Id: string;

  afterEach(async () => {
    if (snack1Id || snack2Id) {
      await prisma.activity.deleteMany({
        where: { snackId: { in: [snack1Id, snack2Id].filter(Boolean) } },
      });
      await prisma.snack.deleteMany({
        where: { id: { in: [snack1Id, snack2Id].filter(Boolean) } },
      });
    }
  });

  beforeEach(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@snackoverflow.local', password: 'admin123' });
    const adminCookies = adminLogin.headers['set-cookie'];
    adminCookie = Array.isArray(adminCookies) ? adminCookies.join(';') : (adminCookies || '');

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@snackoverflow.local', password: 'member123' });
    const memberCookies = memberLogin.headers['set-cookie'];
    memberCookie = Array.isArray(memberCookies) ? memberCookies.join(';') : (memberCookies || '');

    // Find or create test snacks with unique names
    const s1 = await prisma.snack.create({
      data: {
        name: `Checkout Test Snack 1 ${Date.now()}`,
        category: SnackCategory.SWEET,
        quantity: 5,
        lowStockThreshold: 2,
        calories: 180,
        imageUrl: 'https://example.com/wafel.jpg',
        images: ['https://example.com/wafel1.jpg', 'https://example.com/wafel2.jpg'],
      },
    });
    snack1Id = s1.id;

    const s2 = await prisma.snack.create({
      data: {
        name: `Checkout Test Snack 2 ${Date.now()}`,
        category: SnackCategory.DRINK,
        quantity: 3,
        lowStockThreshold: 1,
        calories: 0,
        imageUrl: 'https://example.com/lime.jpg',
      },
    });
    snack2Id = s2.id;
  });

  describe('Multi-Item Cart Checkout (POST /api/snacks/checkout)', () => {
    it('successfully checks out multiple snacks atomically and creates activity rows', async () => {
      const res = await request(app)
        .post('/api/snacks/checkout')
        .set('Cookie', memberCookie)
        .send({
          items: [
            { snackId: snack1Id, amount: 2 },
            { snackId: snack2Id, amount: 1 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.message).toContain('Checkout successful');

      // Verify stock in database
      const check1 = await prisma.snack.findUnique({ where: { id: snack1Id } });
      const check2 = await prisma.snack.findUnique({ where: { id: snack2Id } });
      expect(check1?.quantity).toBe(3);
      expect(check2?.quantity).toBe(2);

      // Verify activity logs for these snacks
      const activities = await prisma.activity.findMany({
        where: { snackId: { in: [snack1Id, snack2Id] }, action: 'CONSUMED' },
      });
      expect(activities).toHaveLength(2);
    });

    it('aborts checkout atomically if one item has insufficient stock (409 conflict)', async () => {
      const res = await request(app)
        .post('/api/snacks/checkout')
        .set('Cookie', memberCookie)
        .send({
          items: [
            { snackId: snack1Id, amount: 2 }, // available: 5
            { snackId: snack2Id, amount: 10 }, // available: 3 -> FAILS!
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

      // Verify rollback: snack1 was NOT consumed
      const check1 = await prisma.snack.findUnique({ where: { id: snack1Id } });
      const check2 = await prisma.snack.findUnique({ where: { id: snack2Id } });
      expect(check1?.quantity).toBe(5);
      expect(check2?.quantity).toBe(3);

      // Verify zero activity logs created for these snacks
      const activities = await prisma.activity.findMany({
        where: { snackId: { in: [snack1Id, snack2Id] } },
      });
      expect(activities).toHaveLength(0);
    });
  });

  describe('Admin Image Upload (POST /api/upload)', () => {
    it('rejects upload for unauthenticated users with 401', async () => {
      const res = await request(app)
        .post('/api/upload')
        .send({ filename: 'test.jpg', data: 'dGVzdA==' });

      expect(res.status).toBe(401);
    });

    it('rejects upload for regular members with 403', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Cookie', memberCookie)
        .send({ filename: 'test.jpg', data: 'dGVzdA==' });

      expect(res.status).toBe(403);
    });

    it('allows admin to upload multiple images and returns public paths', async () => {
      const fakeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const res = await request(app)
        .post('/api/upload')
        .set('Cookie', adminCookie)
        .send({
          files: [
            { filename: 'snack1.png', data: fakeBase64 },
            { filename: 'snack2.png', data: fakeBase64 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.urls).toHaveLength(2);
      expect(res.body.urls[0]).toMatch(/^\/uploads\/.+\.png$/);
    });
  });
});
