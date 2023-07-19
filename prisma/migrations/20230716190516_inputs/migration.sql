-- CreateEnum
CREATE TYPE "WorkflowInputTypes" AS ENUM ('CHOICE', 'STRING');

-- CreateTable
CREATE TABLE "WorkflowInput" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkflowInputTypes" NOT NULL,
    "description" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "options" TEXT[],
    "repoId" TEXT NOT NULL,

    CONSTRAINT "WorkflowInput_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkflowInput" ADD CONSTRAINT "WorkflowInput_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
