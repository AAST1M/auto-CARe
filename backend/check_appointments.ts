import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'sara_h@example.com' } });
  if (!user) {
    console.log('User not found!');
    return;
  }
  const appointments = await prisma.appointment.findMany({ where: { userId: user.id } });
  console.log(`Sara has ${appointments.length} appointments.`);
  console.log(appointments);
}

main().catch(console.error).finally(() => prisma.$disconnect());
