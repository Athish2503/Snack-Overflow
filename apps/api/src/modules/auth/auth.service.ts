import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { LoginInput, RegisterInput } from './auth.schema.js';
import { AuthenticatedUser } from '../../types/express.js';

export class AuthService {
  static async register(input: RegisterInput): Promise<{ user: AuthenticatedUser; token: string }> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'MEMBER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.sessionSecret,
      { expiresIn: '7d' }
    );

    return { user, token };
  }

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
