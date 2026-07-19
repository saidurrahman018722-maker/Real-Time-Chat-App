import express from "express";
import { standardLimiter } from '../middlewares/rateLimiter.middleware.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getMessageByUserId,
  sendMessage,
  deleteMessage,
  getSharedMediaGlobal,
  getSharedMediaConversation,
  togglePinMessage,
  forwardMessages
} from "../controllers/message.controller.js";

const router = express.Router();

// Apply standard rate limiting to all message routes
router.use(standardLimiter);

// Protect all message routes with authMiddleware
router.use(authMiddleware);

// --- Messages ---
// Get all shared media for the user globally
router.get("/media/global", getSharedMediaGlobal);

// Get shared media for a specific conversation
router.get("/media/:id", getSharedMediaConversation);

// Get message history with a specific user
router.get("/:id", getMessageByUserId);

// Send a message to a specific user
router.post("/send/:id", sendMessage);

// Forward messages to a specific user
router.post("/forward", forwardMessages);

// Toggle pin for a message
router.put("/:id/pin", togglePinMessage);

// Delete a specific message
router.delete("/:id", deleteMessage);

export default router;