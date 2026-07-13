require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../shared/redis');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Global Rate Limiting across all API routes via Redis Cluster
const globalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 requests per `window` (1 minute)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(globalLimiter);

// Authentication Middleware to protect routes that require it
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = decoded;
      // We pass the decoded user ID to the downstream services via custom header
      req.headers['x-user-id'] = decoded.id;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// --- PROXIES ---

// Auth Service proxy (Public routes)
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '',
  },
}));

// Contact Service proxy (Protected)
app.use('/contact', authenticateJWT, createProxyMiddleware({
  target: process.env.CONTACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/contact': '',
  },
}));

// Conversation Service proxy (Protected)
app.use('/conversation', authenticateJWT, createProxyMiddleware({
  target: process.env.CONVERSATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/conversation': '',
  },
}));

// Message Service proxy (Protected, supports WebSockets if needed)
app.use('/message', authenticateJWT, createProxyMiddleware({
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
