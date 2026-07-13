import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { prisma } from './src/config/db.js';
import { createConsumer, initKafkaTopics } from '../shared/kafka.js';
import { sessionMiddleware } from './src/middlewares/session.middleware.js';

// Import our isolated routes
import contactRoutes from './src/routes/contact.route.js';

const app = express();
app.set('trust proxy', 1); // Trust the API Gateway to pass X-Forwarded-For

// Prisma is imported from config/db.js

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

// Kafka Consumer for Data Replication
const runKafkaConsumer = async () => {
  await initKafkaTopics(['user-events', 'message-events', 'contact-events']);
  const consumer = createConsumer('contact-service-group');
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const eventName = message.key.toString();
      const payload = JSON.parse(message.value.toString());

      if (eventName === 'UserCreated') {
        try {
          // Upsert to handle potential duplicate messages safely
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
          console.log(`Contact Service: Replicated UserCreated for ${payload.email}`);
        } catch (error) {
          console.error('Error replicating UserCreated:', error);
        }
      }
    },
  });
};
runKafkaConsumer().catch(console.error);

// --- ROUTES ---

app.get('/health', (req, res) => res.status(200).json({ status: 'Contact Service OK' }));

// Mount Monolithic Routes
// The monolithic contact route has `router.post("/add", ...)` and `router.get("/", ...)`
app.use('/', contactRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Contact Service running on port ${PORT}`);
});
