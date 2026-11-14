import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    });
  }

  // Handle JSON parse errors from express.json()
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON payload',
      },
    });
  }

  console.error('[Unhandled Error]', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
};
