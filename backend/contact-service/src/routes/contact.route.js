import express from "express";
import { standardLimiter } from '../middlewares/rateLimiter.middleware.js';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { searchUsers, addContact, getContacts, toggleFavorite, updateAlias, toggleBlock, reportContact } from "../controllers/contact.controller.js";

const router = express.Router();

router.use(standardLimiter);
router.use(authMiddleware);

router.get("/search", searchUsers);
router.post("/:userId", addContact);
router.get("/", getContacts);
router.put("/:contactId/favorite", toggleFavorite);
router.put("/:userId/alias", updateAlias);
router.put("/:userId/block", toggleBlock);
router.put("/:userId/report", reportContact);

export default router;
