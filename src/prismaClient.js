import { PrismaClient } from './generated/prisma/client.ts';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { config } from './config/index.js';

const adapter = new PrismaBetterSqlite3({
  url: config.dbUrl || "file:./dev.db"
});

export const prisma = new PrismaClient({ adapter });
