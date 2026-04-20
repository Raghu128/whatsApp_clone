import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — auto logout on expired token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const isAuthRoute = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      
      if (refreshToken && !error.config._retry && !isAuthRoute) {
        error.config._retry = true;
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: (payload) => api.post('/auth/logout', payload),
  me: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (payload) => api.put('/users/profile', payload),
  uploadAvatar: (avatarUrl) => api.post('/users/avatar', { avatar_url: avatarUrl }),
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getUser: (id) => api.get(`/users/${id}`),
  getContacts: () => api.get('/users/contacts'),
  addContact: (targetPhone, customName) =>
    api.post('/users/contacts', { targetPhone, customName }),
  removeContact: (contactUserId) => api.delete(`/users/contacts/${contactUserId}`),
  blockContact: (contactUserId) => api.post(`/users/contacts/${contactUserId}/block`),
};

// Chat API
export const chatAPI = {
  getChats: () => api.get('/chats'),
  getOrCreateChat: (targetUserId) => api.post('/chats', { targetUserId }),
  getMessages: (chatId, page = 1) => api.get(`/chats/${chatId}/messages?page=${page}`),
  clearChat: (chatId) => api.delete(`/chats/${chatId}`),
  deleteMessage: (messageId) => api.delete(`/chats/messages/${messageId}`),
};

// Presence API
export const presenceAPI = {
  heartbeat: () => api.post('/presence/heartbeat'),
  getStatus: (userId) => api.get(`/presence/${userId}`),
  getBulkStatus: (userIds) => api.post('/presence/bulk', { userIds }),
};

// Notification API
export const notificationAPI = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Media API
export const mediaAPI = {
  upload: (formData) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  getMediaUrl: (id) => `/api/v1/media/${id}`,
  getThumbnailUrl: (id) => `/api/v1/media/thumbnail/${id}`,
};

export default api;
