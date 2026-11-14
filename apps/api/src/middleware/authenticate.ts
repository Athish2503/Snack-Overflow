import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';

interface JwtPayload {
  userId: string;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.sessionSecret) as JwtPayload;
    } catch {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired session');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User not found or session invalid');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
