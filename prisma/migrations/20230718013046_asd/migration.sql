-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "currentHash" TEXT,
ALTER COLUMN "currentBranch" DROP NOT NULL;
