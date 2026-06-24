const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = 'Admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create/Upsert the Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autocare.ai' },
    update: {
      passwordHash: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      email: 'admin@autocare.ai',
      passwordHash: hashedPassword,
      name: 'Platform Admin',
      role: 'ADMIN'
    }
  });
  console.log('Seeded Admin User: admin@autocare.ai');

  // 2. Create/Upsert a Test Customer User
  const customerPassword = await bcrypt.hash('Password123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: customerPassword,
      name: 'John Customer',
      role: 'USER'
    }
  });
  console.log('Seeded Customer User: customer@example.com');

  // 3. Create/Upsert a Test Winch Driver User
  const driver = await prisma.user.upsert({
    where: { email: 'driver@example.com' },
    update: {},
    create: {
      email: 'driver@example.com',
      passwordHash: customerPassword,
      name: 'Sherif Winch',
      role: 'WINCH_DRIVER'
    }
  });
  console.log('Seeded Driver User: driver@example.com');

  // 4. Seed Workshop Appointments (so we have mock transactions)
  // Let's check a workshop to link to. We will check workshop ID '1' or '2'
  const workshops = await prisma.workshop.findMany();
  if (workshops.length > 0) {
    const shop1 = workshops[0];
    const shop2 = workshops[1] || shop1;

    // Create completed appointment 1
    await prisma.appointment.create({
      data: {
        userId: customer.id,
        workshopId: shop1.id,
        serviceType: 'Computer Diagnostics',
        carDetails: 'Jeep Wrangler 2021',
        time: 'Mon 12 - 09:00 AM',
        status: 'Completed',
        price: 450.0
      }
    });

    // Create completed appointment 2
    await prisma.appointment.create({
      data: {
        userId: customer.id,
        workshopId: shop2.id,
        serviceType: 'Engine Tuning',
        carDetails: 'BMW M4 2022',
        time: 'Tue 13 - 11:00 AM',
        status: 'Completed',
        price: 1250.0
      }
    });

    // Create confirmed appointment 3
    await prisma.appointment.create({
      data: {
        userId: customer.id,
        workshopId: shop1.id,
        serviceType: 'Brake Service',
        carDetails: 'Kia Cerato 2018',
        time: 'Wed 14 - 02:00 PM',
        status: 'Confirmed',
        price: 350.0
      }
    });
    console.log('Seeded mock workshop appointments');
  }

  // 5. Seed Winch Bookings (mock winch transactions)
  await prisma.winchBooking.create({
    data: {
      userId: customer.id,
      driverId: driver.id,
      driverName: 'Sherif Winch',
      vehicle: 'Flatbed Heavy-Duty',
      price: 600.0,
      status: 'Completed'
    }
  });

  await prisma.winchBooking.create({
    data: {
      userId: customer.id,
      driverId: driver.id,
      driverName: 'Kareem Tow',
      vehicle: 'Wheel-Lift Lite',
      price: 350.0,
      status: 'Completed'
    }
  });
  console.log('Seeded mock winch bookings');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
