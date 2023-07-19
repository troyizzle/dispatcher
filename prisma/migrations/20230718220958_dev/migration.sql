-- CreateTable
CREATE TABLE "OrgUserInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "EnumRole" NOT NULL DEFAULT 'MEMBER',
    "orgId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrgUserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgUserInvite_orgId_email_key" ON "OrgUserInvite"("orgId", "email");

-- AddForeignKey
ALTER TABLE "OrgUserInvite" ADD CONSTRAINT "OrgUserInvite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
