-- AlterTable
ALTER TABLE "OrgUserInvite" ALTER COLUMN "accepted" DROP NOT NULL,
ALTER COLUMN "accepted" DROP DEFAULT;
