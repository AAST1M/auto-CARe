import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Master Seed...');

  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Seed Admin
  await prisma.user.upsert({
    where: { email: 'admin@autocare.com' },
    update: { passwordHash, role: 'ADMIN', name: 'System Admin' },
    create: {
      email: 'admin@autocare.com',
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
      walletBalance: 0
    }
  });
  console.log('✅ Seeded Admin: admin@autocare.com');

  // 2. Seed Regular User (Customer)
  const customer = await prisma.user.upsert({
    where: { email: 'user@autocare.com' },
    update: { passwordHash, role: 'USER', name: 'John Customer' },
    create: {
      email: 'user@autocare.com',
      passwordHash,
      name: 'John Customer',
      phone: '01012345678',
      role: 'USER',
      walletBalance: 500
    }
  });
  console.log('✅ Seeded User: user@autocare.com');

  // 3. Seed Winch Driver
  const driver = await prisma.user.upsert({
    where: { email: 'winch@autocare.com' },
    update: { passwordHash, role: 'WINCH_DRIVER', name: 'Sherif Towing' },
    create: {
      email: 'winch@autocare.com',
      passwordHash,
      name: 'Sherif Towing',
      phone: '01112345678',
      role: 'WINCH_DRIVER',
      walletBalance: 1200
    }
  });
  console.log('✅ Seeded Winch Driver: winch@autocare.com');

  // 4. Seed Workshop Owner & Workshop
  const owner = await prisma.user.upsert({
    where: { email: 'workshop@autocare.com' },
    update: { passwordHash, role: 'WORKSHOP_OWNER', name: 'Ahmed Garage' },
    create: {
      email: 'workshop@autocare.com',
      passwordHash,
      name: 'Ahmed Garage',
      phone: '01212345678',
      role: 'WORKSHOP_OWNER',
      walletBalance: 3500
    }
  });

  // Ensure the Workshop owner has a Workshop
  const existingWorkshop = await prisma.workshop.findFirst({
    where: { ownerId: owner.id }
  });

  if (!existingWorkshop) {
    await prisma.workshop.create({
      data: {
        ownerId: owner.id,
        name: 'Ahmed Premium Garage',
        rating: 4.8,
        distance: '2.5 km',
        specialty: 'German Cars',
        priceEstimate: '500-1500 EGP',
        address: 'Maadi, Cairo',
        hours: '9 AM - 8 PM',
        services: 'Diagnostics, Oil Change, Engine Repair',
        description: 'Certified experts in premium German car repairs.'
      }
    });
    console.log('✅ Seeded Workshop for: workshop@autocare.com');
  } else {
    console.log('⚡ Workshop already exists for owner.');
  }

  console.log('🎉 Master Seed Completed! All accounts use password: Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
