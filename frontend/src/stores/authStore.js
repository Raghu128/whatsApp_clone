import { create } from 'zustand';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import usePresenceStore from './presenceStore';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Check if we already have a valid token on app boot
  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authAPI.me();
      connectSocket(token);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.clear();
      set({ isLoading: false });
    }
  },

  register: async (payload) => {
    const { data } = await authAPI.register(payload);
    const { user, tokens } = data.data;
    const { accessToken, refreshToken } = tokens;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    connectSocket(accessToken);
    set({ user, isAuthenticated: true });
    return data;
  },

  login: async (payload) => {
    const { data } = await authAPI.login(payload);
    const { user, tokens } = data.data;
    const { accessToken, refreshToken } = tokens;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    connectSocket(accessToken);
    set({ user, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authAPI.logout({ refreshToken });
    } catch {
      // Ignore errors on logout
    }
    localStorage.clear();
    disconnectSocket();
    // Stop heartbeat so presence shows offline
    usePresenceStore.getState().stopHeartbeat();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
