-- AlterTable: add appId to roles (table is empty in production, safe migration)
ALTER TABLE "roles" ADD COLUMN "appId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "roles" ALTER COLUMN "appId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_appId_fkey"
  FOREIGN KEY ("appId") REFERENCES "tenant_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "roles_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "roles_appId_name_key" ON "roles"("appId", "name");
