const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/dashboard/employee?organizationId=org-123', // I need the token or just use the DB
  method: 'GET'
};

// Instead, I'll just query the DB directly to see if yesterday's record is returned for today's date range.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  console.log("startOfDay:", startOfDay);
  console.log("endOfDay:", endOfDay);

  const record = await prisma.attendanceRecord.findFirst({
    where: {
      date: { gte: startOfDay, lte: endOfDay }
    }
  });

  console.log("attendanceToday record:", record);
}

test().finally(() => prisma.$disconnect());
