import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), logFormat)
  })
];

if (config.nodeEnv === 'production') {
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
  }

  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join('logs', 'app.log')
    })
  );
}

let level = 'debug';
if (config.nodeEnv === 'production') level = 'info';
if (config.nodeEnv === 'test') level = 'error';

const logger = winston.createLogger({
  level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports
});

export default logger;

export const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
