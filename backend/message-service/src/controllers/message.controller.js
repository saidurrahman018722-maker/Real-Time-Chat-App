import { prisma } from "../config/db.js";
import cloudinary from "../utils/cloudinary.js";
import { redis } from "../config/redis.connect.js";

// --- MESSAGES ---

export const getSharedMediaGlobal = async (req, res) => {
  try {
    const myId = req.session.userId;
    const mediaMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId },
          { receiverId: myId }
        ],
        image: { not: null },
        isDeletedForEveryone: false,
        NOT: { deletedBy: { has: myId } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json({ success: true, data: mediaMessages });
  } catch (error) {
    console.error("Error in getSharedMediaGlobal: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getSharedMediaConversation = async (req, res) => {
  try {
    const myId = req.session.userId;
    const { id: userToChatId } = req.params;
    const conversationId = [myId, userToChatId].sort().join('_');

    const mediaMessages = await prisma.message.findMany({
      where: {
        conversationId,
        image: { not: null },
        isDeletedForEveryone: false,
        NOT: { deletedBy: { has: myId } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json({ success: true, data: mediaMessages });
  } catch (error) {
    console.error("Error in getSharedMediaConversation: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

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
      include: { replyTo: true, sharedContact: true, reactions: true }
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
    const { text, image, audio, video, document, replyToId, isForwarded, sharedContactId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.session.userId;

    // Check if the sender is blocked by the receiver
    const isBlocked = await redis.get(`block:${receiverId}:${senderId}`);
    if (isBlocked === 'true') {
      return res.status(403).json({ error: "You are blocked by this user" });
    }

    let imageUrl, audioUrl, videoUrl, documentUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "video" });
      audioUrl = uploadResponse.secure_url;
    }
    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, { resource_type: "video" });
      videoUrl = uploadResponse.secure_url;
    }
    if (document) {
      const uploadResponse = await cloudinary.uploader.upload(document, { resource_type: "auto" });
      documentUrl = uploadResponse.secure_url;
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
        image: imageUrl,
        audio: audioUrl,
        video: videoUrl,
        document: documentUrl,
        replyToId: replyToId || null,
        isForwarded: isForwarded || false,
        sharedContactId: sharedContactId || null
      },
      include: { replyTo: true, sharedContact: true, reactions: true }
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
          image: null,
          video: null,
          audio: null,
          document: null
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

export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.session.userId;
    
    // Group unread messages by conversationId where receiver is me
    const unreadMessages = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        receiverId: myId,
        status: { in: ['SENT', 'DELIVERED'] },
      },
      _count: {
        id: true,
      },
    });

    const unreadCounts = {};
    unreadMessages.forEach((group) => {
      unreadCounts[group.conversationId] = group._count.id;
    });

    return res.status(200).json({ success: true, data: unreadCounts });
  } catch (error) {
    console.error("Error in getUnreadCounts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params; // sender's id
    const myId = req.session.userId; // receiver's id

    // Mark all unread messages from this user to me as read
    const updated = await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: myId,
        status: { in: ['SENT', 'DELIVERED'] },
      },
      data: {
        status: 'READ',
      },
    });

    return res.status(200).json({ success: true, updatedCount: updated.count });
  } catch (error) {
    console.error("Error in markConversationAsRead:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const togglePinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Toggle pin status
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { isPinned: !message.isPinned }
    });

    // Emit socket event
    try {
      const { io, userSockets } = await import('../../index.js');
      const emitTo = (targetId) => {
        const socketId = userSockets.get(targetId);
        if (socketId) io.to(socketId).emit('messagePinned', { messageId: id, isPinned: updatedMessage.isPinned });
      };
      emitTo(message.senderId);
      if (message.receiverId) emitTo(message.receiverId);
    } catch (socketErr) {
      console.error('Socket error in togglePinMessage:', socketErr);
    }

    return res.status(200).json({ success: true, data: updatedMessage });
  } catch (error) {
    console.error('Error in togglePinMessage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const forwardMessages = async (req, res) => {
  try {
    const { messageIds, receiverId } = req.body;
    const senderId = req.session.userId;

    const messagesToForward = await prisma.message.findMany({
      where: { id: { in: messageIds } }
    });

    if (!messagesToForward.length) return res.status(404).json({ error: 'Messages not found' });

    const conversationId = [senderId, receiverId].sort().join('_');

    let conversation = await prisma.conversation.upsert({
      where: { id: conversationId },
      update: { deletedBy: [] },
      create: {
        id: conversationId,
        participants: { connect: [{ id: senderId }, { id: receiverId }] }
      }
    });

    const newMessagesData = messagesToForward.map(m => ({
      senderId,
      receiverId,
      conversationId: conversation.id,
      text: m.text,
      image: m.image,
      isForwarded: true
    }));

    const newMessages = await prisma.message.createManyAndReturn({ data: newMessagesData });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Try to emit via sockets
    try {
      const { io, userSockets } = await import('../../index.js');
      const receiverSocketId = userSockets.get(receiverId);
      const senderSocketId = userSockets.get(senderId);

      for (const msg of newMessages) {
        if (receiverSocketId) io.to(receiverSocketId).emit('newMessage', msg);
        if (senderSocketId) io.to(senderSocketId).emit('messageStatusUpdate', { messageId: msg.id, status: 'DELIVERED' });
      }
    } catch (socketErr) {
      console.error('Socket error in forwardMessages:', socketErr);
    }

    return res.status(201).json({ success: true, data: newMessages });
  } catch (error) {
    console.error('Error in forwardMessages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.session.userId;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: { userId_messageId: { userId, messageId } }
    });

    let action = 'upsert';

    if (existingReaction && existingReaction.emoji === emoji) {
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });
      action = 'delete';
    } else {
      await prisma.reaction.upsert({
        where: { userId_messageId: { userId, messageId } },
        update: { emoji },
        create: { emoji, userId, messageId }
      });
      action = 'upsert';
    }

    const updatedMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: { reactions: true, replyTo: true, sharedContact: true }
    });

    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
    if (otherUserId) {
      try {
        const { io, userSockets } = await import('../../index.js');
        const otherSocketId = userSockets.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('messageReactionUpdated', { messageId, reactions: updatedMessage.reactions });
        }
      } catch (err) {
        console.error('Socket emission error for reaction:', err);
      }
    }

    return res.status(200).json({ success: true, action, message: updatedMessage });
  } catch (error) {
    console.error('Error in reactToMessage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
