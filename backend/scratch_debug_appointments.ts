import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      },
      workshop: {
        select: {
          name: true
        }
      }
    }
  });

  console.log('--- APPOINTMENTS WITH USER DETAILS ---');
  console.log(JSON.stringify(appointments.map(a => ({
    id: a.id,
    userEmail: a.user.email,
    userName: a.user.name,
    workshopName: a.workshop.name,
    status: a.status,
    time: a.time,
    date: a.date
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
