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
  socket: null,
  onlineUsers: {}, // map of userId -> status/lastSeen

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

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
