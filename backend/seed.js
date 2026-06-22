const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      passwordHash,
      name: 'Test User',
      role: 'USER',
      walletBalance: 1000
    }
  });

  const workshopOwner = await prisma.user.upsert({
    where: { email: 'workshop2@test.com' },
    update: {},
    create: {
      email: 'workshop2@test.com',
      passwordHash,
      name: 'Ahlia Owner',
      role: 'WORKSHOP_OWNER'
    }
  });

  // Create Al-Ahlia Mechanics
  const existingAhlia = await prisma.workshop.findFirst({ where: { ownerId: workshopOwner.id } });
  if (!existingAhlia) {
    await prisma.workshop.create({
      data: {
        ownerId: workshopOwner.id,
        name: 'Al-Ahlia Mechanics',
        rating: 4.8,
        distance: '1.2 km',
        specialty: 'European Cars',
        priceEstimate: '$$',
        image: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=500',
        address: 'Tahrir Square',
        hours: '9 AM - 9 PM',
        services: 'Mechanical, Electrical',
        description: 'Expert mechanics ready to bid on your car repairs!',
      }
    });
  }

  console.log("Database seeded with Al-Ahlia Mechanics!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
