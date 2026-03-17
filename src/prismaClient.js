import { PrismaClient } from './generated/prisma/client.ts';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// 1. In Prisma 7, the adapter handles the connection string itself
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db"
});

// 2. Pass only the adapter to the client
export const prisma = new PrismaClient({ adapter });
