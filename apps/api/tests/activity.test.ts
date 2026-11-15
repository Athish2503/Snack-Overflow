import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Activity Log Module (Admin Only)', () => {
  let adminCookie: string;
  let memberCookie: string;

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects member requests with 403 FORBIDDEN', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'member@snackoverflow.local',
      password: 'member123',
    });
    expect(loginRes.status).toBe(200);
    memberCookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .get('/api/activity')
      .set('Cookie', memberCookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows admin requests with 200 and returns activity logs with pagination', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@snackoverflow.local',
      password: 'admin123',
    });
    expect(loginRes.status).toBe(200);
    adminCookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .get('/api/activity?page=1&limit=10')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
    expect(typeof res.body.pagination.totalItems).toBe('number');
    expect(typeof res.body.pagination.totalPages).toBe('number');

    if (res.body.data.length > 0) {
      const item = res.body.data[0];
      expect(item.id).toBeDefined();
      expect(item.action).toMatch(/CONSUMED|RESTOCKED/);
      expect(typeof item.amount).toBe('number');
      expect(item.user).toBeDefined();
      expect(item.user.name).toBeDefined();
      expect(item.snack).toBeDefined();
      expect(item.snack.name).toBeDefined();
    }
  });

  it('filters by action (CONSUMED vs RESTOCKED)', async () => {
    const res = await request(app)
      .get('/api/activity?action=CONSUMED')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    res.body.data.forEach((item: any) => {
      expect(item.action).toBe('CONSUMED');
    });
  });
});
