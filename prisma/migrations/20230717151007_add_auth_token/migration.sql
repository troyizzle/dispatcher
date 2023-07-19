/*
  Warnings:

  - Added the required column `authToken` to the `Repo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "authToken" TEXT NOT NULL;
