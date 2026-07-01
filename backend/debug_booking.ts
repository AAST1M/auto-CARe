import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ email: u.email, role: u.role, id: u.id })));
  
  const workshops = await prisma.workshop.findMany();
  console.log('Workshops:', workshops.map(w => ({ name: w.name, ownerId: w.ownerId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
