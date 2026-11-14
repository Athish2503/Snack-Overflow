import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';

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

  // Centralized 404 handler for API routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred';

    res.status(statusCode).json({
      error: {
        code,
        message,
      },
    });
  });

  return app;
};
