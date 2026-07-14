import { PrismaClient } from './prisma/generated/client/index.js';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: 'Any Murtaki User',
      email: 'test@murtaki.com',
      password: 'password123',
      verified: true
    }
  });
  console.log('User created successfully in auth_db!');
}

main()
  .catch(e => { console.error(e); })
  .finally(async () => { await prisma.$disconnect(); });
