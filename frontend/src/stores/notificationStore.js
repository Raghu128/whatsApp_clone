import { create } from 'zustand';
import { notificationAPI } from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const { data } = await notificationAPI.getNotifications(page);
      set({ notifications: data.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      set({ unreadCount: data.data?.count || 0 });
    } catch {
      // Silently fail
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch {
      // Silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch {
      // Silently fail
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  }
}));

export default useNotificationStore;
