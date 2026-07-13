import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

export const useChatStore = create((set, get) => ({
  conversations: [],
  contacts: [],
  messages: [],
  selectedUser: null,
  isConversationsLoading: false,
  isMessagesLoading: false,

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get('/conversation/api/');
      set({ conversations: res.data.data });
    } catch (error) {
      console.log('Error fetching conversations:', error);
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  getContacts: async () => {
    try {
      const res = await axiosInstance.get('/contact/api/');
      set({ contacts: res.data.data });
    } catch (error) {
      console.log('Error fetching contacts:', error);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/api/${userId}`);
      set({ messages: res.data.data });
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/message/api/send/${selectedUser.id}`, messageData);
      set({ messages: [...messages, res.data.data] });
    } catch (error) {
      console.log('Error sending message:', error);
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
