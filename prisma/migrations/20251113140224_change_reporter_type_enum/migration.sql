/*
  Warnings:

  - The values [User] on the enum `ReporterType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ReporterType_new" AS ENUM ('System', 'Listener', 'Label', 'External');
ALTER TABLE "public"."copyright_reports" ALTER COLUMN "reporter_type" TYPE "public"."ReporterType_new" USING ("reporter_type"::text::"public"."ReporterType_new");
ALTER TYPE "public"."ReporterType" RENAME TO "ReporterType_old";
ALTER TYPE "public"."ReporterType_new" RENAME TO "ReporterType";
DROP TYPE "public"."ReporterType_old";
COMMIT;
