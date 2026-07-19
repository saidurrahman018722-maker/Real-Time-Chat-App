import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import { connectProducer } from '../shared/kafka.js';
import { sessionMiddleware } from './src/middlewares/session.middleware.js';

// Import our isolated routes
import authRoutes from './src/routes/auth.route.js';

const app = express();
app.set('trust proxy', 1); // Trust the API Gateway to pass X-Forwarded-For

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware); // Required by old monolithic controller

// --- ROUTES ---

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'Auth Service OK' }));

// Mount Monolithic Routes
app.use('/', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await connectProducer();
  console.log(`Auth Service running on port ${PORT}`);
});
