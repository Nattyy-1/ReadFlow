import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

export const apiLimiter = rateLimit({
  skip: () => config.nodeEnv === 'test',
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

export const strictLimiter = rateLimit({
  skip: () => config.nodeEnv === 'test',
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "High traffic detected, Please wait before trying again."
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
