const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    data: { walletBalance: 10000 }
  });
  console.log('Topped up all users!');
}
main().then(() => process.exit(0));
