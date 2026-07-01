import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'USER' } });
  const workshop = await prisma.workshop.findFirst();

  if (!user || !workshop) throw new Error('Missing user or workshop');

  console.log(`User: ${user.email}, Workshop: ${workshop.name}`);

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  const payload = {
    serviceType: 'General Inspection',
    date: '2026-10-12',
    time: '09:00 AM',
    carDetails: 'My Car ',
    price: 450,
    paymentMethod: 'cash'
  };

  const response = await fetch(`http://localhost:5001/api/workshops/${workshop.id}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
}

main().catch(console.error).finally(() => prisma.$disconnect());
