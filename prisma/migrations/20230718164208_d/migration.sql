-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "currentUrl" TEXT;

-- AlterTable
ALTER TABLE "EnvironmentDeployment" ADD COLUMN     "url" TEXT;
