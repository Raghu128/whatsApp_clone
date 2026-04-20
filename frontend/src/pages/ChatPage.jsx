import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import usePresenceStore from '../stores/presenceStore';
import useNotificationStore from '../stores/notificationStore';
import { getSocket } from '../services/socket';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import EmptyState from '../components/EmptyState';
import './ChatPage.css';

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const activeChat = useChatStore((s) => s.activeChat);
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const fetchChats = useChatStore((s) => s.fetchChats);
  const startHeartbeat = usePresenceStore((s) => s.startHeartbeat);
  const stopHeartbeat = usePresenceStore((s) => s.stopHeartbeat);
  const setUserStatus = usePresenceStore((s) => s.setUserStatus);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  // Fetch initial data
  useEffect(() => {
    fetchChats();
    fetchUnreadCount();

    // Start heartbeat for presence
    startHeartbeat();

    return () => {
      stopHeartbeat();
    };
  }, [fetchChats, fetchUnreadCount, startHeartbeat, stopHeartbeat]);

  // Listen to socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg) => {
      addMessage(msg);
      // Auto-emit delivered if the message came from someone else
      const currentUserId = useAuthStore.getState().user?.id || useAuthStore.getState().user?.userId;
      if (msg.senderId !== currentUserId) {
        socket.emit('message:delivered', {
          messageId: msg.messageId || msg._id,
          senderId: msg.senderId
        });
      }
    };

    const handleMessageStatus = ({ messageId, status }) => {
      useChatStore.getState().updateMessageStatus(messageId, status);
    };

    const handleTyping = ({ userId, status }) => {
      setTyping(userId, status);
    };

    // Presence: user online/offline events
    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      setUserStatus(userId, isOnline, lastSeen);
    };

    // Notifications
    const handleNotification = (notification) => {
      addNotification(notification);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleMessageStatus);
    socket.on('typing:status', handleTyping);
    socket.on('user:status', handleUserStatus);
    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleMessageStatus);
      socket.off('typing:status', handleTyping);
      socket.off('user:status', handleUserStatus);
      socket.off('notification:new', handleNotification);
    };
  }, [addMessage, setTyping, setUserStatus, addNotification]);

  return (
    <div className="chat-page">
      <Sidebar />
      <div className="chat-main">
        {activeChat ? <ChatArea /> : <EmptyState />}
      </div>
    </div>
  );
}
