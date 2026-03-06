/**
 * Seed: carga el menú completo de Galettes & Co
 * Tenant slug: restaurante-mi-vecina
 *
 * Ejecutar desde apps/backend/:
 *   npx ts-node -r tsconfig-paths/register src/seeds/seed-galettes-menu.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const productos = [
  // ── MENÚ GOURMET ──────────────────────────────────────────────────────
  {
    name: 'Milanesa de Pollo a la Napolitana',
    description:
      'Delicioso filete de pollo apanado y bañado con nuestra exquisita salsa Napolitana de la casa con queso mozzarella gratinado. Incluye acompañamientos a elegir: Sopa de Pastas, Arroz con ajonjolí, Papa amarilla con finas hierbas, Ensalada, Fresco y Postre.',
    price: 20000,
  },
  {
    name: 'Lomo de Res Salteado con Vegetales al Wok',
    description:
      'Deliciosas julianas de res asadas y salteadas con soya y vegetales al wok. Incluye acompañamientos a elegir: Sopa de Pastas, Arroz con ajonjolí, Papa amarilla con finas hierbas, Ensalada, Fresco y Postre.',
    price: 20000,
  },
  {
    name: 'Filete de Pechuga o Res Asado',
    description:
      'Exquisitos filetes asados a la plancha. Incluye acompañamientos a elegir: Sopa de Pastas, Arroz con ajonjolí, Papa amarilla con finas hierbas, Ensalada, Fresco y Postre.',
    price: 18000,
  },
  {
    name: 'Bandeja Paisa',
    description:
      'Plato típico colombiano. Ingredientes: arroz, frijoles, chicharrón, huevo frito, chorizo, morcilla, aguacate y arepa. Cambios disponibles en el chicharrón: carne asada, chuleta o pollo.',
    price: 18000,
  },

  // ── MAÑANAS Y TARDES ──────────────────────────────────────────────────
  {
    name: 'Crepe Amanecer',
    description:
      'Delicioso crepe hecho con masa madre, relleno de huevos a tu gusto y servido con porción de fruta. Acompañado de Café en Leche o Tinto.',
    price: 13000,
  },
  {
    name: 'Waffle Matinal',
    description:
      'Exquisito waffle de pandebono con queso crema, jamón y huevo frito. Acompañado de Café en Leche o Tinto.',
    price: 15000,
  },
  {
    name: 'Sandwich Atulado',
    description:
      'Delicioso sándwich con pan baguette, cebolla escabeche, tomates verdes, cremoso de atún y cilantro.',
    price: 18000,
  },
  {
    name: 'Sándwich Clásico de Piña',
    description:
      'Sandwich con baguette, piña calada, mayonesa ahumada, jamón y queso tipo Philadelphia.',
    price: 16000,
  },
  {
    name: 'Waffle Americano',
    description:
      'Elaborado con masa de la casa a base de pandebono, acompañado de mermelada de temporada, crujiente bacon y queso crema.',
    price: 16000,
  },

  // ── ENDULZATE ─────────────────────────────────────────────────────────
  {
    name: 'Colita de Ratón',
    description: 'Delicioso postre de la casa.',
    price: 10500,
  },
  {
    name: 'Crepe de Arroz con Leche',
    description: 'Crepe relleno de arroz con leche.',
    price: 12500,
  },
  {
    name: 'Crepe Frutal',
    description: 'Crepe relleno de frutas frescas de temporada.',
    price: 12000,
  },
  {
    name: 'Waffle Tropical',
    description: 'Waffle con frutas tropicales.',
    price: 12000,
  },
  {
    name: 'Torta de Banano o Zanahoria',
    description: 'Torta casera de banano o zanahoria a elegir.',
    price: 5000,
  },
  {
    name: 'Torta de Queso, Maracuyá o Chocolate',
    description: 'Torta casera a elegir entre queso, maracuyá o chocolate.',
    price: 6000,
  },
  {
    name: 'Cono de Helado',
    description: 'Cono de helado artesanal.',
    price: 3500,
  },
  {
    name: 'Parfait',
    description: 'Postre cremoso en capas con frutas y granola.',
    price: 10000,
  },

  // ── BEBIDAS ───────────────────────────────────────────────────────────
  {
    name: 'Espresso',
    description: 'Café espresso puro.',
    price: 3500,
  },
  {
    name: 'Café en Leche',
    description: 'Café con leche caliente.',
    price: 4000,
  },
  {
    name: 'Aromática Galettes',
    description: 'Aromática especial de la casa.',
    price: 6000,
  },
  {
    name: 'Jugo Natural',
    description:
      'Jugos naturales en agua o leche. Sabores disponibles: maracuyá, mango, mora o lulo.',
    price: 8500,
  },
  {
    name: 'Limonada de Coco',
    description: 'Refrescante limonada con coco.',
    price: 10000,
  },
  {
    name: 'Limonada de Piña Colada',
    description: 'Limonada con piña y coco estilo piña colada.',
    price: 13000,
  },
  {
    name: 'Limonada de Frutos Rojos',
    description: 'Limonada con mezcla de frutos rojos.',
    price: 13000,
  },
  {
    name: 'Cremoso de Banaturron',
    description: 'Bebida cremosa de banano y arequipe.',
    price: 10000,
  },
  {
    name: 'Malteada',
    description:
      'Malteada cremosa. Sabores disponibles: chocolate, tres leches, vainilla, arequipe o frutos rojos.',
    price: 10000,
  },

  // ── ADICIONALES ───────────────────────────────────────────────────────
  {
    name: 'Desechables',
    description: 'Cubiertos y servilletas desechables.',
    price: 2000,
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'restaurante-mi-vecina' },
  });

  if (!tenant) {
    console.error('❌  Tenant "restaurante-mi-vecina" no encontrado. Créalo primero.');
    process.exit(1);
  }

  // Borrar productos existentes del restaurante
  const { count: deleted } = await prisma.product.deleteMany({
    where: { tenantId: tenant.id },
  });
  if (deleted > 0) {
    console.log(`🗑️   ${deleted} producto(s) anteriores eliminados.`);
  }

  // Insertar el menú completo
  await prisma.product.createMany({
    data: productos.map((p) => ({
      ...p,
      tenantId: tenant.id,
      stock: 999,   // restaurante: sin control de stock real
      minStock: 0,
    })),
  });

  console.log(`✅  ${productos.length} productos insertados para "${tenant.name}".`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
