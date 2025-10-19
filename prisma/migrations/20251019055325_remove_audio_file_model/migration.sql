/*
  Warnings:

  - You are about to drop the `audio_files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."audio_files" DROP CONSTRAINT "audio_files_song_id_fkey";

-- DropTable
DROP TABLE "public"."audio_files";
