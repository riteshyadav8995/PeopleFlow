import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emps = await prisma.employee.findMany({
    select: { 
      id: true, 
      firstName: true, 
      reportingTo: true,
      manager: {
        select: { firstName: true }
      }
    }
  });
  console.dir(emps, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
