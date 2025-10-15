-- CreateTable
CREATE TABLE "public"."ResetPasswordToken" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(1000) NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetPasswordToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResetPasswordToken_token_key" ON "public"."ResetPasswordToken"("token");

-- CreateIndex
CREATE INDEX "ResetPasswordToken_expiresAt_idx" ON "public"."ResetPasswordToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ResetPasswordToken_userId_idx" ON "public"."ResetPasswordToken"("userId");

-- AddForeignKey
ALTER TABLE "public"."ResetPasswordToken" ADD CONSTRAINT "ResetPasswordToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
