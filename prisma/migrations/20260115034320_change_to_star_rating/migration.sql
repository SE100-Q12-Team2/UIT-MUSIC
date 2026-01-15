/*
  Warnings:

  - The values [Like,Dislike] on the enum `Rating` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Rating_new" AS ENUM ('ONE_STAR', 'TWO_STAR', 'THREE_STAR', 'FOUR_STAR', 'FIVE_STAR');
ALTER TABLE "user_song_ratings" ALTER COLUMN "rating" TYPE "Rating_new" USING ("rating"::text::"Rating_new");
ALTER TYPE "Rating" RENAME TO "Rating_old";
ALTER TYPE "Rating_new" RENAME TO "Rating";
DROP TYPE "public"."Rating_old";
COMMIT;
