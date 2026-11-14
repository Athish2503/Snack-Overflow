import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'development-secret-must-be-at-least-32-chars-long',
  cookieSecret: process.env.COOKIE_SECRET || 'development-cookie-secret-min-32-chars',
  databaseUrl: process.env.DATABASE_URL || '',
};
