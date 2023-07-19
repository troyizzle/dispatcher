/*
  Warnings:

  - You are about to drop the column `orgUserInviteId` on the `Notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_orgUserInviteId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "orgUserInviteId";
