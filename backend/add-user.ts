import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'marwanstudent2003@gmail.com';
  const password = '123)?(456)?(Ma';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN', name: 'Marwan' },
    create: {
      email,
      passwordHash,
      name: 'Marwan',
      role: 'ADMIN',
      walletBalance: 0
    }
  });

  console.log(`✅ User ${email} added successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
