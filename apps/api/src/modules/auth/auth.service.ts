import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { LoginInput } from './auth.schema.js';
import { AuthenticatedUser } from '../../types/express.js';

export class AuthService {
  static async login(input: LoginInput): Promise<{ user: AuthenticatedUser; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const safeUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.sessionSecret,
      { expiresIn: '7d' }
    );

    return { user: safeUser, token };
  }

  static async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User does not exist');
    }

    return user;
  }
}
