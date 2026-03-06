/**
 * Seed script: crea el usuario bot para el restaurante Galettes & Co
 * (tenant slug: restaurante-mi-vecina)
 *
 * Ejecutar desde apps/backend/:
 *   npx ts-node -r tsconfig-paths/register src/seed-restaurant-bot.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const TENANT_SLUG = 'restaurante-mi-vecina';
  const BOT_EMAIL = 'bot@restaurante-mi-vecina.com';
  const BOT_PASSWORD = 'bot-mi-vecina-2026';
  const BOT_NAME = 'Bot WhatsApp';

  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    console.error(`❌  Tenant "${TENANT_SLUG}" no encontrado. Créalo primero.`);
    process.exit(1);
  }

  const existente = await prisma.user.findUnique({ where: { email: BOT_EMAIL } });
  if (existente) {
    console.log(`ℹ️   Usuario bot ya existe: ${BOT_EMAIL}`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(BOT_PASSWORD, 10);
  const bot = await prisma.user.create({
    data: {
      name: BOT_NAME,
      email: BOT_EMAIL,
      password: passwordHash,
      role: 'STAFF',
      tenantId: tenant.id,
    },
  });

  console.log(`✅  Bot creado: ${bot.email} (id: ${bot.id}) en tenant "${tenant.name}"`);
  console.log(`\n🔑  Variables de entorno para el ai-service:`);
  console.log(`   BOT_EMAIL=${BOT_EMAIL}`);
  console.log(`   BOT_PASSWORD=${BOT_PASSWORD}`);
  console.log(`   OWNER_PHONE=+57XXXXXXXXXX   # número WhatsApp de la dueña`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
