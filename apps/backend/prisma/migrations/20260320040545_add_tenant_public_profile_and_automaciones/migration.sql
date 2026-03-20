-- CreateEnum
CREATE TYPE "AutomacionTrigger" AS ENUM ('ORDER_DELIVERED', 'APPOINTMENT_COMPLETED', 'NEW_CONTACT');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "horario" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "Automacion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "trigger" "AutomacionTrigger" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Automacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomacionPaso" (
    "id" TEXT NOT NULL,
    "automacionId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "AutomacionPaso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomacionEjecucion" (
    "id" TEXT NOT NULL,
    "automacionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactNombre" TEXT,
    "pasoActual" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "ejecutadaAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomacionEjecucion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Automacion" ADD CONSTRAINT "Automacion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomacionPaso" ADD CONSTRAINT "AutomacionPaso_automacionId_fkey" FOREIGN KEY ("automacionId") REFERENCES "Automacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomacionEjecucion" ADD CONSTRAINT "AutomacionEjecucion_automacionId_fkey" FOREIGN KEY ("automacionId") REFERENCES "Automacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomacionEjecucion" ADD CONSTRAINT "AutomacionEjecucion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
