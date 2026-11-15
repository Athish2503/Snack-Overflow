import { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service.js';
import { AuthRequest } from '../../types/express.js';
import { config } from '../../config/env.js';

const COOKIE_NAME = 'access_token';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response) {
    const { user, token } = await AuthService.register(req.body);

    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.status(201).json({
      user,
    });
  }

  static async login(req: Request, res: Response) {
    const { user, token } = await AuthService.login(req.body);

    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.status(200).json({
      user,
    });
  }

  static async getMe(req: AuthRequest, res: Response) {
    const user = await AuthService.getMe(req.user!.id);
    res.status(200).json({
      user,
    });
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      message: 'Logged out successfully',
    });
  }
}
