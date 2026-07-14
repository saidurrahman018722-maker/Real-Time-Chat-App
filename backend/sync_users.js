import pg from "pg";
import { publishEvent, connectProducer, disconnectProducer } from "./shared/kafka.js";

async function syncUsers() {
  const authDbUrl = "postgresql://admin:adminpassword@localhost:5432/auth_db?schema=public";
  const pool = new pg.Pool({ connectionString: authDbUrl });

  await connectProducer();

  try {
    const result = await pool.query(`SELECT id, name, email, "profilePic" FROM "User"`);
    console.log(`Found ${result.rows.length} users in auth_db.`);

    for (const user of result.rows) {
      await publishEvent('user-events', 'UserCreated', {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
      });
      console.log(`Published sync event for ${user.email}`);
    }
  } catch (err) {
    console.error("Sync error:", err);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  await disconnectProducer();
  await pool.end();
  console.log("Sync complete!");
}

syncUsers().then(() => process.exit(0));
