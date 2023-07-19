/*
  Warnings:

  - Changed the type of `workflowId` on the `Repo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Repo" DROP COLUMN "workflowId",
ADD COLUMN     "workflowId" INTEGER NOT NULL;
