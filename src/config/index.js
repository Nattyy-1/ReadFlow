import dotenv from 'dotenv';
dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

export const config = {
  port: process.env.PORT || 5000,
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  appUrl: process.env.APP_URL,
  frontendUrl: process.env.FRONTEND_URL,
  redisUrl: process.env.REDIS_URL,
  mail: {
    host: process.env.MAIL_HOST || process.env.SMTP_HOST,
    port: process.env.MAIL_PORT || process.env.SMTP_PORT,
    user: process.env.MAIL_USER || process.env.SMTP_USER,
    password: process.env.MAIL_PASS || process.env.SMTP_PASS
  },
  bookApiKey: process.env.GOOGLE_BOOKS_API_KEY,
  nodeEnv: process.env.NODE_ENV,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }
}
