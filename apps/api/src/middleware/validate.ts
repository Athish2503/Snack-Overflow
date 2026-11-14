import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error';
        return next(new ApiError(400, 'VALIDATION_ERROR', message));
      }
      return next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error';
        return next(new ApiError(400, 'VALIDATION_ERROR', message));
      }
      return next(error);
    }
  };
};
