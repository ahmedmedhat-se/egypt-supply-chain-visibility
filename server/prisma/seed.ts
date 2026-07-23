import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminOrg = await prisma.organization.upsert({
    where: { organization_email: 'admin@escv' },
    update: {},
    create: {
      organization_name: 'ESCV Administration',
      organization_type: 'admin',
      organization_email: 'admin@escv',
      organization_country: 'Egypt',
      organization_is_active: true,
    },
  });

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { user_email: 'admin@escv' },
    update: {},
    create: {
      organization_id: adminOrg.organization_id,
      user_email: 'admin@escv',
      user_password_hash: passwordHash,
      user_first_name: 'Super',
      user_last_name: 'Admin',
      user_role: 'super_admin',
      user_is_active: true,
    },
  });

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
