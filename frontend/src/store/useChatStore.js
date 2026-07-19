import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3004'; // message-service port

export const useChatStore = create((set, get) => ({
  conversations: [],
  contacts: [],
  messages: [],
  sharedMediaGlobal: [],
  sharedMediaConversation: [],
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
  unreadCounts: {}, // map of conversationId -> count

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
      const { selectedUser, messages, unreadCounts, conversations } = get();
      
      // Update conversations list for the sidebar
      const exists = conversations.some(c => c.id === message.conversationId);
      if (!exists) {
        get().getConversations();
      } else {
        const updatedConversations = conversations.map(conv => {
          if (conv.id === message.conversationId) {
            return { ...conv, lastMessage: message, updatedAt: new Date().toISOString() };
          }
          return conv;
        });
        // Move updated conversation to top
        const sortedConversations = updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        set({ conversations: sortedConversations });
      }

      // If the message belongs to the currently open chat
      if (selectedUser && (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
        set({ messages: [...messages, message] });
        newSocket.emit('markAsRead', { messageId: message.id, senderId: message.senderId });
      } else {
        // Increment unread count if the chat is not currently open
        const currentCount = unreadCounts[message.conversationId] || 0;
        set({ 
          unreadCounts: { ...unreadCounts, [message.conversationId]: currentCount + 1 }
        });
      }
    });

    newSocket.on('messageStatusUpdate', ({ messageId, status }) => {
      set((state) => ({
        messages: state.messages.map((msg) => 
          msg.id === messageId ? { ...msg, status } : msg
        ),
        conversations: state.conversations.map(conv => {
          if (conv.lastMessage?.id === messageId) {
            return { ...conv, lastMessage: { ...conv.lastMessage, status } };
          }
          return conv;
        })
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
      get().fetchUnreadCounts(); // Fetch unread counts after getting conversations
    } catch (error) {
      console.log('Error fetching conversations:', error);
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  fetchUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get('/message/unread-counts');
      set({ unreadCounts: res.data.data });
    } catch (error) {
      console.log('Error fetching unread counts:', error);
    }
  },

  markConversationAsRead: async (userId) => {
    try {
      const { unreadCounts } = get();
      // Call backend to mark as read
      await axiosInstance.post(`/message/mark-read/${userId}`);

      // Optimistically clear the unread count for this conversation
      const conv = get().conversations.find(c => c.partner?.id === userId);
      if (conv) {
        set({
          unreadCounts: { ...unreadCounts, [conv.id]: 0 }
        });
      }

      // Refresh counts to stay consistent
      get().fetchUnreadCounts();
    } catch (error) {
      console.log('Error marking conversation as read:', error);
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
      
      // Prevent race conditions: only update if we are still looking at this user
      if (get().selectedUser?.id === userId) {
        set({ messages: fetchedMessages });
      }
      
      // Mark as read is now handled concurrently by ChatWindow calling markConversationAsRead 
      // which hits the backend HTTP endpoint, updating DB and emitting to the sender.
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

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
