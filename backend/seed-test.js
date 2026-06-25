const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      passwordHash: hash,
      name: 'Test Owner',
      role: 'WORKSHOP_OWNER',
    },
  });

  const workshop = await prisma.workshop.create({
    data: {
      ownerId: owner.id,
      name: 'Test Workshop',
      services: 'Test',
    }
  });

  console.log('Seeded owner and workshop', owner.id, workshop.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
