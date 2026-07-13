import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { createConsumer, publishEvent } from '../shared/kafka.js';
import { sessionMiddleware } from './src/middlewares/session.middleware.js';

// Import our isolated routes
import messageRoutes from './src/routes/message.route.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

const prisma = new PrismaClient();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

// Socket.io for Real-Time Messages
const userSockets = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSockets.set(userId, socket.id);
  }

  socket.on('disconnect', () => {
    if (userId) userSockets.delete(userId);
  });
});

// Kafka Consumer for Data Replication (User and Conversation)
const runKafkaConsumer = async () => {
  const consumer = createConsumer('message-service-group');
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });
  await consumer.subscribe({ topic: 'conversation-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const eventName = message.key.toString();
      const payload = JSON.parse(message.value.toString());

      if (eventName === 'UserCreated') {
        try {
          await prisma.user.upsert({
            where: { id: payload.id },
            update: { name: payload.name, profilePic: payload.profilePic },
            create: { id: payload.id, name: payload.name, profilePic: payload.profilePic }
          });
        } catch (error) {
          console.error('Error replicating UserCreated:', error);
        }
      } else if (eventName === 'ConversationCreated') {
        try {
          await prisma.conversation.upsert({
            where: { id: payload.id },
            update: { id: payload.id },
            create: { id: payload.id }
          });
        } catch (error) {
          console.error('Error replicating ConversationCreated:', error);
        }
      }
    },
  });
};
runKafkaConsumer().catch(console.error);

// Export io so controllers can use it
export { io, userSockets };

// --- ROUTES ---

app.get('/health', (req, res) => res.status(200).json({ status: 'Message Service OK' }));

// Mount Monolithic Routes
app.use('/', messageRoutes);

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Message Service running on port ${PORT}`);
});
