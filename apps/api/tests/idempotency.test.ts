import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { randomUUID } from 'crypto';

const app = createApp();

describe('Phase 11: Idempotency-Key Support for Consume Retries', () => {
  let memberCookie: string;
  let testSnackId: string;

  beforeAll(async () => {
    // Login as member
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@snackoverflow.local', password: 'member123' });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];
    memberCookie = Array.isArray(cookies) ? cookies.join('; ') : (cookies ?? '');

    // Create a temporary snack with quantity 10
    const snack = await prisma.snack.create({
      data: {
        name: `Idempotency Test Snack ${Date.now()}`,
        category: 'SWEET',
        quantity: 10,
        lowStockThreshold: 2,
        calories: 120,
      },
    });
    testSnackId = snack.id;
  });

  it('executes normally without Idempotency-Key header', async () => {
    const res = await request(app)
      .post(`/api/snacks/${testSnackId}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(9);
    expect(res.headers['idempotent-replay']).toBeUndefined();
  });

  it('rejects an overly long Idempotency-Key', async () => {
    const res = await request(app)
      .post(`/api/snacks/${testSnackId}/consume`)
      .set('Cookie', memberCookie)
      .set('Idempotency-Key', 'k'.repeat(200))
      .send({ amount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('performs first consume request with Idempotency-Key and decrements quantity', async () => {
    const idempotencyKey = randomUUID();

    const res1 = await request(app)
      .post(`/api/snacks/${testSnackId}/consume`)
      .set('Cookie', memberCookie)
      .set('Idempotency-Key', idempotencyKey)
      .send({ amount: 2 });

    expect(res1.status).toBe(200);
    expect(res1.body.data.quantity).toBe(7);
    expect(res1.headers['idempotent-replay']).toBeUndefined();

    // Replay identical request with same key
    const res2 = await request(app)
      .post(`/api/snacks/${testSnackId}/consume`)
      .set('Cookie', memberCookie)
      .set('Idempotency-Key', idempotencyKey)
      .send({ amount: 2 });

    expect(res2.status).toBe(200);
    // Header indicates it was a replay
    expect(res2.headers['idempotent-replay']).toBe('true');
    // Body matches the previous response exactly (quantity is still 7, not decremented to 5!)
    expect(res2.body.data.quantity).toBe(7);

    // Verify database record has quantity 7
    const inDb = await prisma.snack.findUnique({ where: { id: testSnackId } });
    expect(inDb?.quantity).toBe(7);
  });

  it('cleans up test snack after tests', async () => {
    await prisma.activity.deleteMany({ where: { snackId: testSnackId } });
    await prisma.snack.delete({ where: { id: testSnackId } });
  });
});
