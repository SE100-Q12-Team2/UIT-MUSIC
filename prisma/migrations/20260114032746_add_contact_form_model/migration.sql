-- CreateEnum
CREATE TYPE "ContactFormStatus" AS ENUM ('Pending', 'InProgress', 'Resolved', 'Closed');

-- CreateTable
CREATE TABLE "contact_forms" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "message" TEXT NOT NULL,
    "status" "ContactFormStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_forms_user_id_idx" ON "contact_forms"("user_id");

-- CreateIndex
CREATE INDEX "contact_forms_status_idx" ON "contact_forms"("status");

-- CreateIndex
CREATE INDEX "contact_forms_created_at_idx" ON "contact_forms"("created_at");

-- AddForeignKey
ALTER TABLE "contact_forms" ADD CONSTRAINT "contact_forms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
