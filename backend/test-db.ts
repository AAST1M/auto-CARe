import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'qq@gmail.com' }
  });
  console.log('User qq@gmail.com wallet balance:', user?.walletBalance);

  const orders = await prisma.partOrder.findMany({
    include: { part: true }
  });
  console.log('All part orders in system:', orders);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
