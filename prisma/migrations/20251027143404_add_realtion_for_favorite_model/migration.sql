/*
  Warnings:

  - You are about to drop the `Favorite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Favorite";

-- CreateTable
CREATE TABLE "public"."favorites" (
    "user_id" INTEGER NOT NULL,
    "song_id" INTEGER NOT NULL,
    "liked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","song_id")
);

-- CreateIndex
CREATE INDEX "favorites_liked_at_idx" ON "public"."favorites"("liked_at");

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;
