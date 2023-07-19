/*
  Warnings:

  - The values [CHOICE,STRING] on the enum `WorkflowInputTypes` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkflowInputTypes_new" AS ENUM ('choice', 'string');
ALTER TABLE "WorkflowInput" ALTER COLUMN "type" TYPE "WorkflowInputTypes_new" USING ("type"::text::"WorkflowInputTypes_new");
ALTER TYPE "WorkflowInputTypes" RENAME TO "WorkflowInputTypes_old";
ALTER TYPE "WorkflowInputTypes_new" RENAME TO "WorkflowInputTypes";
DROP TYPE "WorkflowInputTypes_old";
COMMIT;
