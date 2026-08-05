const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("RECORDS DUMP:");
  records.forEach(r => {
    console.log(`ID: ${r.id}, Date: ${r.date?.toISOString()}, ClockIn: ${r.clockInTime?.toISOString()}, ClockOut: ${r.clockOutTime?.toISOString()}`);
  });
}
main().finally(() => prisma.$disconnect());
