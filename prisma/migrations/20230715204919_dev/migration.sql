-- CreateEnum
CREATE TYPE "EnumRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "OrgUsers" ADD COLUMN     "role" "EnumRole" NOT NULL DEFAULT 'MEMBER';
