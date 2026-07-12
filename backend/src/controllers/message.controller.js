import { prisma } from "../config/db.js";
import cloudinary from "../utils/cloudinary.js";

// --- MESSAGES ---

export const getMessageByUserId = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.session.userId;

    // Find the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: myId } } },
          { participants: { some: { id: userToChatId } } }
        ]
      }
    });

    if (!conversation) {
      return res.status(200).json({ success: true, data: [] });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        NOT: { deletedBy: { has: myId } }
      },
      orderBy: { createdAt: "asc" },
    });

    // Map through messages to apply WhatsApp-style "This message was deleted" tombstone
    const formattedMessages = messages.map(msg => {
      if (msg.isDeletedForEveryone) {
        return {
          ...msg,
          text: "🚫 This message was deleted",
          image: null
        };
      }
      return msg;
    });

    return res.status(200).json({ success: true, data: formattedMessages });
  } catch (error) {
    console.error("Error in getMessageByUserId: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.session.userId;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // 1. Find or Create Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: senderId } } },
          { participants: { some: { id: receiverId } } }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: senderId }, { id: receiverId }]
          }
        }
      });
    } else {
      // If conversation was deleted by either party, restore it
      if (conversation.deletedBy.length > 0) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { deletedBy: [] }
        });
      }
    }

    // 2. Create the message
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        conversationId: conversation.id,
        text,
        image: imageUrl,
      },
    });

    // 3. Update Conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // TODO: Socket.io delivery

    return res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    console.error("Error in sendMessage: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params; // Message ID
    const { forEveryone } = req.body; // boolean
    const userId = req.session.userId;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Ensure the user has rights to this message
    if (message.senderId !== userId && message.receiverId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (forEveryone) {
      // Only sender can delete for everyone
      if (message.senderId !== userId) {
        return res.status(403).json({ error: "Only the sender can delete for everyone" });
      }
      
      await prisma.message.update({
        where: { id },
        data: { 
          isDeletedForEveryone: true,
          text: null, // Clear the content from DB for privacy
          image: null
        }
      });
    } else {
      // Delete for me
      await prisma.message.update({
        where: { id },
        data: { deletedBy: { push: userId } }
      });
    }

    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Error in deleteMessage: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
