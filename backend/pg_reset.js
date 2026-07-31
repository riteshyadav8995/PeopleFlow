const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  const res = await client.query('SELECT * FROM attendance_records ORDER BY created_at DESC LIMIT 5');
  console.log("Latest records:");
  console.dir(res.rows, { depth: null });

  console.log("Deleting today's mock attendance records...");
  const deleteRes = await client.query('DELETE FROM attendance_records');
  console.log(`Deleted ${deleteRes.rowCount} records.`);
  
  await client.end();
}

main().catch(console.error);
