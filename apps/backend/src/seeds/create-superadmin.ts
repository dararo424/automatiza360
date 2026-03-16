import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  const email = 'admin@automatiza360.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('SUPERADMIN ya existe:', email);
    await prisma.$disconnect();
    return;
  }

  const password = await bcrypt.hash('A360Admin2026!', 10);

  let tenant = await prisma.tenant.findFirst({ where: { slug: 'automatiza360-admin' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Automatiza360 Admin',
        slug: 'automatiza360-admin',
        industry: 'OTHER',
        subscriptionStatus: 'ACTIVE',
        plan: 'BUSINESS',
      },
    });
  }

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      password,
      role: 'SUPERADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('✅ SUPERADMIN creado:', email);
  console.log('   Password: A360Admin2026!');
  await prisma.$disconnect();
}

main().catch(console.error);
