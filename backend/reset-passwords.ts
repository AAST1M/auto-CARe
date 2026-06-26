import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'Password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Resetting/Upserting main test accounts with password: Password123');

  // 1. Admin
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      passwordHash: hashedPassword,
      role: 'ADMIN',
      name: 'Admin'
    },
    create: {
      email: 'admin@admin.com',
      passwordHash: hashedPassword,
      name: 'Admin',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin: admin@admin.com / Password123');

  // 2. Workshop Owner
  await prisma.user.upsert({
    where: { email: 'workshop@workshop.com' },
    update: {
      passwordHash: hashedPassword,
      role: 'WORKSHOP_OWNER',
      name: 'Workshop Owner'
    },
    create: {
      email: 'workshop@workshop.com',
      passwordHash: hashedPassword,
      name: 'Workshop Owner',
      role: 'WORKSHOP_OWNER'
    }
  });
  console.log('✅ Workshop: workshop@workshop.com / Password123');

  // 3. Driver
  await prisma.user.upsert({
    where: { email: 'driver@example.com' },
    update: {
      passwordHash: hashedPassword,
      role: 'WINCH_DRIVER',
      name: 'Sherif Winch',
      approvalStatus: 'APPROVED'
    },
    create: {
      email: 'driver@example.com',
      passwordHash: hashedPassword,
      name: 'Sherif Winch',
      role: 'WINCH_DRIVER',
      approvalStatus: 'APPROVED'
    }
  });
  console.log('✅ Driver: driver@example.com / Password123');

  // 4. Customer/User
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {
      passwordHash: hashedPassword,
      role: 'USER',
      name: 'John Customer'
    },
    create: {
      email: 'customer@example.com',
      passwordHash: hashedPassword,
      name: 'John Customer',
      role: 'USER'
    }
  });
  console.log('✅ User: customer@example.com / Password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
