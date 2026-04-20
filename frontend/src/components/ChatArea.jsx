import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import usePresenceStore from '../stores/presenceStore';
import { getSocket } from '../services/socket';
import { chatAPI } from '../services/api';
import Avatar from './Avatar';
import MessageContextMenu from './MessageContextMenu';
import './ChatArea.css';
import './MessageContextMenu.css';

export default function ChatArea() {
  const user = useAuthStore((s) => s.user);
  const { activeChat, messages, isLoadingMessages, sendMessage, typingUsers } = useChatStore();
  const statuses = usePresenceStore((s) => s.statuses);
  const getLastSeenText = usePresenceStore((s) => s.getLastSeenText);
  const fetchStatus = usePresenceStore((s) => s.fetchStatus);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userId = user?.id || user?.userId;

  // Get the other participant
  const getOtherUser = () => {
    if (!activeChat?.participants) return { name: 'Chat' };
    const other = activeChat.participants.find(p =>
      p && (p.user_id || p._id || p.id || p) !== userId
    );
    return other || { name: 'Unknown' };
  };

  const otherUser = getOtherUser();
  const otherUserId = otherUser.user_id || otherUser._id || otherUser.id || otherUser;
  const otherName = otherUser.username || otherUser.name || 'Unknown';
  const isOtherTyping = typingUsers[otherUserId];

  // Fetch presence for the other user
  useEffect(() => {
    if (otherUserId && typeof otherUserId === 'string') {
      fetchStatus(otherUserId);
    }
  }, [otherUserId, fetchStatus]);

  const otherStatus = statuses[otherUserId];
  const presenceText = isOtherTyping
    ? 'typing...'
    : otherStatus?.isOnline
      ? 'online'
      : getLastSeenText(otherUserId) || '';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Acknowledge read receipts for incoming messages
    if (messages.length > 0 && !isLoadingMessages && otherUserId) {
      useChatStore.getState().markMessagesAsRead(otherUserId);
    }
  }, [messages, isLoadingMessages, otherUserId]);

  // Focus input on chat selection
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChat]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    sendMessage(trimmed, otherUserId);
    setText('');
    setReplyTo(null);

    // Stop typing indicator
    const socket = getSocket();
    if (socket) {
      socket.emit('typing:stop', { receiverId: otherUserId });
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing:start', { receiverId: otherUserId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { receiverId: otherUserId });
    }, 2000);
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const isMine = msg.senderId === userId;
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 250),
      msg,
      isMine,
    });
  };

  const handleDeleteMessage = async (msgId, type) => {
    // Keep a snapshot so we can roll back if the server call fails
    const prevMessages = useChatStore.getState().messages;

    useChatStore.setState((state) => ({
      messages: type === 'me'
        ? state.messages.filter(m => (m.messageId || m._id) !== msgId)
        : state.messages.map(m => (m.messageId || m._id) === msgId ? { ...m, isDeleted: true, content: '' } : m)
    }));

    try {
      // Backend currently supports "delete for me" semantics (adds user to message.deletedFor).
      // "Delete for everyone" is UI-only until the backend exposes a hard-delete endpoint.
      if (type === 'me') {
        await chatAPI.deleteMessage(msgId);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      useChatStore.setState({ messages: prevMessages });
    }
  };

  const handleStarMessage = (msgId) => {
    useChatStore.setState((state) => ({
      messages: state.messages.map(m => {
        if ((m.messageId || m._id) === msgId) {
          const starred = m.isStarred ? false : true;
          return { ...m, isStarred: starred };
        }
        return m;
      })
    }));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Status tick SVG components
  const SentTick = () => (
    <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.148.457.457 0 0 0-.344.148.41.41 0 0 0-.14.312c0 .12.046.222.14.312l2.727 2.58c.102.1.222.148.356.148a.505.505 0 0 0 .39-.178L11.1 1.28a.394.394 0 0 0 .106-.3.424.424 0 0 0-.136-.327z" fill="#8696a0"/>
    </svg>
  );

  const DeliveredTick = () => (
    <svg width="18" height="10" viewBox="0 0 24 12" fill="none">
      <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.148.457.457 0 0 0-.344.148.41.41 0 0 0-.14.312c0 .12.046.222.14.312l2.727 2.58c.102.1.222.148.356.148a.505.505 0 0 0 .39-.178L15.1 1.28a.394.394 0 0 0 .106-.3.424.424 0 0 0-.136-.327z" fill="#8696a0"/>
      <path d="M20.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-.8-.757a.457.457 0 0 0-.336-.148.457.457 0 0 0-.344.148.41.41 0 0 0-.14.312c0 .12.046.222.14.312l1.12 1.06c.102.1.222.148.356.148a.505.505 0 0 0 .39-.178L20.1 1.28a.394.394 0 0 0 .106-.3.424.424 0 0 0-.136-.327z" fill="#8696a0"/>
    </svg>
  );

  const ReadTick = () => (
    <svg width="18" height="10" viewBox="0 0 24 12" fill="none">
      <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.148.457.457 0 0 0-.344.148.41.41 0 0 0-.14.312c0 .12.046.222.14.312l2.727 2.58c.102.1.222.148.356.148a.505.505 0 0 0 .39-.178L15.1 1.28a.394.394 0 0 0 .106-.3.424.424 0 0 0-.136-.327z" fill="#53bdeb"/>
      <path d="M20.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-.8-.757a.457.457 0 0 0-.336-.148.457.457 0 0 0-.344.148.41.41 0 0 0-.14.312c0 .12.046.222.14.312l1.12 1.06c.102.1.222.148.356.148a.505.505 0 0 0 .39-.178L20.1 1.28a.394.394 0 0 0 .106-.3.424.424 0 0 0-.136-.327z" fill="#53bdeb"/>
    </svg>
  );

  const getStatusIcon = (msg) => {
    if (!msg.status || msg.status === 'sent') return <SentTick />;
    if (msg.status === 'delivered') return <DeliveredTick />;
    if (msg.status === 'read') return <ReadTick />;
    return <SentTick />;
  };

  return (
    <div className="chat-area">
      {/* Context Menu */}
      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isMine={contextMenu.isMine}
          isStarred={contextMenu.msg.isStarred}
          onReply={() => setReplyTo(contextMenu.msg)}
          onStar={() => handleStarMessage(contextMenu.msg.messageId || contextMenu.msg._id)}
          onDelete={(type) => handleDeleteMessage(contextMenu.msg.messageId || contextMenu.msg._id, type)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Header */}
      <div className="chat-area-header">
        <div className="chat-area-user">
          <Avatar
            name={otherName}
            imageUrl={otherUser.avatar_url}
            size="md"
            isOnline={otherStatus?.isOnline}
          />
          <div className="chat-area-user-info">
            <span className="chat-area-name">{otherName}</span>
            <span className={`chat-area-status ${isOtherTyping ? 'chat-area-status--typing' : ''} ${otherStatus?.isOnline ? 'chat-area-status--online' : ''}`}>
              {presenceText}
            </span>
          </div>
        </div>
        <div className="chat-area-actions">
          <button className="icon-btn" title="Search messages">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          <button
            className="icon-btn"
            title="Clear Chat"
            onClick={async () => {
              if (!window.confirm('Clear this conversation? Messages will be hidden only for you.')) return;
              try {
                await chatAPI.clearChat(activeChat._id || activeChat.id);
                // Re-select the active chat to reload messages with the new clearedAt marker applied
                await useChatStore.getState().selectChat({ ...activeChat });
              } catch (err) {
                console.error('Failed to clear chat:', err);
                window.alert('Could not clear chat. Please try again.');
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6L18 20C18 21.1 17.1 22 16 22H8C6.9 22 6 21.1 6 20L5 6" />
              <path d="M10 11L10 17" />
              <path d="M14 11L14 17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-area-messages">
        {isLoadingMessages && (
          <div className="chat-loading">
            <div className="spinner" />
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = (msg.senderId === userId);
          if (msg.isDeleted) {
            return (
              <div key={msg.messageId || msg._id || idx} className={`message ${isMine ? 'message--out' : 'message--in'} animate-fade-in`}>
                <div className="message-bubble message-bubble--deleted">
                  <p className="message-text" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                    🚫 This message was deleted
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.messageId || msg._id || idx}
              className={`message ${isMine ? 'message--out' : 'message--in'} animate-fade-in`}
              style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              <div className="message-bubble">
                {/* Reply reference */}
                {msg.replyTo && (
                  <div className="message-reply-ref">
                    <div className="message-reply-ref-name">{msg.replyTo.senderName || 'User'}</div>
                    <div className="message-reply-ref-text">{msg.replyTo.content || msg.replyTo.text}</div>
                  </div>
                )}

                <p className="message-text">{msg.content || msg.text}</p>
                <span className="message-time">
                  {msg.isStarred && (
                    <svg className="message-star" width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  {formatTime(msg.createdAt)}
                  {isMine && (
                    <span className="message-status-icon" style={{ marginLeft: '4px' }}>
                      {getStatusIcon(msg)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {isOtherTyping && (
          <div className="message message--in animate-fade-in">
            <div className="message-bubble typing-bubble">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="reply-preview-bar">
          <div className="reply-preview-content">
            <div className="reply-preview-name">{replyTo.senderId === userId ? 'You' : otherName}</div>
            <div className="reply-preview-text">{replyTo.content || replyTo.text}</div>
          </div>
          <button className="reply-preview-close" onClick={() => setReplyTo(null)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <form className="chat-area-input" onSubmit={handleSend}>
        <button type="button" className="icon-btn" title="Attach file">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <div className="input-wrapper">
          <input
            ref={inputRef}
            id="message-input"
            type="text"
            placeholder="Type a message"
            value={text}
            onChange={handleTyping}
            autoComplete="off"
          />
        </div>
        <button
          id="send-btn"
          type="submit"
          className={`send-btn ${text.trim() ? 'send-btn--active' : ''}`}
          disabled={!text.trim()}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
