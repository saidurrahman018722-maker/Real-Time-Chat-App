import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3004'; // message-service port

export const useChatStore = create((set, get) => ({
  conversations: [],
  contacts: [],
  messages: [],
  selectedUser: null,
  isConversationsLoading: false,
  isMessagesLoading: false,
  isMediaLoading: false,
  isAddContactOpen: false,
  pendingMessage: null,
  sharedMediaGlobal: [],
  sharedMediaConversation: [],
  socket: null,
  onlineUsers: {}, // map of userId -> status/lastSeen

  setIsAddContactOpen: (isOpen) => set({ isAddContactOpen: isOpen }),

  initSocket: () => {
    const { socket } = get();
    if (socket?.connected) return;

    // Use axios to get the current session cookie implicitly
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('newMessage', (message) => {
      const { selectedUser, messages } = get();
      if (selectedUser && message.conversationId === messages[0]?.conversationId) {
        set({ messages: [...messages, message] });
        
        // Emitting markAsRead if the chat is open
        newSocket.emit('markAsRead', { messageId: message.id, senderId: message.senderId });
      }
    });

    newSocket.on('messageStatusUpdate', ({ messageId, status }) => {
      set((state) => ({
        messages: state.messages.map((msg) => 
          msg.id === messageId ? { ...msg, status } : msg
        )
      }));
    });

    newSocket.on('userStatus', ({ userId, status }) => {
      set((state) => ({
        onlineUsers: { ...state.onlineUsers, [userId]: status }
      }));
    });

    newSocket.on('initialOnlineUsers', (userIds) => {
      const initialMap = {};
      userIds.forEach(id => {
        initialMap[id] = 'online';
      });
      set({ onlineUsers: initialMap });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get('/conversation');
      set({ conversations: res.data.data });
    } catch (error) {
      console.log('Error fetching conversations:', error);
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  getContacts: async () => {
    try {
      const res = await axiosInstance.get('/contact');
      set({ contacts: res.data.data });
    } catch (error) {
      console.log('Error fetching contacts:', error);
    }
  },

  searchUsers: async (query) => {
    try {
      const res = await axiosInstance.get(`/contact/search?query=${query}`);
      return res.data.data; // Return the users array directly
    } catch (error) {
      console.log('Error searching users:', error);
      return [];
    }
  },

  addContact: async (userId, alias) => {
    try {
      const res = await axiosInstance.post(`/contact/${userId}`, { alias });
      // Update contacts list in store
      set((state) => ({ contacts: [res.data.data, ...state.contacts] }));
      return { success: true };
    } catch (error) {
      console.log('Error adding contact:', error);
      return { success: false, message: error.response?.data?.error || 'Failed to add contact' };
    }
  },

  getSharedMediaGlobal: async () => {
    set({ isMediaLoading: true });
    try {
      const res = await axiosInstance.get('/message/media/global');
      set({ sharedMediaGlobal: res.data.data });
    } catch (error) {
      console.log('Error fetching global media:', error);
    } finally {
      set({ isMediaLoading: false });
    }
  },

  getSharedMediaConversation: async (userId) => {
    set({ isMediaLoading: true });
    try {
      const res = await axiosInstance.get(`/message/media/${userId}`);
      set({ sharedMediaConversation: res.data.data });
    } catch (error) {
      console.log('Error fetching conversation media:', error);
    } finally {
      set({ isMediaLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      const fetchedMessages = res.data.data;
      
      // Prevent race conditions
      if (get().selectedUser?.id === userId) {
        set({ messages: fetchedMessages });
      }
      
      // Mark as read for received messages that are SENT or DELIVERED
      const { socket } = get();
      if (socket) {
        fetchedMessages.forEach(msg => {
          if (msg.senderId === userId && msg.status !== 'READ') {
            socket.emit('markAsRead', { messageId: msg.id, senderId: userId });
          }
        });
      }
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      if (get().selectedUser?.id === userId) {
        set({ isMessagesLoading: false });
      }
    }
  },

  sendMessage: async (messageData) => {
    // Capture receiver ID before the await
    const receiverId = get().selectedUser?.id;
    if (!receiverId) return;

    set({ pendingMessage: { ...messageData, receiverId } });

    try {
      const res = await axiosInstance.post(`/message/send/${receiverId}`, messageData);
      const newMsg = res.data.data;
      
      const { selectedUser, messages, conversations } = get();
      
      // Only append to the messages list if we are still looking at this user
      if (selectedUser?.id === receiverId) {
        set({ messages: [...messages, newMsg] });
      }

      // Update conversations list for the sidebar
      const exists = conversations.some(c => c.id === newMsg.conversationId);
      if (!exists) {
        get().getConversations();
      } else {
        const updatedConversations = conversations.map(conv => {
          if (conv.id === newMsg.conversationId) {
            return { ...conv, lastMessage: newMsg, updatedAt: new Date().toISOString() };
          }
          return conv;
        });
        const sortedConversations = updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        set({ conversations: sortedConversations });
      }
    } catch (error) {
      console.log('Error sending message:', error);
    } finally {
      if (get().pendingMessage?.receiverId === receiverId) {
        set({ pendingMessage: null });
      }
    }
  },

  toggleFavoriteContact: async (contactId) => {
    try {
      const res = await axiosInstance.put(`/contact/${contactId}/favorite`);
      const updatedContact = res.data.data;
      set((state) => ({
        contacts: state.contacts.map((c) =>
          c.id === contactId ? { ...c, isFavorite: updatedContact.isFavorite } : c
        ),
      }));
    } catch (error) {
      console.log('Error toggling favorite contact:', error);
    }
  },

  deleteMessage: async (messageId, forEveryone) => {
    try {
      await axiosInstance.delete(`/message/${messageId}`, { data: { forEveryone } });
      if (forEveryone) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId
              ? { ...m, isDeletedForEveryone: true, text: "🚫 This message was deleted", image: null }
              : m
          ),
        }));
      } else {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== messageId),
        }));
      }
    } catch (error) {
      console.log('Error deleting message:', error);
    }
  },

  forwardMessage: async (messageData, receiverId) => {
    try {
      const res = await axiosInstance.post(`/message/send/${receiverId}`, messageData);
      
      const { selectedUser, messages } = get();
      
      // If we are currently looking at the chat we forwarded to, add it to the view
      if (selectedUser?.id === receiverId) {
        set({ messages: [...messages, res.data.data] });
      }
      return { success: true };
    } catch (error) {
      console.log('Error forwarding message:', error);
      return { success: false };
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
