import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  console.log('Seeding 10 Users...');
  for (let i = 1; i <= 10; i++) {
    await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        passwordHash,
        name: `Test User ${i}`,
        phone: `010000000${i.toString().padStart(2, '0')}`,
        role: 'USER',
        walletBalance: 1000
      }
    });
  }

  console.log('Seeding 10 Winch Drivers...');
  for (let i = 1; i <= 10; i++) {
    await prisma.user.create({
      data: {
        email: `driver${i}@example.com`,
        passwordHash,
        name: `Winch Driver ${i}`,
        phone: `011000000${i.toString().padStart(2, '0')}`,
        role: 'WINCH_DRIVER',
        walletBalance: 2000
      }
    });
  }

  console.log('Seeding 10 Workshop Owners and their Workshops...');
  for (let i = 1; i <= 10; i++) {
    const owner = await prisma.user.create({
      data: {
        email: `owner${i}@example.com`,
        passwordHash,
        name: `Workshop Owner ${i}`,
        phone: `012000000${i.toString().padStart(2, '0')}`,
        role: 'WORKSHOP_OWNER',
        walletBalance: 5000
      }
    });

    await prisma.workshop.create({
      data: {
        ownerId: owner.id,
        name: `Auto Care Workshop ${i}`,
        rating: 4.0 + (i % 10) / 10,
        distance: `${i + 1}.5 km`,
        specialty: i % 2 === 0 ? 'Mechanic' : 'Electrician',
        priceEstimate: '200-500 EGP',
        address: `Street ${i}, Cairo`,
        hours: '9 AM - 6 PM',
        services: 'Oil Change, Diagnostics, Brake Repair',
        description: `Premium workshop services located in Cairo.`
      }
    });
  }

  console.log('Successfully seeded 30 accounts!');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
