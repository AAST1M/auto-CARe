import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Database Connection...');
  
  const userCount = await prisma.user.count();
  console.log(`Total Users in DB: ${userCount}`);
  
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true }
  });
  console.log('Users:', users);

  const workshopCount = await prisma.workshop.count();
  console.log(`\nTotal Workshops in DB: ${workshopCount}`);
  
  const workshops = await prisma.workshop.findMany({
    select: { name: true, specialty: true }
  });
  console.log('Workshops:', workshops);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
