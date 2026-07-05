import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('Seeding...');

  const org = await prisma.organization.create({
    data: {
      organization_name: 'Egypt Supply Chain',
      organization_type: 'shipper',
      organization_email: 'admin@escv.com',
      organization_country: 'Egypt',
    },
  });

  await prisma.user.create({
    data: {
      organization_id: org.organization_id,
      user_email: 'admin@escv.com',
      user_password_hash: 'hashed_password',
      user_first_name: 'Admin',
      user_last_name: 'User',
      user_role: 'admin',
    },
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
