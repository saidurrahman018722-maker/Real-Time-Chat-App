import express from "express";
import { standardLimiter } from '../middlewares/rateLimiter.middleware.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getMessageByUserId,
  sendMessage,
  deleteMessage
} from "../controllers/message.controller.js";

const router = express.Router();

// Apply standard rate limiting to all message routes
router.use(standardLimiter);

// Protect all message routes with authMiddleware
router.use(authMiddleware);

// --- Messages ---
// Get message history with a specific user
router.get("/:id", getMessageByUserId);

// Send a message to a specific user
router.post("/send/:id", sendMessage);

// Delete a specific message
router.delete("/:id", deleteMessage);

export default router;