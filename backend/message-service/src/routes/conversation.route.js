import express from "express";
import { standardLimiter } from '../middlewares/rateLimiter.middleware.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getConversations, deleteConversation } from "../controllers/conversation.controller.js";

const router = express.Router();

router.use(standardLimiter);
router.use(authMiddleware);

router.get("/", getConversations);
router.delete("/:id", deleteConversation);

export default router;
