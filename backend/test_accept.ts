import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'USER' } });
  const workshop = await prisma.workshop.findFirst();

  if (!user || !workshop) throw new Error('Missing user or workshop');

  console.log(`Simulating flow...`);
  
  // 1. Create a booking
  const appointment = await prisma.appointment.create({
    data: {
      userId: user.id,
      workshopId: workshop.id,
      serviceType: 'Oil Change',
      date: '2026-10-20',
      time: '10:00 AM',
      price: 450,
      carDetails: 'BMW 320i',
      status: 'Pending'
    }
  });
  console.log(`Booking created: ${appointment.id}, Status: ${appointment.status}`);

  // 2. Workshop Owner accepts the booking
  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'Confirmed' }
  });
  console.log(`Workshop accepted booking. New Status: ${updated.status}`);

  // 3. Workshop Owner checks-in the car
  const checkedIn = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'Checked-In', progress: 25 }
  });
  console.log(`Workshop checked-in the car. Status: ${checkedIn.status}, Progress: ${checkedIn.progress}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
