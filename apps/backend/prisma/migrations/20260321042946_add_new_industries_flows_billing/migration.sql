-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Industry" ADD VALUE 'CLOTHING_STORE';
ALTER TYPE "Industry" ADD VALUE 'GYM';
ALTER TYPE "Industry" ADD VALUE 'PHARMACY';
ALTER TYPE "Industry" ADD VALUE 'VETERINARY';
ALTER TYPE "Industry" ADD VALUE 'HOTEL';
ALTER TYPE "Industry" ADD VALUE 'BAKERY';
ALTER TYPE "Industry" ADD VALUE 'WORKSHOP';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "flujosActivos" TEXT NOT NULL DEFAULT 'ventas,citas';

-- CreateTable
CREATE TABLE "PagoRegistro" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "wompiRef" TEXT,
    "wompiId" TEXT,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoRegistro_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PagoRegistro" ADD CONSTRAINT "PagoRegistro_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
