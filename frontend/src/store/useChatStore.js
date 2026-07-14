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
  isAddContactOpen: false,
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

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      const fetchedMessages = res.data.data;
      set({ messages: fetchedMessages });
      
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
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      // Optimistic UI could go here, but since we want verifiable states, let's wait for the real response
      const res = await axiosInstance.post(`/message/send/${selectedUser.id}`, messageData);
      set({ messages: [...messages, res.data.data] });
    } catch (error) {
      console.log('Error sending message:', error);
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
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/message/send/${receiverId}`, messageData);
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
