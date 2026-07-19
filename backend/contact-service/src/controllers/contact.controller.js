import { prisma } from "../config/db.js";

// Search users by exact email or by name (case-insensitive substring)
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.session.userId } },
          {
            OR: [
              { email: { equals: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        lastSeen: true,
      },
      take: 10, // Limit results
    });

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error in searchUsers: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const addContact = async (req, res) => {
  try {
    const { userId } = req.params;
    const ownerId = req.session.userId;
    const { alias } = req.body;

    if (userId === ownerId) {
      return res.status(400).json({ error: "You cannot add yourself" });
    }

    const contact = await prisma.contact.create({
      data: {
        ownerId,
        userId,
        alias
      },
      include: {
        user: { select: { id: true, name: true, profilePic: true, email: true, lastSeen: true } }
      }
    });

    return res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error("Error in addContact: ", error.message);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Contact already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getContacts = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { ownerId: req.session.userId },
      include: {
        user: { select: { id: true, name: true, email: true, profilePic: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    console.error("Error in getContacts: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { contactId } = req.params;
    const ownerId = req.session.userId;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact || contact.ownerId !== ownerId) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { isFavorite: !contact.isFavorite }
    });

    return res.status(200).json({ success: true, data: updatedContact });
  } catch (error) {
    console.error("Error in toggleFavorite: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
