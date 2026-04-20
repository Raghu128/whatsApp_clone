import { create } from 'zustand';
import { presenceAPI } from '../services/api';
import { getSocket } from '../services/socket';

const usePresenceStore = create((set, get) => ({
  // Map of userId -> { isOnline, lastSeen }
  statuses: {},
  heartbeatInterval: null,

  /**
   * Fetch presence for a single user
   */
  fetchStatus: async (userId) => {
    if (!userId) return;
    try {
      const { data } = await presenceAPI.getStatus(userId);
      const status = data.data;
      set((state) => ({
        statuses: {
          ...state.statuses,
          [userId]: { isOnline: status?.isOnline || false, lastSeen: status?.lastSeen || null }
        }
      }));
    } catch {
      // Silently fail — user may not have presence data yet
    }
  },

  /**
   * Fetch presence for multiple users in bulk
   */
  fetchBulkStatus: async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    try {
      const { data } = await presenceAPI.getBulkStatus(userIds);
      const results = data.data || {};
      set((state) => {
        const updated = { ...state.statuses };
        Object.entries(results).forEach(([uid, status]) => {
          updated[uid] = { isOnline: status?.isOnline || false, lastSeen: status?.lastSeen || null };
        });
        return { statuses: updated };
      });
    } catch {
      // Silently fail
    }
  },

  /**
   * Update a single user's status from a socket event
   */
  setUserStatus: (userId, isOnline, lastSeen) => {
    set((state) => ({
      statuses: {
        ...state.statuses,
        [userId]: { isOnline, lastSeen: lastSeen || (isOnline ? null : new Date().toISOString()) }
      }
    }));
  },

  /**
   * Start sending heartbeats every 25 seconds
   */
  startHeartbeat: () => {
    const existing = get().heartbeatInterval;
    if (existing) return; // Already running

    // Send initial heartbeat
    const sendHeartbeat = () => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('heartbeat');
      }
      // Also hit the REST endpoint for the Presence Service
      presenceAPI.heartbeat().catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 25000);
    set({ heartbeatInterval: interval });
  },

  /**
   * Stop heartbeats on logout
   */
  stopHeartbeat: () => {
    const interval = get().heartbeatInterval;
    if (interval) {
      clearInterval(interval);
      set({ heartbeatInterval: null });
    }
  },

  /**
   * Get a formatted "last seen" string
   */
  getLastSeenText: (userId) => {
    const status = get().statuses[userId];
    if (!status) return '';
    if (status.isOnline) return 'online';
    if (!status.lastSeen) return '';

    const now = new Date();
    const seen = new Date(status.lastSeen);
    const diffMs = now - seen;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'last seen just now';
    if (diffMin < 60) return `last seen ${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `last seen ${diffHrs}h ago`;
    return `last seen ${seen.toLocaleDateString()} at ${seen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}));

export default usePresenceStore;
