import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://admin:adminpassword@localhost:5432/auth_db?schema=public'
});

async function main() {
  try {
    const res = await pool.query('SELECT * FROM "User"');
    console.log('USERS IN auth_db:', res.rows);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    pool.end();
  }
}

main();
