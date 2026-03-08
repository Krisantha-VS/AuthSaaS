ALTER TABLE "tenants" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "tenants" ADD COLUMN "resetTokenExp" TIMESTAMP(3);
