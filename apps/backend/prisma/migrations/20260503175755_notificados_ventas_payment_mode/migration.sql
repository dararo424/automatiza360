-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('MANUAL', 'TEXT', 'WOMPI');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "paymentText" TEXT,
ADD COLUMN     "resumenCierreHora" TEXT NOT NULL DEFAULT '20:00',
ADD COLUMN     "resumenMatinalHora" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN     "wompiIntegritySecret" TEXT,
ADD COLUMN     "wompiPublicKey" TEXT;

-- CreateTable
CREATE TABLE "NotificadoVentas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "resumenMatinal" BOOLEAN NOT NULL DEFAULT true,
    "resumenCierre" BOOLEAN NOT NULL DEFAULT false,
    "notifInstantanea" BOOLEAN NOT NULL DEFAULT false,
    "montoMinimo" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificadoVentas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificadoVentas_tenantId_active_idx" ON "NotificadoVentas"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "NotificadoVentas_tenantId_phone_key" ON "NotificadoVentas"("tenantId", "phone");

-- AddForeignKey
ALTER TABLE "NotificadoVentas" ADD CONSTRAINT "NotificadoVentas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
