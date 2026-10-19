-- Super user role and daily activity used for monthly active users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS "UserActivityDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserActivityDay_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserActivityDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserActivityDay_userId_day_key" ON "UserActivityDay"("userId", "day");
CREATE INDEX IF NOT EXISTS "UserActivityDay_day_idx" ON "UserActivityDay"("day");
