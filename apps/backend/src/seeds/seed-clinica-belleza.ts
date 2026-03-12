/**
 * Seed: Clínica MediCare + Salón BeautyGlow
 *
 * Crea dos tenants (CLINIC y BEAUTY) con sus profesionales, horarios
 * y servicios listos para probar el flujo de citas del bot.
 *
 * Ejecutar desde apps/backend/:
 *   npx ts-node -r tsconfig-paths/register src/seeds/seed-clinica-belleza.ts
 */
import 'dotenv/config';
import { PrismaClient, Industry, Plan, SubscriptionStatus, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const BOT_PASSWORD = process.env.BOT_PASSWORD ?? 'Bot123456!';
  const hash = await bcrypt.hash(BOT_PASSWORD, 10);

  // ── 1. Clínica MediCare ─────────────────────────────────────────────────────
  console.log('Creando tenant: Clínica MediCare…');

  const slugClinica = 'clinica-medicare';
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const clinica = await prisma.tenant.upsert({
    where: { slug: slugClinica },
    update: {},
    create: {
      name: 'Clínica MediCare',
      slug: slugClinica,
      plan: Plan.STARTER,
      industry: Industry.CLINIC,
      trialEndsAt,
      subscriptionStatus: SubscriptionStatus.TRIAL,
    },
  });

  // Owner y bot
  await prisma.user.upsert({
    where: { email: `owner@${slugClinica}.automatiza360.com` },
    update: {},
    create: {
      email: `owner@${slugClinica}.automatiza360.com`,
      password: hash,
      name: 'Admin MediCare',
      role: Role.OWNER,
      tenantId: clinica.id,
    },
  });
  await prisma.user.upsert({
    where: { email: `bot@${slugClinica}.automatiza360.com` },
    update: {},
    create: {
      email: `bot@${slugClinica}.automatiza360.com`,
      password: hash,
      name: 'Bot MediCare',
      role: Role.STAFF,
      tenantId: clinica.id,
    },
  });

  // Servicios
  const serviciosClinica = [
    { name: 'Consulta General', description: 'Consulta medicina general', duration: 45, price: 50000 },
    { name: 'Consulta Pediatría', description: 'Consulta pediátrica', duration: 45, price: 60000 },
    { name: 'Toma de Muestras', description: 'Laboratorio clínico básico', duration: 20, price: 30000 },
    { name: 'Electrocardiograma', description: 'ECG de 12 derivaciones', duration: 30, price: 80000 },
  ];

  for (const svc of serviciosClinica) {
    const existing = await prisma.service.findFirst({ where: { tenantId: clinica.id, name: svc.name } });
    if (!existing) {
      await prisma.service.create({ data: { ...svc, tenantId: clinica.id } });
    }
  }

  // Profesionales con horarios (L-V = 1-5)
  const medicos = [
    { name: 'Dr. García', specialty: 'Medicina General', start: '08:00', end: '17:00' },
    { name: 'Dra. Torres', specialty: 'Pediatría', start: '09:00', end: '16:00' },
  ];

  for (const med of medicos) {
    let prof = await prisma.professional.findFirst({ where: { tenantId: clinica.id, name: med.name } });
    if (!prof) {
      prof = await prisma.professional.create({
        data: { name: med.name, specialty: med.specialty, tenantId: clinica.id },
      });
    }
    // Crear horario L-V si no existe
    for (let day = 1; day <= 5; day++) {
      const existing = await prisma.schedule.findFirst({ where: { professionalId: prof.id, dayOfWeek: day } });
      if (!existing) {
        await prisma.schedule.create({
          data: { dayOfWeek: day, startTime: med.start, endTime: med.end, professionalId: prof.id },
        });
      }
    }
  }

  console.log(`  ✓ Clínica MediCare creada (id=${clinica.id})`);
  console.log(`    Bot: bot@${slugClinica}.automatiza360.com / ${BOT_PASSWORD}`);

  // ── 2. Salón BeautyGlow ─────────────────────────────────────────────────────
  console.log('Creando tenant: Salón BeautyGlow…');

  const slugBeauty = 'salon-beautyglow';

  const beauty = await prisma.tenant.upsert({
    where: { slug: slugBeauty },
    update: {},
    create: {
      name: 'BeautyGlow',
      slug: slugBeauty,
      plan: Plan.STARTER,
      industry: Industry.BEAUTY,
      trialEndsAt,
      subscriptionStatus: SubscriptionStatus.TRIAL,
    },
  });

  await prisma.user.upsert({
    where: { email: `owner@${slugBeauty}.automatiza360.com` },
    update: {},
    create: {
      email: `owner@${slugBeauty}.automatiza360.com`,
      password: hash,
      name: 'Admin BeautyGlow',
      role: Role.OWNER,
      tenantId: beauty.id,
    },
  });
  await prisma.user.upsert({
    where: { email: `bot@${slugBeauty}.automatiza360.com` },
    update: {},
    create: {
      email: `bot@${slugBeauty}.automatiza360.com`,
      password: hash,
      name: 'Bot BeautyGlow',
      role: Role.STAFF,
      tenantId: beauty.id,
    },
  });

  const serviciosBeauty = [
    { name: 'Corte de cabello mujer', description: 'Corte + lavado + secado', duration: 45, price: 45000 },
    { name: 'Tinte completo', description: 'Coloración + tratamiento', duration: 120, price: 120000 },
    { name: 'Manicure', description: 'Esmaltado tradicional o semipermanente', duration: 45, price: 30000 },
    { name: 'Pedicure', description: 'Pedicure completo con esmaltado', duration: 60, price: 35000 },
    { name: 'Facial básico', description: 'Limpieza facial e hidratación', duration: 60, price: 80000 },
    { name: 'Depilación de cejas', description: 'Diseño y depilación de cejas', duration: 20, price: 15000 },
  ];

  for (const svc of serviciosBeauty) {
    const existing = await prisma.service.findFirst({ where: { tenantId: beauty.id, name: svc.name } });
    if (!existing) {
      await prisma.service.create({ data: { ...svc, tenantId: beauty.id } });
    }
  }

  const estilistas = [
    { name: 'Ana', specialty: 'Colorimetría', days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '18:00' },
    { name: 'Valentina', specialty: 'Tratamientos capilares', days: [2, 3, 4, 5, 6], start: '10:00', end: '19:00' },
  ];

  for (const est of estilistas) {
    let prof = await prisma.professional.findFirst({ where: { tenantId: beauty.id, name: est.name } });
    if (!prof) {
      prof = await prisma.professional.create({
        data: { name: est.name, specialty: est.specialty, tenantId: beauty.id },
      });
    }
    for (const day of est.days) {
      const existing = await prisma.schedule.findFirst({ where: { professionalId: prof.id, dayOfWeek: day } });
      if (!existing) {
        await prisma.schedule.create({
          data: { dayOfWeek: day, startTime: est.start, endTime: est.end, professionalId: prof.id },
        });
      }
    }
  }

  console.log(`  ✓ Salón BeautyGlow creado (id=${beauty.id})`);
  console.log(`    Bot: bot@${slugBeauty}.automatiza360.com / ${BOT_PASSWORD}`);

  await prisma.$disconnect();
  await pool.end();
  console.log('\nSeed completado.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
