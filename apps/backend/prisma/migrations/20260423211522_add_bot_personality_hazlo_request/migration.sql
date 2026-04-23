-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "botName" TEXT,
ADD COLUMN     "botTone" TEXT NOT NULL DEFAULT 'AMIGABLE';

-- CreateTable
CREATE TABLE "HazloRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HazloRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HazloRequest" ADD CONSTRAINT "HazloRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
