import { prisma } from './contact-service/src/config/db.js';

async function test() {
  try {
    // 1. Get an existing user
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) {
      console.log('Not enough users');
      return;
    }
    const ownerId = users[0].id;
    const userId = users[1].id;
    
    console.log(`Creating contact: ownerId=${ownerId}, userId=${userId}`);
    
    const contact = await prisma.contact.create({
      data: {
        ownerId,
        userId,
        alias: undefined
      },
      include: {
        user: { select: { id: true, name: true, profilePic: true, email: true } }
      }
    });
    console.log('Success:', contact);
  } catch (e) {
    console.error('Prisma Error:', e.message);
  }
}

test().then(() => process.exit(0));
