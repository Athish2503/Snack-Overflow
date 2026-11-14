import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import snackRoutes from './modules/snacks/snack.routes.js';
import { authenticate } from './middleware/authenticate.js';
import { requireAdmin } from './middleware/authorize.js';
import { AuthRequest } from './types/express.js';

export const createApp = (): Express => {
  const app = express();

  app.use(cors({
    origin: config.clientUrl,
    credentials: true,
  }));
  app.use(cookieParser(config.cookieSecret));
  app.use(express.json());

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
