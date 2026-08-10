require('ts-node/register');
const { prisma } = require('./src/core/base/base.model.ts');

async function main() {
  try {
    const configs = await prisma.voiceCampaignConfiguration.findMany();
    console.log("Database configs:", JSON.stringify(configs, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
