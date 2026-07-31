const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_UxOit7FYBrn0@ep-bitter-sea-aze7itjd-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
  });
  
  await client.connect();
  const res = await client.query('SELECT id, first_name, reporting_to FROM employees;');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main().catch(console.error);
