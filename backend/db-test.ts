import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(records, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
