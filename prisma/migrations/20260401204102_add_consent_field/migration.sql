-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReminderSent" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "cartData" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Lead" ("capturedAt", "cartData", "createdAt", "email", "id", "lastReminderSent", "shop", "status") SELECT "capturedAt", "cartData", "createdAt", "email", "id", "lastReminderSent", "shop", "status" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_shop_email_idx" ON "Lead"("shop", "email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
