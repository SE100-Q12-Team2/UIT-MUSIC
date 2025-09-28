-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "method_id" SERIAL NOT NULL,
    "method_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("method_id")
);
