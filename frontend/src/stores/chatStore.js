import { create } from 'zustand';
import { chatAPI, userAPI } from '../services/api';
import { getSocket } from '../services/socket';
import useAuthStore from './authStore';

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  messagesPage: 1,
  hasMoreMessages: true,
  isLoadingChats: false,
  isLoadingMessages: false,
  typingUsers: {},

  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const { data } = await chatAPI.getChats();
      const loadedChats = data.data || [];
      
      const { user } = useAuthStore.getState();
      const currentUserId = user?.id || user?.userId;

      // Hydrate all the raw chat strings with actual remote user profiles
      const hydratedChats = await Promise.all(loadedChats.map(async (chat) => {
        try {
          const remoteUserId = chat.participants.find(p => typeof p === 'string' && p !== currentUserId);
          if (remoteUserId) {
            const res = await userAPI.getUser(remoteUserId);
            const targetUserObj = res.data.data;
            
            chat.participants = chat.participants.map(p => 
              p === remoteUserId ? targetUserObj : p
            );
          }
        } catch(e) { /* ignore single fetch failures */ }
        return chat;
      }));

      set({ chats: hydratedChats, isLoadingChats: false });
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      set({ isLoadingChats: false });
    }
  },

  selectChat: async (chat) => {
    set({ activeChat: chat, messages: [], messagesPage: 1, hasMoreMessages: true });
    await get().fetchMessages(chat._id || chat.id, 1);
  },

  fetchMessages: async (chatId, page = 1) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await chatAPI.getMessages(chatId, page);
      const msgs = data.data || [];
      set((state) => ({
        messages: page === 1 ? msgs.reverse() : [...msgs.reverse(), ...state.messages],
        messagesPage: page,
        hasMoreMessages: msgs.length >= 50,
        isLoadingMessages: false,
      }));
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: (text, receiverId) => {
    const socket = getSocket();
    const { activeChat } = get();
    if (!socket || !activeChat) return;

    socket.emit('message:send', {
      chatRoomId: activeChat._id || activeChat.id,
      receiverId,
      text,
      messageType: 'text',
    }, (ack) => {
      if (!ack?.success) {
        console.error('Message send failed:', ack?.error);
      }
    });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map(m => 
        (m.messageId === messageId || m._id === messageId) ? { ...m, status } : m
      )
    }));
  },

  markMessagesAsRead: (senderId) => {
    const socket = getSocket();
    const { messages, activeChat } = get();
    if (!socket || !activeChat) return;

    messages.forEach(msg => {
      // Only emit read status for messages sent BY THE OTHER USER that are not already read
      if (msg.senderId === senderId && msg.status !== 'read') {
        socket.emit('message:read', { messageId: msg.messageId || msg._id, senderId, receiverId: msg.senderId });
        // Optimistically update local state so we don't spam emit
        get().updateMessageStatus(msg.messageId || msg._id, 'read');
      }
    });
  },

  setTyping: (userId, status) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: status === 'typing' },
    }));
  },

  startChat: async (participantId, targetUserObj) => {
    try {
      const { data } = await chatAPI.getOrCreateChat(participantId);
      const chat = data.data;

      if (targetUserObj) {
        chat.participants = chat.participants.map(p =>
          p === participantId ? targetUserObj : p
        );
      }

      await get().fetchChats();
      await get().selectChat(chat);
      return chat;
    } catch (err) {
      // Preserve the server response shape so the UI can branch on error codes
      // like NOT_A_CONTACT / CONTACT_BLOCKED.
      const apiError = err.response?.data;
      if (apiError) {
        const enriched = new Error(apiError.message || 'Failed to create chat');
        enriched.code = apiError.code;
        enriched.status = err.response.status;
        console.error('Failed to create chat:', apiError);
        throw enriched;
      }
      console.error('Failed to create chat:', err);
      throw err;
    }
  },
}));

export default useChatStore;
