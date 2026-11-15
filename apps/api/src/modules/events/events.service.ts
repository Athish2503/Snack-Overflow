import { Response } from 'express';
import { EventEmitter } from 'events';
import { SnackStatus } from '../../utils/snackStatus.js';

export interface SseClient {
  id: string;
  res: Response;
  userId?: string;
  role?: string;
}

export type SseEventType =
  | 'STOCK_UPDATED'
  | 'ACTIVITY_NEW'
  | 'SNACK_MUTATED'
  | 'VOTE_UPDATED';

export interface StockUpdatedPayload {
  snackId: string;
  snackName?: string;
  quantity: number;
  lowStockThreshold: number;
  status: SnackStatus;
}

export interface ActivityNewPayload {
  id: string;
  userName: string;
  snackName: string;
  action: 'CONSUMED' | 'RESTOCKED';
  amount: number;
  createdAt: Date | string;
}

export interface SnackMutatedPayload {
  action: 'CREATED' | 'UPDATED' | 'ARCHIVED';
  snack: {
    id: string;
    name: string;
    category?: string;
    quantity?: number;
    lowStockThreshold?: number;
  };
}

export interface VoteUpdatedPayload {
  snackId: string;
  voteCount: number;
}

export class EventsService {
  private static emitter = new EventEmitter();
  private static clients: Map<string, SseClient> = new Map();
  private static heartbeatTimer: NodeJS.Timeout | null = null;

  static init() {
    this.emitter.setMaxListeners(100);

    // Heartbeat every 25 seconds to keep connection alive through proxies
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        this.sendComment('keep-alive');
      }, 25000);
      this.heartbeatTimer.unref(); // Don't block process exit
    }
  }

  static addClient(id: string, res: Response, user?: { id: string; role: string }) {
    this.init();

    const client: SseClient = {
      id,
      res,
      userId: user?.id,
      role: user?.role,
    };

    this.clients.set(id, client);

    // Send initial connected event
    this.sendToClient(res, 'CONNECTED', {
      clientId: id,
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, role: user.role } : null,
    });
  }

  static removeClient(id: string) {
    this.clients.delete(id);
  }

  static getClientCount(): number {
    return this.clients.size;
  }

  private static sendToClient(res: Response, event: string, data: any) {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // client connection already terminated
    }
  }

  private static sendComment(comment: string) {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(`: ${comment}\n\n`);
      } catch {
        this.removeClient(id);
      }
    }
  }

  static broadcast<T>(event: SseEventType, data: T) {
    for (const [id, client] of this.clients.entries()) {
      try {
        this.sendToClient(client.res, event, data);
      } catch {
        this.removeClient(id);
      }
    }
  }

  static broadcastStockUpdated(payload: StockUpdatedPayload) {
    this.broadcast('STOCK_UPDATED', payload);
  }

  static broadcastActivityNew(payload: ActivityNewPayload) {
    this.broadcast('ACTIVITY_NEW', payload);
  }

  static broadcastSnackMutated(payload: SnackMutatedPayload) {
    this.broadcast('SNACK_MUTATED', payload);
  }

  static broadcastVoteUpdated(payload: VoteUpdatedPayload) {
    this.broadcast('VOTE_UPDATED', payload);
  }
}
