import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { ApiError } from '../utils/ApiError.js';

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new ApiError(403, 'FORBIDDEN', 'Admin access required'));
  }

  next();
};
