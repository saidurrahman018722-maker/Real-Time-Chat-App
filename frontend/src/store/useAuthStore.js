import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isLoggingIn: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check');
      set({ authUser: res.data.data });
    } catch (error) {
      console.log('Error in checkAuth:', error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (email, password) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      set({ authUser: res.data.data });
      return { success: true };
    } catch (error) {
      console.log('Error in login:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      set({ authUser: null });
    } catch (error) {
      console.log('Error in logout:', error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.post('/auth/update-profile', data);
      set((state) => ({ authUser: { ...state.authUser, ...res.data.user } }));
      return { success: true, message: res.data.message || 'Profile updated successfully' };
    } catch (error) {
      console.log('Error in updateProfile:', error);
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  },

  verifyEmail: async (token) => {
    try {
      const res = await axiosInstance.post('/auth/verify-email', { token });
      set((state) => ({ authUser: { ...state.authUser, verified: true } }));
      return { success: true, message: res.data.message || 'Email verified successfully' };
    } catch (error) {
      console.log('Error in verifyEmail:', error);
      return { success: false, message: error.response?.data?.message || 'Verification failed' };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true, message: res.data.message || 'Password changed successfully' };
    } catch (error) {
      console.log('Error in changePassword:', error);
      return { success: false, message: error.response?.data?.message || 'Password change failed' };
    }
  }
}));
