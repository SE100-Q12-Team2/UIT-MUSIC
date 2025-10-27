-- CreateEnum
CREATE TYPE "public"."FollowType" AS ENUM ('Artist', 'Label');

-- CreateTable
CREATE TABLE "public"."follows" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "target_type" "public"."FollowType" NOT NULL,
    "target_id" INTEGER NOT NULL,
    "followed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "follows_followed_at_idx" ON "public"."follows"("followed_at");

-- CreateIndex
CREATE INDEX "follows_target_type_target_id_idx" ON "public"."follows"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "follows_user_id_idx" ON "public"."follows"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_user_id_target_type_target_id_key" ON "public"."follows"("user_id", "target_type", "target_id");

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
