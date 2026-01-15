-- AlterTable
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN "lastFailedLoginAt" TIMESTAMP(3);
