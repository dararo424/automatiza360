-- CreateTable
CREATE TABLE "TallaConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "alturaMin" DOUBLE PRECISION NOT NULL,
    "alturaMax" DOUBLE PRECISION NOT NULL,
    "pesoMin" DOUBLE PRECISION NOT NULL,
    "pesoMax" DOUBLE PRECISION NOT NULL,
    "cinturaMin" DOUBLE PRECISION NOT NULL,
    "cinturaMax" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TallaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TallaConsulta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientePhone" TEXT NOT NULL,
    "altura" DOUBLE PRECISION NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "cintura" DOUBLE PRECISION,
    "tallaRecomendada" TEXT NOT NULL,
    "confianza" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TallaConsulta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TallaConfig" ADD CONSTRAINT "TallaConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TallaConsulta" ADD CONSTRAINT "TallaConsulta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
