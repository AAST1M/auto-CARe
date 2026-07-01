import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.updateMany({
    where: { email: { in: ['sara_h@example.com', 'hdhdjdd429@gamil.com'] } },
    data: { passwordHash: hash }
  });

  await prisma.user.update({
    where: { email: 'sara_h@example.com' },
    data: { carBrand: 'BMW' }
  });
  
  console.log('Fixed passwords and carBrand for test users!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
