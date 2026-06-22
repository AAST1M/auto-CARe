const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'user@test.com' } });
  const workshop = await prisma.workshop.findFirst();

  if (!user || !workshop) {
    console.log("Missing user or workshop");
    return;
  }

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

  console.log("Token:", token);
  console.log("Workshop ID:", workshop.id);

  const res = await fetch(`http://localhost:5001/api/workshops/${workshop.id}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      serviceType: 'General Inspection',
      time: 'Mon 12 - 09:00 AM',
      carDetails: 'Toyota Yaris',
      price: 850
    })
  });

  const data = await res.json();
  console.log("Response Status:", res.status);
  console.log("Response Body:", data);
}

test().finally(() => prisma.$disconnect());
