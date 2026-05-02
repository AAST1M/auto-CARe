const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'test@example.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword
    },
    create: {
      email,
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'USER'
    }
  });
  console.log('User created: test@example.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
