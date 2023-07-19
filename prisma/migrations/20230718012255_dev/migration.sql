/*
  Warnings:

  - Added the required column `currentBranch` to the `Environment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "currentBranch" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "EnvironmentDeployment" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "githash" TEXT NOT NULL,
    "branch" TEXT NOT NULL,

    CONSTRAINT "EnvironmentDeployment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnvironmentDeployment" ADD CONSTRAINT "EnvironmentDeployment_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
