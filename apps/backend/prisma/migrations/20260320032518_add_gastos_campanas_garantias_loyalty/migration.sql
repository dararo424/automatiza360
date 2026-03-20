-- CreateEnum
CREATE TYPE "CampañaStatus" AS ENUM ('BORRADOR', 'ENVIANDO', 'ENVIADA', 'ERROR');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "puntos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "puntosUsados" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaña" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "status" "CampañaStatus" NOT NULL DEFAULT 'BORRADOR',
    "totalEnviado" INTEGER NOT NULL DEFAULT 0,
    "enviadaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaña_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Garantia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clientePhone" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "fechaCompra" TIMESTAMP(3) NOT NULL,
    "mesesGarantia" INTEGER NOT NULL DEFAULT 12,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "ticketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Garantia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaña" ADD CONSTRAINT "Campaña_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Garantia" ADD CONSTRAINT "Garantia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
