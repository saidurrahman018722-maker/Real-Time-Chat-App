import { prisma } from "../config/db.js";
import { redis } from "../config/redis.connect.js";

export const getConversations = async (req, res) => {
  try {
    const loggedInUserId = req.session.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: loggedInUserId } },
        NOT: {
          deletedBy: { has: loggedInUserId }
        }
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          where: { id: { not: loggedInUserId } },
          select: { id: true, name: true, profilePic: true, email: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
    });

    // Format for easier frontend usage and fetch presence
    const formatted = await Promise.all(conversations.map(async c => {
      const partner = c.participants[0];
      let lastSeen = null;
      if (partner) {
        try {
          lastSeen = await redis.get(`presence:${partner.id}`);
        } catch (e) {
          console.error("Error fetching presence from redis", e);
        }
      }
      return {
        id: c.id,
        partner: {
          ...partner,
          lastSeen: lastSeen || undefined
        },
        lastMessage: c.messages && c.messages.length > 0 ? c.messages[0] : null,
        updatedAt: c.updatedAt
      };
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error in getConversations: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!conversation || !conversation.participants.some(p => p.id === userId)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Add userId to deletedBy array
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        deletedBy: { push: userId }
      }
    });

    // If all participants have deleted it, we can fully delete it from DB to save space
    if (updated.participants && updated.deletedBy.length === updated.participants.length) {
      await prisma.conversation.delete({ where: { id } });
    }

    return res.status(200).json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error in deleteConversation: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
