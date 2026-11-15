import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { SnackCategory } from '@prisma/client';

const app = createApp();

describe('Voting & Admin Snack Management (Phase 5)', () => {
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

  describe('Voting', () => {
    it('allows authenticated member to vote for a snack', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Vote Test Snack ${Date.now()}`,
          category: SnackCategory.SWEET,
          quantity: 10,
          lowStockThreshold: 5,
        },
      });

      const res = await request(app)
        .post(`/api/snacks/${snack.id}/vote`)
        .set('Cookie', memberCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.hasVoted).toBe(true);
      expect(res.body.data.voteCount).toBe(1);

      // Verify in database
      const vote = await prisma.vote.findUnique({
        where: {
          userId_snackId: {
            userId: memberUserId,
            snackId: snack.id,
          },
        },
      });
      expect(vote).toBeDefined();
    });

    it('translates duplicate vote conflict into HTTP 409 ALREADY_VOTED', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Duplicate Vote Snack ${Date.now()}`,
          category: SnackCategory.SAVOURY,
          quantity: 5,
          lowStockThreshold: 2,
        },
      });

      // First vote succeeds
      const firstRes = await request(app)
        .post(`/api/snacks/${snack.id}/vote`)
        .set('Cookie', memberCookie);
      expect(firstRes.status).toBe(200);

      // Second vote from same user fails with 409
      const secondRes = await request(app)
        .post(`/api/snacks/${snack.id}/vote`)
        .set('Cookie', memberCookie);
      expect(secondRes.status).toBe(409);
      expect(secondRes.body.error.code).toBe('ALREADY_VOTED');
    });

    it('enforces one vote per user per snack under concurrent duplicate vote requests', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Concurrent Vote Snack ${Date.now()}`,
          category: SnackCategory.DRINK,
          quantity: 5,
          lowStockThreshold: 2,
        },
      });

      // Fire 5 simultaneous vote requests from the SAME user
      const requests = Array.from({ length: 5 }).map(() =>
        request(app)
          .post(`/api/snacks/${snack.id}/vote`)
          .set('Cookie', memberCookie)
      );

      const results = await Promise.all(requests);
      const successes = results.filter((r) => r.status === 200);
      const conflicts = results.filter((r) => r.status === 409);

      // Exactly 1 succeeds, others get 409
      expect(successes.length).toBe(1);
      expect(conflicts.length).toBe(4);

      // Database has exactly 1 vote row
      const votesInDb = await prisma.vote.count({
        where: { snackId: snack.id, userId: memberUserId },
      });
      expect(votesInDb).toBe(1);
    });

    it('allows unvoting and is idempotent', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Unvote Test Snack ${Date.now()}`,
          category: SnackCategory.HEALTHY_ISH,
          quantity: 5,
          lowStockThreshold: 2,
        },
      });

      // Vote
      await request(app).post(`/api/snacks/${snack.id}/vote`).set('Cookie', memberCookie);

      // Unvote
      const unvoteRes = await request(app)
        .delete(`/api/snacks/${snack.id}/vote`)
        .set('Cookie', memberCookie);

      expect(unvoteRes.status).toBe(200);
      expect(unvoteRes.body.data.hasVoted).toBe(false);
      expect(unvoteRes.body.data.voteCount).toBe(0);

      // Idempotent unvote again
      const secondUnvoteRes = await request(app)
        .delete(`/api/snacks/${snack.id}/vote`)
        .set('Cookie', memberCookie);
      expect(secondUnvoteRes.status).toBe(200);
      expect(secondUnvoteRes.body.data.hasVoted).toBe(false);
    });
  });

  describe('Admin Snack Management (CRUD)', () => {
    it('forbids members from creating snacks with 403', async () => {
      const res = await request(app)
        .post('/api/snacks')
        .set('Cookie', memberCookie)
        .send({
          name: 'Forbidden Snack',
          category: 'SWEET',
          quantity: 5,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to create a new snack with 201', async () => {
      const uniqueName = `Admin Created Snack ${Date.now()}`;
      const res = await request(app)
        .post('/api/snacks')
        .set('Cookie', adminCookie)
        .send({
          name: uniqueName,
          category: 'SAVOURY',
          quantity: 10,
          lowStockThreshold: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(uniqueName);
      expect(res.body.data.quantity).toBe(10);
      expect(res.body.data.status).toBe('stocked');

      // Verify in DB and verify initial restock activity
      const snack = await prisma.snack.findUnique({ where: { name: uniqueName } });
      expect(snack).toBeDefined();

      const activity = await prisma.activity.findFirst({
        where: { snackId: snack!.id, action: 'RESTOCKED' },
      });
      expect(activity).toBeDefined();
      expect(activity?.amount).toBe(10);

      // Clean up test snack so it never pollutes the dev inventory
      await prisma.activity.deleteMany({ where: { snackId: snack!.id } });
      await prisma.snack.delete({ where: { id: snack!.id } });
    });

    it('rejects duplicate snack name with 409', async () => {
      const uniqueName = `Duplicate Name Snack ${Date.now()}`;
      await request(app)
        .post('/api/snacks')
        .set('Cookie', adminCookie)
        .send({
          name: uniqueName,
          category: 'DRINK',
          quantity: 5,
        });

      const duplicateRes = await request(app)
        .post('/api/snacks')
        .set('Cookie', adminCookie)
        .send({
          name: uniqueName,
          category: 'SWEET',
          quantity: 3,
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('DUPLICATE_NAME');
    });

    it('allows admin to update snack metadata (PATCH)', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Patch Test Snack ${Date.now()}`,
          category: SnackCategory.SWEET,
          quantity: 5,
          lowStockThreshold: 2,
        },
      });

      const res = await request(app)
        .patch(`/api/snacks/${snack.id}`)
        .set('Cookie', adminCookie)
        .send({
          name: `Updated Snack Name ${Date.now()}`,
          lowStockThreshold: 6,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.lowStockThreshold).toBe(6);
      expect(res.body.data.status).toBe('running_low'); // 5 <= 6
    });

    it('forbids members from updating snacks with 403', async () => {
      const res = await request(app)
        .patch('/api/snacks/00000000-0000-0000-0000-000000000000')
        .set('Cookie', memberCookie)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to soft delete a snack (DELETE -> 204) preserving activity records', async () => {
      const snack = await prisma.snack.create({
        data: {
          name: `Delete Test Snack ${Date.now()}`,
          category: SnackCategory.DRINK,
          quantity: 4,
          lowStockThreshold: 2,
        },
      });

      // Add an activity record
      await prisma.activity.create({
        data: {
          userId: memberUserId,
          snackId: snack.id,
          action: 'CONSUMED',
          amount: 1,
        },
      });

      // Member cannot delete
      const memberDelete = await request(app)
        .delete(`/api/snacks/${snack.id}`)
        .set('Cookie', memberCookie);
      expect(memberDelete.status).toBe(403);

      // Admin deletes
      const adminDelete = await request(app)
        .delete(`/api/snacks/${snack.id}`)
        .set('Cookie', adminCookie);
      expect(adminDelete.status).toBe(204);

      // Verify soft deleted: archivedAt is NOT NULL
      const deletedSnack = await prisma.snack.findUnique({ where: { id: snack.id } });
      expect(deletedSnack?.archivedAt).not.toBeNull();

      // Activity record is still intact
      const activity = await prisma.activity.findFirst({ where: { snackId: snack.id } });
      expect(activity).toBeDefined();

      // Snack is excluded from normal GET queries
      const getRes = await request(app)
        .get(`/api/snacks/${snack.id}`)
        .set('Cookie', memberCookie);
      expect(getRes.status).toBe(404);
    });
  });
});
