-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profile_image" VARCHAR(500);
