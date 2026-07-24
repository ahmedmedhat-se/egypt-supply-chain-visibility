import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminOrg = await prisma.organization.upsert({
    where: { organization_email: 'admin@escv' },
    update: {},
    create: {
      organization_name: 'ESCV Administration',
      organization_type: 'admin',
      organization_email: 'admin@escv',
      organization_country: 'Egypt',
    },
  });

  const hash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { user_email: 'admin@escv' },
    update: {},
    create: {
      organization_id: adminOrg.organization_id,
      user_email: 'admin@escv',
      user_password_hash: hash,
      user_first_name: 'Super',
      user_last_name: 'Admin',
      user_role: 'super_admin',
    },
  });

  console.log('✅ Seed completed');
  console.log('   admin@escv / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
