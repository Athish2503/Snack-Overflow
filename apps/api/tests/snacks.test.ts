import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getSnackStatus } from '../src/utils/snackStatus.js';

const app = createApp();

describe('Snack Read APIs & Derived Status (Phase 3)', () => {
  let memberCookie: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@snackoverflow.local',
        password: 'member123',
      });
    const cookies = loginRes.headers['set-cookie'];
    memberCookie = Array.isArray(cookies) ? cookies.join(';') : (cookies as unknown as string);
  });

  describe('Derived Status Function Boundaries', () => {
    it('returns "gone" when quantity is 0', () => {
      expect(getSnackStatus(0, 5)).toBe('gone');
    });

    it('returns "running_low" when quantity is 1 and threshold is 5', () => {
      expect(getSnackStatus(1, 5)).toBe('running_low');
    });

    it('returns "running_low" when quantity is equal to threshold (5)', () => {
      expect(getSnackStatus(5, 5)).toBe('running_low');
    });

    it('returns "stocked" when quantity is above threshold (6 > 5)', () => {
      expect(getSnackStatus(6, 5)).toBe('stocked');
    });
  });

  describe('GET /api/snacks', () => {
    it('requires authentication and rejects with 401 when not logged in', async () => {
      const res = await request(app).get('/api/snacks');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns paginated list with derived status and vote info', async () => {
      const res = await request(app)
        .get('/api/snacks?page=1&limit=10')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Check fields of first item
      const item = res.body.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('lowStockThreshold');
      expect(item).toHaveProperty('status');
      expect(['stocked', 'running_low', 'gone']).toContain(item.status);
      expect(item).toHaveProperty('voteCount');
      expect(item).toHaveProperty('hasVoted');

      // Check pagination structure
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('filters correctly by category server-side', async () => {
      const res = await request(app)
        .get('/api/snacks?category=SAVOURY')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      for (const snack of res.body.data) {
        expect(snack.category).toBe('SAVOURY');
      }
    });

    it('filters correctly by status server-side (gone)', async () => {
      const res = await request(app)
        .get('/api/snacks?status=gone')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      for (const snack of res.body.data) {
        expect(snack.status).toBe('gone');
        expect(snack.quantity).toBe(0);
      }
    });

    it('filters correctly by status server-side (running_low)', async () => {
      const res = await request(app)
        .get('/api/snacks?status=running_low')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      for (const snack of res.body.data) {
        expect(snack.status).toBe('running_low');
        expect(snack.quantity).toBeGreaterThan(0);
        expect(snack.quantity).toBeLessThanOrEqual(snack.lowStockThreshold);
      }
    });

    it('filters correctly by status server-side (stocked)', async () => {
      const res = await request(app)
        .get('/api/snacks?status=stocked')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      for (const snack of res.body.data) {
        expect(snack.status).toBe('stocked');
        expect(snack.quantity).toBeGreaterThan(snack.lowStockThreshold);
      }
    });

    it('supports case-insensitive search by snack name', async () => {
      const res = await request(app)
        .get('/api/snacks?search=peAnUtS')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name.toLowerCase()).toContain('peanuts');
    });

    it('validates invalid page or limit with 400', async () => {
      const res = await request(app)
        .get('/api/snacks?page=-1')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/snacks/:id', () => {
    it('returns a single snack with detail, status, and vote count', async () => {
      const listRes = await request(app)
        .get('/api/snacks')
        .set('Cookie', memberCookie);
      const testSnack = listRes.body.data[0];

      const res = await request(app)
        .get(`/api/snacks/${testSnack.id}`)
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testSnack.id);
      expect(res.body.name).toBe(testSnack.name);
      expect(res.body.status).toBe(testSnack.status);
      expect(typeof res.body.voteCount).toBe('number');
      expect(typeof res.body.hasVoted).toBe('boolean');
    });

    it('returns 404 for non-existent snack id', async () => {
      const res = await request(app)
        .get('/api/snacks/00000000-0000-0000-0000-000000000000')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/snacks/summary', () => {
    it('returns aggregated status counts and Snack of the Week', async () => {
      const res = await request(app)
        .get('/api/snacks/summary')
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      expect(res.body.counts).toBeDefined();
      expect(typeof res.body.counts.stocked).toBe('number');
      expect(typeof res.body.counts.running_low).toBe('number');
      expect(typeof res.body.counts.gone).toBe('number');

      // The sum of counts should match total snacks
      const total = res.body.counts.stocked + res.body.counts.running_low + res.body.counts.gone;
      expect(total).toBeGreaterThanOrEqual(6);

      // Verify Snack of the Week
      expect(res.body).toHaveProperty('snackOfTheWeek');
      if (res.body.snackOfTheWeek !== null) {
        expect(res.body.snackOfTheWeek).toHaveProperty('id');
        expect(res.body.snackOfTheWeek).toHaveProperty('name');
        expect(res.body.snackOfTheWeek).toHaveProperty('voteCount');
        expect(res.body.snackOfTheWeek.voteCount).toBeGreaterThan(0);
      }
    });
  });
});
