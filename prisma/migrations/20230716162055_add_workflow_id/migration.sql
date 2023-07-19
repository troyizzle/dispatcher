/*
  Warnings:

  - Added the required column `workflowId` to the `Repo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "workflowId" TEXT NOT NULL;
