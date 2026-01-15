-- AlterTable: Add session tracking fields to User table
ALTER TABLE "User" ADD COLUMN "lastActivityAt" TIMESTAMP(3),
ADD COLUMN "sessionCreatedAt" TIMESTAMP(3);
