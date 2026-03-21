-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReadingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "userBookId" INTEGER NOT NULL,
    CONSTRAINT "ReadingSession_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "UserBook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingSession" ("duration", "endTime", "id", "pagesRead", "startTime", "userBookId") SELECT "duration", "endTime", "id", "pagesRead", "startTime", "userBookId" FROM "ReadingSession";
DROP TABLE "ReadingSession";
ALTER TABLE "new_ReadingSession" RENAME TO "ReadingSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
