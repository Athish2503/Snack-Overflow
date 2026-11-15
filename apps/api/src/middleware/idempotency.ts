import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';

interface CachedResponse {
  status: 'IN_FLIGHT' | 'COMPLETED';
  statusCode?: number;
  body?: any;
  createdAt: number;
}

// In-memory idempotency store with TTL (default 10 minutes)
const idempotencyStore = new Map<string, CachedResponse>();
const TTL_MS = 10 * 60 * 1000;

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.createdAt > TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function idempotency() {
  return (req: Request | AuthRequest, res: Response, next: NextFunction): void => {
    const rawKey = req.header('Idempotency-Key') || req.header('idempotency-key');

    // If no Idempotency-Key header is provided, proceed normally
    if (!rawKey) {
      return next();
    }

    const key = rawKey.trim();
    if (!key || key.length > 128) {
      res.status(400).json({
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key must be a non-empty string under 128 characters.',
        },
      });
      return;
    }

    const userId = (req as AuthRequest).user?.id || 'anonymous';
    const storeKey = `${userId}:${req.method}:${req.originalUrl || req.baseUrl + req.path}:${key}`;

    const existing = idempotencyStore.get(storeKey);

    if (existing) {
      if (existing.status === 'IN_FLIGHT') {
        res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'A request with this Idempotency-Key is currently in progress. Please retry shortly.',
          },
        });
        return;
      }

      if (existing.status === 'COMPLETED') {
        res.setHeader('Idempotent-Replay', 'true');
        res.status(existing.statusCode || 200).json(existing.body);
        return;
      }
    }

    // Mark as in-flight
    idempotencyStore.set(storeKey, {
      status: 'IN_FLIGHT',
      createdAt: Date.now(),
    });

    // Intercept response methods to cache completed response
    const originalJson = res.json.bind(res);

    res.json = (body: any): Response => {
      // Only cache 2xx or 4xx terminal responses; on server 5xx errors remove the lock so user can retry
      if (res.statusCode < 500) {
        idempotencyStore.set(storeKey, {
          status: 'COMPLETED',
          statusCode: res.statusCode,
          body,
          createdAt: Date.now(),
        });
      } else {
        idempotencyStore.delete(storeKey);
      }

      return originalJson(body);
    };

    // If request closes or aborts with an error before res.json
    res.on('close', () => {
      const current = idempotencyStore.get(storeKey);
      if (current && current.status === 'IN_FLIGHT') {
        idempotencyStore.delete(storeKey);
      }
    });

    next();
  };
}
