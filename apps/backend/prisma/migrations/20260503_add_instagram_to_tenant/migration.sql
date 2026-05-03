-- AlterTable: Tenant — add Instagram OAuth fields
ALTER TABLE "Tenant"
    ADD COLUMN IF NOT EXISTS "instagramPageId"     TEXT,
    ADD COLUMN IF NOT EXISTS "instagramPageName"   TEXT,
    ADD COLUMN IF NOT EXISTS "metaPageAccessToken" TEXT,
    ADD COLUMN IF NOT EXISTS "instagramConnectedAt" TIMESTAMP(3);
