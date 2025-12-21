/*
  Warnings:

  - The values [Main Artist,Featured Artist] on the enum `ArtistRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [Subscription Expiry,New Release,System Update,Copyright Notice] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Under Review] on the enum `ReportStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ArtistRole_new" AS ENUM ('MainArtist', 'FeaturedArtist', 'Composer', 'Producer');
ALTER TABLE "public"."song_artists" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "song_artists" ALTER COLUMN "role" TYPE "ArtistRole_new" USING ("role"::text::"ArtistRole_new");
ALTER TYPE "ArtistRole" RENAME TO "ArtistRole_old";
ALTER TYPE "ArtistRole_new" RENAME TO "ArtistRole";
DROP TYPE "public"."ArtistRole_old";
ALTER TABLE "song_artists" ALTER COLUMN "role" SET DEFAULT 'MainArtist';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('SubscriptionExpiry', 'NewRelease', 'SystemUpdate', 'CopyrightNotice');
ALTER TABLE "notifications" ALTER COLUMN "notification_type" TYPE "NotificationType_new" USING ("notification_type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReportStatus_new" AS ENUM ('Pending', 'UnderReview', 'Resolved', 'Dismissed');
ALTER TABLE "public"."copyright_reports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "copyright_reports" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "public"."ReportStatus_old";
ALTER TABLE "copyright_reports" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;

-- AlterTable
ALTER TABLE "song_artists" ALTER COLUMN "role" SET DEFAULT 'MainArtist';
