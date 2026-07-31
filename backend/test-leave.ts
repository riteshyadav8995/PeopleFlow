import { prisma } from './src/core/base/base.model';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const reqs = await prisma.leaveRequest.findMany({
    include: { employee: true }
  });
  console.log(JSON.stringify(reqs, null, 2));
}

main().finally(() => process.exit(0));
