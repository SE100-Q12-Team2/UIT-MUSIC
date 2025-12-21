-- CreateTable
CREATE TABLE "favorite_playlists" (
    "user_id" INTEGER NOT NULL,
    "playlist_id" INTEGER NOT NULL,
    "favorited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_playlists_pkey" PRIMARY KEY ("user_id","playlist_id")
);

-- CreateIndex
CREATE INDEX "favorite_playlists_favorited_at_idx" ON "favorite_playlists"("favorited_at");

-- AddForeignKey
ALTER TABLE "favorite_playlists" ADD CONSTRAINT "favorite_playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_playlists" ADD CONSTRAINT "favorite_playlists_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("playlist_id") ON DELETE CASCADE ON UPDATE CASCADE;
