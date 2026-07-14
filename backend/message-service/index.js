import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { prisma } from './src/config/db.js';
import { createConsumer, initKafkaTopics } from '../shared/kafka.js';
import { sessionMiddleware } from './src/middlewares/session.middleware.js';
import { redis } from './src/config/redis.connect.js';

import messageRoutes from './src/routes/message.route.js';

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

const userSockets = new Map();

io.use((socket, next) => {
  const req = socket.request;
  const res = {};
  sessionMiddleware(req, res, () => {
    if (req.session && req.session.userId) {
      socket.userId = req.session.userId;
      next();
    } else {
      next(new Error('Authentication error'));
    }
  });
});

io.on('connection', async (socket) => {
  if (!socket.userId) return;
  
  userSockets.set(socket.userId, socket.id);
  
  // Set presence to online in Redis
  await redis.set(`presence:${socket.userId}`, 'online');
  // Broadcast to others (in a real app, only broadcast to contacts)
  io.emit('userStatus', { userId: socket.userId, status: 'online' });

  // Update undelivered messages to DELIVERED when user connects
  const undeliveredMessages = await prisma.message.findMany({
    where: { receiverId: socket.userId, status: 'SENT' }
  });

  if (undeliveredMessages.length > 0) {
    await prisma.message.updateMany({
      where: { receiverId: socket.userId, status: 'SENT' },
      data: { status: 'DELIVERED' }
    });
    
    // Notify senders that their messages are delivered
    undeliveredMessages.forEach(msg => {
      const senderSocket = userSockets.get(msg.senderId);
      if (senderSocket) {
        io.to(senderSocket).emit('messageStatusUpdate', { messageId: msg.id, status: 'DELIVERED' });
      }
    });
  }

  // --- Real-Time Events ---

  socket.on('typing', ({ receiverId, isTyping }) => {
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', { senderId: socket.userId, isTyping });
    }
  });

  socket.on('markAsRead', async ({ messageId, senderId }) => {
    await prisma.message.update({
      where: { id: messageId },
      data: { status: 'READ' }
    });
    const senderSocketId = userSockets.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('messageStatusUpdate', { messageId, status: 'READ' });
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      const lastSeen = new Date();
      // Update postgres and redis
      await prisma.user.update({
        where: { id: socket.userId },
        data: { lastSeen }
      });
      await redis.set(`presence:${socket.userId}`, lastSeen.toISOString());
      io.emit('userStatus', { userId: socket.userId, status: lastSeen.toISOString() });
    }
  });
});

const runKafkaConsumer = async () => {
  await initKafkaTopics(['user-events', 'message-events', 'contact-events']);
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
            update: { name: payload.name, profilePic: payload.profilePic, phoneNumber: payload.phoneNumber },
            create: { id: payload.id, name: payload.name, profilePic: payload.profilePic, phoneNumber: payload.phoneNumber }
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

export { io, userSockets };

app.get('/health', (req, res) => res.status(200).json({ status: 'Message Service OK' }));
app.use('/', messageRoutes);

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Message Service running on port ${PORT}`);
});
