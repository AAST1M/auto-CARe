import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with mock workshops...');

  // First create a dummy workshop owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      passwordHash: 'dummy_hash',
      name: 'John Doe',
      phone: '01000000000',
      role: 'WORKSHOP_OWNER',
    },
  });

  const mockWorkshops = [
    {
      name: 'Vision Motors',
      rating: 4.9,
      distance: '1.2 km',
      specialty: 'Multi Brand',
      priceEstimate: '$$',
      image: 'https://picsum.photos/400/200?random=1',
      address: 'Building B12, Smart Village, Giza',
      hours: '09:00 AM - 09:00 PM',
      services: 'Computer Diagnostics, Oil Change, Brake Service, Suspension Check',
      description: 'Vision Motors provides state-of-the-art diagnostics and repair services for all car brands. Certified technicians and genuine parts guaranteed.',
      ownerId: owner.id
    },
    {
      name: 'Turbo Tech',
      rating: 4.7,
      distance: '3.5 km',
      specialty: 'European Cars',
      priceEstimate: '$$$',
      image: 'https://picsum.photos/400/200?random=2',
      address: 'El-Nozha St, Heliopolis, Cairo',
      hours: '10:00 AM - 08:00 PM',
      services: 'Engine Tuning, Transmission Repair, Electrical Systems, AC Repair',
      description: 'Specialized in German and Italian vehicles. We offer precision tuning and complex engine repairs.',
      ownerId: owner.id
    },
    {
      name: 'Quick Fix Auto',
      rating: 4.5,
      distance: '5.0 km',
      specialty: 'Body & Paint',
      priceEstimate: '$',
      image: 'https://picsum.photos/400/200?random=3',
      address: 'Industrial Zone, 6th of October',
      hours: '08:00 AM - 06:00 PM',
      services: 'Dent Removal, Painting, Polishing, Glass Replacement',
      description: 'Fast and affordable bodywork repairs. We bring your car back to showroom condition.',
      ownerId: owner.id
    },
    {
      name: 'Electro Cars',
      rating: 4.8,
      distance: '2.1 km',
      specialty: 'Electric & Hybrid',
      priceEstimate: '$$',
      image: 'https://picsum.photos/400/200?random=4',
      address: 'Mall of Egypt Parking, 6th of October',
      hours: '10:00 AM - 10:00 PM',
      services: 'Battery Health Check, Charging System, Software Updates, Hybrid Maintenance',
      description: 'The future of car maintenance. Specialized equipment for Tesla, BMW i-series, and other EVs.',
      ownerId: owner.id
    },
    {
      name: 'GearHeadz',
      rating: 4.2,
      distance: '8.0 km',
      specialty: 'Transmission',
      priceEstimate: '$$$',
      image: 'https://picsum.photos/400/200?random=5',
      address: 'Ring Road Exit 14',
      hours: '09:00 AM - 05:00 PM',
      services: 'Gearbox Rebuild, Clutch Replacement, Fluid Change, Differential Repair',
      description: 'Transmission experts. Automatic, CVT, and Manual gearbox specialists.',
      ownerId: owner.id
    }
  ];

  await prisma.workshop.createMany({
    data: mockWorkshops
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
