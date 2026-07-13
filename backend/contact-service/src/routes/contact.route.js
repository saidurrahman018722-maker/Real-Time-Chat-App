import express from "express";
import { standardLimiter } from '../middlewares/rateLimiter.middleware.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { searchUsers, addContact, getContacts } from "../controllers/contact.controller.js";

const router = express.Router();

router.use(standardLimiter);
router.use(authMiddleware);

router.get("/search", searchUsers);
router.post("/:userId", addContact);
router.get("/", getContacts);

export default router;
