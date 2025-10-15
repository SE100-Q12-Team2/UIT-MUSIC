/*
  Warnings:

  - The `audio_quality` column on the `listening_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."MediaStatus" AS ENUM ('Uploaded', 'Processing', 'Ready', 'Failed');

-- CreateEnum
CREATE TYPE "public"."RenditionType" AS ENUM ('MP3', 'HLS');

-- AlterTable
ALTER TABLE "public"."listening_history" DROP COLUMN "audio_quality",
ADD COLUMN     "audio_quality" "public"."AudioQuality";

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" SERIAL NOT NULL,
    "songId" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL,
    "keyMaster" TEXT NOT NULL,
    "mimeMaster" TEXT NOT NULL,
    "durationSec" INTEGER,
    "loudnessI" DOUBLE PRECISION,
    "status" "public"."MediaStatus" NOT NULL DEFAULT 'Uploaded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rendition" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "type" "public"."RenditionType" NOT NULL,
    "quality" "public"."AudioQuality" NOT NULL,
    "bitrateKbps" INTEGER,
    "codec" TEXT,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "status" "public"."MediaStatus" NOT NULL DEFAULT 'Ready',
    "hlsSegmentPrefix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rendition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_songId_key" ON "public"."Asset"("songId");

-- CreateIndex
CREATE INDEX "Asset_songId_status_idx" ON "public"."Asset"("songId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_bucket_keyMaster_key" ON "public"."Asset"("bucket", "keyMaster");

-- CreateIndex
CREATE INDEX "Rendition_assetId_type_quality_idx" ON "public"."Rendition"("assetId", "type", "quality");

-- CreateIndex
CREATE INDEX "Rendition_type_quality_idx" ON "public"."Rendition"("type", "quality");

-- CreateIndex
CREATE UNIQUE INDEX "Rendition_assetId_type_quality_key" ON "public"."Rendition"("assetId", "type", "quality");

-- CreateIndex
CREATE UNIQUE INDEX "Rendition_bucket_key_key" ON "public"."Rendition"("bucket", "key");

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_songId_fkey" FOREIGN KEY ("songId") REFERENCES "public"."songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rendition" ADD CONSTRAINT "Rendition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
