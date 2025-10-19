/*
  Warnings:

  - The primary key for the `playlist_songs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[playlist_id,song_id]` on the table `playlist_songs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."playlist_songs" DROP CONSTRAINT "playlist_songs_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "playlist_songs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."playlists" ADD COLUMN     "cover_image_url" VARCHAR(500);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_songs_playlist_id_song_id_key" ON "public"."playlist_songs"("playlist_id", "song_id");
