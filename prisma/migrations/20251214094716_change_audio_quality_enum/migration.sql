/*
  Warnings:

  - The values [Master] on the enum `AudioQuality` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AudioQuality_new" AS ENUM ('Q128kbps', 'Q320kbps', 'FLAC', 'MASTER');
ALTER TABLE "listening_history" ALTER COLUMN "audio_quality" TYPE "AudioQuality_new" USING ("audio_quality"::text::"AudioQuality_new");
ALTER TABLE "Rendition" ALTER COLUMN "quality" TYPE "AudioQuality_new" USING ("quality"::text::"AudioQuality_new");
ALTER TYPE "AudioQuality" RENAME TO "AudioQuality_old";
ALTER TYPE "AudioQuality_new" RENAME TO "AudioQuality";
DROP TYPE "public"."AudioQuality_old";
COMMIT;
