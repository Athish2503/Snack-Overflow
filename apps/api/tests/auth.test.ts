import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Auth & RBAC Module', () => {
  let memberCookie: string;
  let adminCookie: string;

  it('rejects invalid credentials with 401 and standard error contract', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@snackoverflow.local',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  });

  it('validates request payload with 400 on malformed input', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('authenticates seeded member successfully and sets HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@snackoverflow.local',
        password: 'member123',
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('member@snackoverflow.local');
    expect(res.body.user.role).toBe('MEMBER');
    expect(res.body.user.password).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : (cookies as unknown as string);
    expect(cookieHeader).toContain('access_token=');
    expect(cookieHeader.toLowerCase()).toContain('httponly');

    memberCookie = cookieHeader;
  });

  it('authenticates seeded admin successfully and sets HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@snackoverflow.local',
        password: 'admin123',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');

    const cookies = res.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : (cookies as unknown as string);
    adminCookie = cookieHeader;
  });

  it('restores current user session with GET /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', memberCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('member@snackoverflow.local');
    expect(res.body.user.role).toBe('MEMBER');
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/test/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('allows member access to regular protected route', async () => {
    const res = await request(app)
      .get('/api/test/protected')
      .set('Cookie', memberCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('member@snackoverflow.local');
  });

  it('forbids member access to admin-only route with 403', async () => {
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Cookie', memberCookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toBe('Admin access required');
  });

  it('allows admin access to admin-only route', async () => {
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('logs out and clears session cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : (cookies as unknown as string);
    expect(cookieHeader).toContain('access_token=;');
  });
});
