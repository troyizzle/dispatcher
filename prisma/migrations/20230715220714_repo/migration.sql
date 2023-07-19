/*
  Warnings:

  - Added the required column `repoId` to the `Environment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "repoId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
