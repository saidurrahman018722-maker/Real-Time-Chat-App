import { prisma } from "../config/db.js";
import cloudinary from "../utils/cloudinary.js";

// --- MESSAGES ---

export const getMessageByUserId = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.session.userId;
    const conversationId = [myId, userToChatId].sort().join('_');

    // Find the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { cursor, limit = 50 } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        NOT: { deletedBy: { has: myId } }
      },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
    });

    // Reverse to get chronological order for display
    const orderedMessages = messages.reverse();

    // Map through messages to apply WhatsApp-style "This message was deleted" tombstone
    const formattedMessages = orderedMessages.map(msg => {
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

    const conversationId = [senderId, receiverId].sort().join('_');

    // 1. Upsert Conversation
    let conversation = await prisma.conversation.upsert({
      where: { id: conversationId },
      update: { deletedBy: [] }, // Restore if deleted
      create: {
        id: conversationId,
        participants: {
          connect: [{ id: senderId }, { id: receiverId }]
        }
      }
    });

    // 2. Create the message
    let newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        conversationId: conversation.id,
        text,
        image: imageUrl
      },
    });

    // 3. Update Conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // 4. Publish MessageCreated via Kafka so conversation-service can upsert it
    try {
      const { publishEvent } = await import('../../../shared/kafka.js');
      await publishEvent('message-events', 'MessageCreated', {
        id: newMessage.id,
        conversationId: conversation.id,
        senderId,
        receiverId
      });
    } catch (err) {
      console.error('Kafka Publish Error (MessageCreated):', err);
    }

    // --- MICROSERVICE REFACTOR: Emit via local io ---
    try {
      const { io, userSockets } = await import('../../index.js');
      const receiverSocketId = userSockets.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', newMessage);
        
        // Also let the sender know it was delivered immediately
        const senderSocketId = userSockets.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageStatusUpdate', { messageId: newMessage.id, status: 'DELIVERED' });
        }
      }
    } catch (socketErr) {
      console.error('Socket Emission Error:', socketErr);
    }
    // ------------------------------------------------

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
