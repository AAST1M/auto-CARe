import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Recent Appointments:', appointments.map(a => ({ id: a.id, date: a.date, time: a.time, status: a.status, workshopId: a.workshopId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
