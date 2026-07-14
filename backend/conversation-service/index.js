import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import { prisma } from './src/config/db.js';
import { createConsumer, initKafkaTopics } from '../shared/kafka.js';
import { sessionMiddleware } from './src/middlewares/session.middleware.js';

// Import our isolated routes
import conversationRoutes from './src/routes/conversation.route.js';

const app = express();
app.set('trust proxy', 1); // Trust the API Gateway to pass X-Forwarded-For

// Prisma is imported from config/db.js

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

// Kafka Consumer for Data Replication
const runKafkaConsumer = async () => {
  await initKafkaTopics(['user-events', 'message-events', 'contact-events']);
  const consumer = createConsumer('conversation-service-group');
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });
  await consumer.subscribe({ topic: 'message-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const eventName = message.key.toString();
      const payload = JSON.parse(message.value.toString());

      if (eventName === 'UserCreated') {
        try {
          await prisma.user.upsert({
            where: { id: payload.id },
            update: {
              name: payload.name,
              email: payload.email,
              profilePic: payload.profilePic
            },
            create: {
              id: payload.id,
              name: payload.name,
              email: payload.email,
              profilePic: payload.profilePic
            }
          });
        } catch (error) {
          console.error('Error replicating UserCreated:', error);
        }
      } else if (eventName === 'MessageCreated') {
        try {
          await prisma.conversation.upsert({
            where: { id: payload.conversationId },
            update: { lastMessageId: payload.id },
            create: {
              id: payload.conversationId,
              lastMessageId: payload.id,
              participants: {
                connect: [{ id: payload.senderId }, { id: payload.receiverId }]
              }
            }
          });
        } catch (error) {
          console.error('Error upserting conversation last message:', error);
        }
      }
    },
  });
};
runKafkaConsumer().catch(console.error);

// --- ROUTES ---

app.get('/health', (req, res) => res.status(200).json({ status: 'Conversation Service OK' }));

// Mount Monolithic Routes
app.use('/', conversationRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Conversation Service running on port ${PORT}`);
});
