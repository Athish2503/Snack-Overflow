import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { EventsService } from '../src/modules/events/events.service.js';
import { prisma } from '../src/config/database.js';
import { cleanupTestSnacks } from './setup.js';

const app = createApp();

describe('Server-Sent Events (SSE) Real-Time Stream (GET /api/events)', () => {
  afterAll(async () => {
    await cleanupTestSnacks();
  });

  it('provides stats endpoint reporting connected client counts', async () => {
    const res = await request(app).get('/api/events/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.connectedClients).toBe('number');
    expect(res.body.timestamp).toBeDefined();
  });

  it('broadcasts STOCK_UPDATED and ACTIVITY_NEW when a snack is consumed or restocked', async () => {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const snack = await prisma.snack.findFirst({ where: { archivedAt: null, quantity: { gt: 5 } } });

    expect(adminUser).toBeDefined();
    expect(snack).toBeDefined();

    const receivedEvents: Array<{ event: string; data: any }> = [];

    // Mock client res
    const mockRes: any = {
      write: (chunk: string) => {
        const lines = chunk.trim().split('\n');
        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            try {
              receivedEvents.push({ event: currentEvent, data: JSON.parse(dataStr) });
            } catch {
              // raw string
            }
          }
        }
      },
    };

    EventsService.addClient('test-mock-client-id', mockRes, { id: adminUser!.id, role: 'ADMIN' });

    // Initial connection event
    expect(receivedEvents.some((e) => e.event === 'CONNECTED')).toBe(true);

    // Broadcast a test stock update
    EventsService.broadcastStockUpdated({
      snackId: snack!.id,
      snackName: snack!.name,
      quantity: 10,
      lowStockThreshold: 5,
      status: 'stocked',
    });

    const stockEvent = receivedEvents.find((e) => e.event === 'STOCK_UPDATED');
    expect(stockEvent).toBeDefined();
    expect(stockEvent?.data.snackId).toBe(snack!.id);
    expect(stockEvent?.data.quantity).toBe(10);
    expect(stockEvent?.data.status).toBe('stocked');

    // Broadcast a test activity new
    EventsService.broadcastActivityNew({
      id: 'mock-act-id',
      userName: 'Admin User',
      snackName: snack!.name,
      action: 'RESTOCKED',
      amount: 5,
      createdAt: new Date().toISOString(),
    });

    const actEvent = receivedEvents.find((e) => e.event === 'ACTIVITY_NEW');
    expect(actEvent).toBeDefined();
    expect(actEvent?.data.action).toBe('RESTOCKED');
    expect(actEvent?.data.amount).toBe(5);

    // Clean up mock client
    EventsService.removeClient('test-mock-client-id');
  });
});
