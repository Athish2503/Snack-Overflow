import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import snackRoutes from './modules/snacks/snack.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import eventsRoutes from './modules/events/events.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import { authenticate } from './middleware/authenticate.js';
import { requireAdmin } from './middleware/authorize.js';
import { AuthRequest } from './types/express.js';

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(cors({
    origin: config.clientUrl,
    credentials: true,
  }));
  app.use(cookieParser(config.cookieSecret));
  app.use(express.json({ limit: '20mb' }));

  // Static uploads directory
  const uploadsDir = fs.existsSync(path.join(process.cwd(), 'apps', 'api'))
    ? path.join(process.cwd(), 'apps', 'api', 'public', 'uploads')
    : path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Base API ping
  app.get('/api', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Snack Overflow API operational' });
  });

  // Auth routes mounted under /api/auth and /auth
  app.use('/api/auth', authRoutes);
  app.use('/auth', authRoutes);

  // Snacks routes mounted under /api/snacks and /snacks
  app.use('/api/snacks', snackRoutes);
  app.use('/snacks', snackRoutes);

  // Upload routes mounted under /api/upload and /upload
  app.use('/api/upload', uploadRoutes);
  app.use('/upload', uploadRoutes);

  // Activity routes mounted under /api/activity and /activity (Admin only)
  app.use('/api/activity', activityRoutes);
  app.use('/activity', activityRoutes);

  // Admin routes mounted under /api/admin and /admin (Admin only)
  app.use('/api/admin', adminRoutes);
  app.use('/admin', adminRoutes);

  // Real-time Server-Sent Events (SSE) routes mounted under /api/events and /events
  app.use('/api/events', eventsRoutes);
  app.use('/events', eventsRoutes);

  // Test endpoints for RBAC verification
  app.get('/api/test/protected', authenticate, (req: AuthRequest, res: Response) => {
    res.status(200).json({ message: 'Protected resource accessed', user: req.user });
  });

  app.get('/api/test/admin-only', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
    res.status(200).json({ message: 'Admin resource accessed', user: req.user });
  });

  // Centralized 404 handler for API routes
  app.use('/api', notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};
