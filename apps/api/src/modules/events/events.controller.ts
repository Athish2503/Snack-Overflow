import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../../types/express.js';
import { EventsService } from './events.service.js';

export class EventsController {
  static subscribe(req: AuthRequest, res: Response) {
    const clientId = crypto.randomUUID();

    // Set standard SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Flush headers if supported
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    EventsService.addClient(clientId, res, req.user);

    req.on('close', () => {
      EventsService.removeClient(clientId);
    });
  }

  static getStats(_req: AuthRequest, res: Response) {
    res.status(200).json({
      connectedClients: EventsService.getClientCount(),
      timestamp: new Date().toISOString(),
    });
  }
}
