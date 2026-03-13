/**
 * Fix: consolida tenants duplicados — mueve owners al tenant con datos,
 * elimina bots y tenants vacíos sobrantes.
 *
 * Ejecutar desde apps/backend/:
 *   npx ts-node -r tsconfig-paths/register src/seeds/fix-duplicate-tenants.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  // ── Fixes a aplicar ──────────────────────────────────────────────────────
  const fixes = [
    {
      description: 'Clínica MediCare — mover admin al tenant con datos',
      ownerEmails: ['admin@clinica-medicare.automatiza360.com'],
      targetTenantId: 'cmmmqb5500000bk0gnwqx5av0',  // tiene servicios, profesionales, bot
      emptyTenantId: 'cmmmsg8ht000001p8tetp6mzu',    // creado por onboarding
    },
    {
      description: 'Restaurante Mi Vecina — limpiar tenant zombie resturante-tyta',
      ownerEmails: [],  // owner ya fue movido en ejecución anterior
      targetTenantId: 'cmm7yvi8e0000yw0gtwhlzsrg',
      emptyTenantId: 'cmmk1a1dh000001jz8fff2dt8',   // solo queda el bot zombie
    },
  ];

  for (const fix of fixes) {
    console.log(`\n🔧 ${fix.description}...`);

    // Mover cada owner al tenant correcto
    for (const email of fix.ownerEmails) {
      const moved = await prisma.user.updateMany({
        where: { email, tenantId: fix.emptyTenantId },
        data: { tenantId: fix.targetTenantId },
      });
      if (moved.count > 0) {
        console.log(`  ✅ ${email} movido al tenant con datos`);
      } else {
        console.log(`  ⚠️  ${email} no estaba en el tenant vacío`);
      }
    }

    // Eliminar todos los usuarios restantes del tenant vacío (bots zombie)
    const bots = await prisma.user.findMany({
      where: { tenantId: fix.emptyTenantId },
      select: { email: true, role: true },
    });

    if (bots.length > 0) {
      console.log(`  🤖 Eliminando ${bots.length} bot(s) zombie: ${bots.map((b) => b.email).join(', ')}`);
      await prisma.user.deleteMany({ where: { tenantId: fix.emptyTenantId } });
    }

    // Eliminar el tenant vacío y todos sus datos asociados
    try {
      await prisma.notificacion.deleteMany({ where: { tenantId: fix.emptyTenantId } });
      await prisma.appointment.deleteMany({ where: { tenantId: fix.emptyTenantId } });
      await prisma.service.deleteMany({ where: { tenantId: fix.emptyTenantId } });
      await prisma.professional.deleteMany({ where: { tenantId: fix.emptyTenantId } });
      await prisma.tenant.delete({ where: { id: fix.emptyTenantId } });
      console.log(`  🗑️  Tenant duplicado ${fix.emptyTenantId} eliminado`);
    } catch (e: any) {
      console.log(`  ⚠️  No se pudo eliminar tenant: ${e.message}`);
    }
  }

  // ── Estado final ─────────────────────────────────────────────────────────
  console.log('\n📊 Estado final:\n');

  const todos = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      tenantId: true,
      tenant: { select: { name: true, slug: true, industry: true } },
    },
    orderBy: [{ tenant: { slug: 'asc' } }, { role: 'asc' }],
  });

  console.table(
    todos.map((u) => ({
      email: u.email,
      role: u.role,
      tenant: u.tenant.name,
      slug: u.tenant.slug,
      industry: u.tenant.industry,
    })),
  );

  console.log('\n✅ Fix completado.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
