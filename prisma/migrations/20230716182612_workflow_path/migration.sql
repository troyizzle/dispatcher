/*
  Warnings:

  - Added the required column `workflowPath` to the `Repo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "workflowPath" TEXT NOT NULL;
