-- CreateTable
CREATE TABLE "public"."Favorite" (
    "userId" BIGINT NOT NULL,
    "trackId" BIGINT NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","trackId")
);

-- CreateIndex
CREATE INDEX "Favorite_likedAt_idx" ON "public"."Favorite"("likedAt");
