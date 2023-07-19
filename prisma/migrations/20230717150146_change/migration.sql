-- DropForeignKey
ALTER TABLE "Repo" DROP CONSTRAINT "Repo_orgId_fkey";

-- AddForeignKey
ALTER TABLE "Repo" ADD CONSTRAINT "Repo_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
