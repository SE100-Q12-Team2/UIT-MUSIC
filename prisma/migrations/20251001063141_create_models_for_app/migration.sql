-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('Listener', 'Label', 'Admin');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('Active', 'Suspended', 'Banned');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('Pending', 'Completed', 'Failed', 'Refunded');

-- CreateEnum
CREATE TYPE "public"."AudioQuality" AS ENUM ('128kbps', '320kbps', 'FLAC', 'Master');

-- CreateEnum
CREATE TYPE "public"."ArtistRole" AS ENUM ('Main Artist', 'Featured Artist', 'Composer', 'Producer');

-- CreateEnum
CREATE TYPE "public"."CopyrightStatus" AS ENUM ('Clear', 'Disputed', 'Violation');

-- CreateEnum
CREATE TYPE "public"."Rating" AS ENUM ('Like', 'Dislike');

-- CreateEnum
CREATE TYPE "public"."AdType" AS ENUM ('Audio', 'Banner', 'Video');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('Subscription Expiry', 'New Release', 'System Update', 'Copyright Notice');

-- CreateEnum
CREATE TYPE "public"."ReporterType" AS ENUM ('System', 'User', 'Label', 'External');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('Pending', 'Under Review', 'Resolved', 'Dismissed');

-- CreateEnum
CREATE TYPE "public"."PeriodType" AS ENUM ('Daily', 'Weekly', 'Monthly');

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "date_of_birth" DATE,
    "gender" "public"."Gender",
    "user_role" "public"."UserRole" NOT NULL,
    "account_status" "public"."AccountStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."subscription_plans" (
    "plan_id" SERIAL NOT NULL,
    "plan_name" VARCHAR(100) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "public"."user_subscriptions" (
    "subscription_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "transaction_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "subscription_id" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "transaction_status" "public"."TransactionStatus" NOT NULL DEFAULT 'Pending',
    "transaction_reference" VARCHAR(255),
    "invoice_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "public"."genres" (
    "genre_id" SERIAL NOT NULL,
    "genre_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "public"."artists" (
    "artist_id" SERIAL NOT NULL,
    "artist_name" VARCHAR(255) NOT NULL,
    "biography" TEXT,
    "profile_image" VARCHAR(500),
    "has_public_profile" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("artist_id")
);

-- CreateTable
CREATE TABLE "public"."record_labels" (
    "label_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "label_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "website" VARCHAR(255),
    "contact_email" VARCHAR(255),
    "has_public_profile" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_labels_pkey" PRIMARY KEY ("label_id")
);

-- CreateTable
CREATE TABLE "public"."albums" (
    "album_id" SERIAL NOT NULL,
    "album_title" VARCHAR(255) NOT NULL,
    "album_description" TEXT,
    "cover_image" VARCHAR(500),
    "release_date" DATE,
    "label_id" INTEGER,
    "total_tracks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("album_id")
);

-- CreateTable
CREATE TABLE "public"."songs" (
    "song_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "language" VARCHAR(50),
    "lyrics" TEXT,
    "album_id" INTEGER,
    "genre_id" INTEGER,
    "label_id" INTEGER NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "copyright_status" "public"."CopyrightStatus" NOT NULL DEFAULT 'Clear',
    "play_count" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("song_id")
);

-- CreateTable
CREATE TABLE "public"."song_artists" (
    "song_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "role" "public"."ArtistRole" NOT NULL DEFAULT 'Main Artist',

    CONSTRAINT "song_artists_pkey" PRIMARY KEY ("song_id","artist_id")
);

-- CreateTable
CREATE TABLE "public"."audio_files" (
    "file_id" SERIAL NOT NULL,
    "song_id" INTEGER NOT NULL,
    "quality" "public"."AudioQuality" NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "is_master" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_files_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "public"."playlists" (
    "playlist_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "playlist_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("playlist_id")
);

-- CreateTable
CREATE TABLE "public"."playlist_songs" (
    "playlist_id" INTEGER NOT NULL,
    "song_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_songs_pkey" PRIMARY KEY ("playlist_id","song_id")
);

-- CreateTable
CREATE TABLE "public"."listening_history" (
    "history_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "song_id" INTEGER NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_listened" INTEGER,
    "audio_quality" VARCHAR(20),
    "device_info" VARCHAR(255),

    CONSTRAINT "listening_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "user_id" INTEGER NOT NULL,
    "preferred_genres" JSONB,
    "preferred_languages" JSONB,
    "explicit_content" BOOLEAN NOT NULL DEFAULT false,
    "auto_play" BOOLEAN NOT NULL DEFAULT true,
    "high_quality_streaming" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."user_song_ratings" (
    "user_id" INTEGER NOT NULL,
    "song_id" INTEGER NOT NULL,
    "rating" "public"."Rating" NOT NULL,
    "rated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_song_ratings_pkey" PRIMARY KEY ("user_id","song_id")
);

-- CreateTable
CREATE TABLE "public"."advertisements" (
    "ad_id" SERIAL NOT NULL,
    "ad_name" VARCHAR(255) NOT NULL,
    "ad_type" "public"."AdType" NOT NULL,
    "file_path" VARCHAR(500),
    "duration" INTEGER,
    "target_audience" JSONB,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("ad_id")
);

-- CreateTable
CREATE TABLE "public"."ad_impressions" (
    "impression_id" SERIAL NOT NULL,
    "ad_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "displayed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("impression_id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_type" "public"."NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "public"."copyright_reports" (
    "report_id" SERIAL NOT NULL,
    "song_id" INTEGER NOT NULL,
    "reporter_type" "public"."ReporterType" NOT NULL,
    "reporter_id" INTEGER,
    "report_reason" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'Pending',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "copyright_reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "public"."daily_statistics" (
    "stat_date" DATE NOT NULL,
    "total_plays" BIGINT NOT NULL DEFAULT 0,
    "unique_listeners" INTEGER NOT NULL DEFAULT 0,
    "premium_users_count" INTEGER NOT NULL DEFAULT 0,
    "new_registrations" INTEGER NOT NULL DEFAULT 0,
    "ad_impressions" BIGINT NOT NULL DEFAULT 0,
    "revenue_subscription" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "revenue_ads" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_statistics_pkey" PRIMARY KEY ("stat_date")
);

-- CreateTable
CREATE TABLE "public"."trending_songs" (
    "trending_id" SERIAL NOT NULL,
    "song_id" INTEGER NOT NULL,
    "period_type" "public"."PeriodType" NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "play_count" BIGINT NOT NULL,
    "rank_position" INTEGER NOT NULL,

    CONSTRAINT "trending_songs_pkey" PRIMARY KEY ("trending_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_reference_key" ON "public"."transactions"("transaction_reference");

-- CreateIndex
CREATE UNIQUE INDEX "genres_genre_name_key" ON "public"."genres"("genre_name");

-- CreateIndex
CREATE UNIQUE INDEX "record_labels_user_id_key" ON "public"."record_labels"("user_id");

-- CreateIndex
CREATE INDEX "songs_play_count_idx" ON "public"."songs"("play_count" DESC);

-- CreateIndex
CREATE INDEX "songs_upload_date_idx" ON "public"."songs"("upload_date" DESC);

-- CreateIndex
CREATE INDEX "songs_genre_id_is_active_idx" ON "public"."songs"("genre_id", "is_active");

-- CreateIndex
CREATE INDEX "songs_language_idx" ON "public"."songs"("language");

-- CreateIndex
CREATE INDEX "listening_history_user_id_played_at_idx" ON "public"."listening_history"("user_id", "played_at" DESC);

-- CreateIndex
CREATE INDEX "listening_history_song_id_played_at_idx" ON "public"."listening_history"("song_id", "played_at" DESC);

-- CreateIndex
CREATE INDEX "listening_history_played_at_idx" ON "public"."listening_history"("played_at");

-- CreateIndex
CREATE INDEX "ad_impressions_ad_id_displayed_at_idx" ON "public"."ad_impressions"("ad_id", "displayed_at");

-- CreateIndex
CREATE UNIQUE INDEX "trending_songs_song_id_period_type_period_start_key" ON "public"."trending_songs"("song_id", "period_type", "period_start");

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("subscription_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("method_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."record_labels" ADD CONSTRAINT "record_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."albums" ADD CONSTRAINT "albums_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."record_labels"("label_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."songs" ADD CONSTRAINT "songs_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("album_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."songs" ADD CONSTRAINT "songs_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("genre_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."songs" ADD CONSTRAINT "songs_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."record_labels"("label_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."song_artists" ADD CONSTRAINT "song_artists_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."song_artists" ADD CONSTRAINT "song_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("artist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audio_files" ADD CONSTRAINT "audio_files_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlist_songs" ADD CONSTRAINT "playlist_songs_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("playlist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlist_songs" ADD CONSTRAINT "playlist_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listening_history" ADD CONSTRAINT "listening_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listening_history" ADD CONSTRAINT "listening_history_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_song_ratings" ADD CONSTRAINT "user_song_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_song_ratings" ADD CONSTRAINT "user_song_ratings_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_impressions" ADD CONSTRAINT "ad_impressions_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "public"."advertisements"("ad_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_impressions" ADD CONSTRAINT "ad_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."copyright_reports" ADD CONSTRAINT "copyright_reports_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."copyright_reports" ADD CONSTRAINT "copyright_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trending_songs" ADD CONSTRAINT "trending_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE RESTRICT ON UPDATE CASCADE;
