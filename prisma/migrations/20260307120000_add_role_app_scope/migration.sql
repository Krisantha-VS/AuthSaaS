-- AlterTable: add appId to roles (table is empty in production, safe migration)
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "appId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "roles" ALTER COLUMN "appId" DROP DEFAULT;

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'roles_appId_fkey' AND table_name = 'roles'
  ) THEN
    ALTER TABLE "roles" ADD CONSTRAINT "roles_appId_fkey"
      FOREIGN KEY ("appId") REFERENCES "tenant_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "roles_name_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "roles_appId_name_key" ON "roles"("appId", "name");
