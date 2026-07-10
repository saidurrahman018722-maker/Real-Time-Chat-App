import express from "express";
import { standardLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Apply standard rate limiting to all message routes
router.use(standardLimiter);

//router.post("/api/send",sendMessage)


export default router;