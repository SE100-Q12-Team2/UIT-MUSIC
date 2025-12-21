/*
  Warnings:

  - You are about to drop the `artists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `song_artists` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContributorRole" AS ENUM ('MAIN', 'FEATURED', 'PRODUCER', 'COMPOSER');

-- CreateEnum
CREATE TYPE "RecordLabelType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- DropForeignKey
ALTER TABLE "song_artists" DROP CONSTRAINT "song_artists_artist_id_fkey";

-- DropForeignKey
ALTER TABLE "song_artists" DROP CONSTRAINT "song_artists_song_id_fkey";

-- AlterTable
ALTER TABLE "record_labels" ADD COLUMN     "label_type" "RecordLabelType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "parentLabelId" INTEGER;

-- DropTable
DROP TABLE "artists";

-- DropTable
DROP TABLE "song_artists";

-- DropEnum
DROP TYPE "ArtistRole";

-- CreateTable
CREATE TABLE "SongContributor" (
    "songId" INTEGER NOT NULL,
    "labelId" INTEGER NOT NULL,
    "role" "ContributorRole" NOT NULL,

    CONSTRAINT "SongContributor_pkey" PRIMARY KEY ("songId","labelId","role")
);

-- AddForeignKey
ALTER TABLE "record_labels" ADD CONSTRAINT "record_labels_parentLabelId_fkey" FOREIGN KEY ("parentLabelId") REFERENCES "record_labels"("label_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongContributor" ADD CONSTRAINT "SongContributor_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongContributor" ADD CONSTRAINT "SongContributor_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "record_labels"("label_id") ON DELETE CASCADE ON UPDATE CASCADE;
