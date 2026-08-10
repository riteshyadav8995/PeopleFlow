const { Client } = require('pg');
require('dotenv').config();

async function test() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT "systemPrompt" FROM "VoiceCampaignConfiguration" LIMIT 5');
  console.log(res.rows);
  await client.end();
}
test();
