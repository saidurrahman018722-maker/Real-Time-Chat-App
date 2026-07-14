import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import rateLimitRedis from 'rate-limit-redis';
const { RedisStore } = rateLimitRedis;
import redisClient from '../shared/redis.js';
import jwt from 'jsonwebtoken';
import { standardLimiter } from '../shared/rateLimiter.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Trust the proxy (so we get the real client IP instead of the proxy's IP)
app.set('trust proxy', 1);

// Global Standard Rate Limiter using Lua Token Bucket
app.use(standardLimiter);

// --- PROXIES ---
// The API Gateway simply proxies the requests and passes the cookies.
// Authentication (Session/Redis) is handled internally by each microservice via their authMiddleware.

// Auth Service proxy (Public routes)
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '',
  },
}));

// Contact Service proxy (Protected inside microservice)
app.use('/contact', createProxyMiddleware({
  target: process.env.CONTACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/contact': '',
  },
}));

// Conversation proxy - Moved to message-service to access Message table
app.use('/conversation', createProxyMiddleware({
  target: process.env.MESSAGE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => req.originalUrl,
}));

// Message Service proxy (Protected inside microservice, supports WebSockets)
app.use('/message', createProxyMiddleware({
  target: process.env.MESSAGE_SERVICE_URL,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxy for Socket.io
  pathRewrite: {
    '^/message': '',
  },
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
