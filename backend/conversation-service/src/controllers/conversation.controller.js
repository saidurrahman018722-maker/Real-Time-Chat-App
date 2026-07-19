import { prisma } from "../config/db.js";

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
          select: { id: true, name: true, profilePic: true, lastSeen: true },
        },
      },
    });

    // Format for easier frontend usage
    const formatted = conversations.map(c => ({
      id: c.id,
      partner: c.participants[0],
      lastMessage: null,
      updatedAt: c.updatedAt,
      pinnedBy: c.pinnedBy
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

export const togglePinConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const isPinned = conversation.pinnedBy.includes(userId);
    let updatedPinnedBy = [...conversation.pinnedBy];

    if (isPinned) {
      updatedPinnedBy = updatedPinnedBy.filter(uId => uId !== userId);
    } else {
      updatedPinnedBy.push(userId);
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { pinnedBy: updatedPinnedBy }
    });

    return res.status(200).json({ success: true, data: { pinnedBy: updated.pinnedBy } });
  } catch (error) {
    console.error("Error in togglePinConversation: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
