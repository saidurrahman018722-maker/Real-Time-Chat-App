import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";
import { publishEvent, connectProducer, disconnectProducer } from "./shared/kafka.js";

async function seed() {
  const users = [
    { name: 'Alice Smith', email: 'alice@example.com' },
    { name: 'Bob Johnson', email: 'bob@example.com' },
    { name: 'Charlie Brown', email: 'charlie@example.com' },
    { name: 'Diana Prince', email: 'diana@example.com' },
    { name: 'Evan Wright', email: 'evan@example.com' },
    { name: 'Fiona Gallagher', email: 'fiona@example.com' },
    { name: 'George Miller', email: 'george@example.com' },
    { name: 'Hannah Abbott', email: 'hannah@example.com' },
    { name: 'Ian Malcolm', email: 'ian@example.com' },
    { name: 'Julia Roberts', email: 'julia@example.com' }
  ];

  // We connect to auth_db natively!
  // Since .env has Neon DB URL, we manually specify auth_db local url:
  const authDbUrl = "postgresql://admin:adminpassword@localhost:5432/auth_db?schema=public";
  
  const pool = new pg.Pool({ connectionString: authDbUrl });
  const passwordHash = await bcrypt.hash('password123', 10);

  await connectProducer();

  for (const u of users) {
    try {
      // 1. Insert into auth_db directly
      const result = await pool.query(`
        INSERT INTO "User" (id, name, email, password, verified, "profilePic", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, true, 'https://ui-avatars.com/api/?name=' || $4 || '&background=random', NOW(), NOW())
        ON CONFLICT (email) DO UPDATE 
        SET "profilePic" = 'https://ui-avatars.com/api/?name=' || $4 || '&background=random'
        RETURNING *
      `, [u.name, u.email, passwordHash, encodeURIComponent(u.name)]);

      const userRow = result.rows[0];
      console.log(`Auth DB seeded: ${userRow.email}`);

      // 2. Publish to Kafka so other microservices replicate it
      await publishEvent('user-events', 'UserCreated', {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        profilePic: userRow.profilePic
      });

    } catch (err) {
      console.error(`Failed to seed ${u.email}:`, err.message);
    }
  }

  // Allow consumers some time to pick it up
  await new Promise(resolve => setTimeout(resolve, 2000));
  await disconnectProducer();
  await pool.end();
  console.log("Seeding complete!");
}

seed().then(() => process.exit(0));
