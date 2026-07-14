import express from "express";
import { standardLimiter } from '../middlewares/rateLimiter.middleware.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { searchUsers, addContact, getContacts, toggleFavorite } from "../controllers/contact.controller.js";

const router = express.Router();

router.use(standardLimiter);
router.use(authMiddleware);

router.get("/search", searchUsers);
router.post("/:userId", addContact);
router.get("/", getContacts);
router.put("/:contactId/favorite", toggleFavorite);

export default router;
