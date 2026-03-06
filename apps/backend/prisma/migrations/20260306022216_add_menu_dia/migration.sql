-- CreateTable
CREATE TABLE "MenuDia" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "MenuDia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatoMenuDia" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "menuDiaId" TEXT NOT NULL,

    CONSTRAINT "PlatoMenuDia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MenuDia" ADD CONSTRAINT "MenuDia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatoMenuDia" ADD CONSTRAINT "PlatoMenuDia_menuDiaId_fkey" FOREIGN KEY ("menuDiaId") REFERENCES "MenuDia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
