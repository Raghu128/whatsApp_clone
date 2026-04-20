import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import usePresenceStore from '../stores/presenceStore';
import { userAPI } from '../services/api';
import Avatar from './Avatar';
import ProfilePanel from './ProfilePanel';
import ContactsPanel from './ContactsPanel';
import AddContactModal from './AddContactModal';
import './Sidebar.css';

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { chats, activeChat, selectChat, isLoadingChats, startChat } = useChatStore();
  const statuses = usePresenceStore((s) => s.statuses);
  const fetchBulkStatus = usePresenceStore((s) => s.fetchBulkStatus);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'profile' | 'contacts' | null
  const [addContactCtx, setAddContactCtx] = useState(null); // { phone, name, pendingUser } | null

  const userId = user?.id || user?.userId;

  // Fetch presence for all chat participants
  useEffect(() => {
    if (chats.length === 0) return;
    const participantIds = chats
      .map(chat => {
        if (!chat.participants) return null;
        const other = chat.participants.find(p =>
          p && (p.user_id || p._id || p.id || p) !== userId
        );
        return other?.user_id || other?._id || other?.id || (typeof other === 'string' ? other : null);
      })
      .filter(Boolean);

    if (participantIds.length > 0) {
      fetchBulkStatus(participantIds);
    }
  }, [chats, userId, fetchBulkStatus]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await userAPI.searchUsers(q);
      setSearchResults(data.data || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleStartChat = async (targetUserObj) => {
    const targetUserId = targetUserObj.id || targetUserObj._id || targetUserObj.user_id;
    try {
      await startChat(targetUserId, targetUserObj);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    } catch (err) {
      if (err.code === 'NOT_A_CONTACT') {
        const phone = targetUserObj.phone || '';
        const proceed = window.confirm(
          `You can only chat with people in your contacts.\n\nAdd ${targetUserObj.username || 'this user'} as a contact first?`
        );
        if (proceed) {
          setAddContactCtx({
            phone,
            name: targetUserObj.username || '',
            pendingUser: targetUserObj,
          });
        }
        return;
      }
      if (err.code === 'CONTACT_BLOCKED') {
        window.alert('This contact is blocked. Unblock them to send messages.');
        return;
      }
      window.alert(err.message || 'Could not start chat. Please try again.');
    }
  };

  const handleContactAdded = async () => {
    const pending = addContactCtx?.pendingUser;
    setAddContactCtx(null);
    if (!pending) return;
    // Retry the chat now that the contact exists
    try {
      const targetUserId = pending.id || pending._id || pending.user_id;
      await startChat(targetUserId, pending);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    } catch (err) {
      console.error('Failed to start chat after adding contact:', err);
    }
  };

  const getChatName = (chat) => {
    if (chat.name) return chat.name;
    if (chat.participants) {
      const other = chat.participants.find(p =>
        p && (p.user_id || p._id || p.id || p) !== userId
      );
      return other?.username || other?.name || 'Unknown';
    }
    return 'Chat';
  };

  const getOtherUserId = (chat) => {
    if (!chat.participants) return null;
    const other = chat.participants.find(p =>
      p && (p.user_id || p._id || p.id || p) !== userId
    );
    return other?.user_id || other?._id || other?.id || (typeof other === 'string' ? other : null);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getLastMessagePreview = (chat) => {
    if (chat.lastMessage?.content) {
      const content = chat.lastMessage.content;
      if (typeof content === 'string') return content;
      if (content.text) return content.text;
    }
    if (typeof chat.lastMessage === 'string') return chat.lastMessage;
    return '';
  };

  return (
    <div className="sidebar">
      {/* Panel overlays */}
      {activePanel === 'profile' && (
        <ProfilePanel onClose={() => setActivePanel(null)} />
      )}
      {activePanel === 'contacts' && (
        <ContactsPanel
          onClose={() => setActivePanel(null)}
          onStartChat={handleStartChat}
        />
      )}

      {addContactCtx && (
        <AddContactModal
          initialPhone={addContactCtx.phone}
          initialName={addContactCtx.name}
          onClose={() => setAddContactCtx(null)}
          onAdded={handleContactAdded}
        />
      )}

      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-user" onClick={() => setActivePanel('profile')} style={{ cursor: 'pointer' }}>
          <Avatar
            name={user?.username || user?.name}
            imageUrl={user?.avatar_url}
            size="sm"
          />
          <span className="sidebar-username">{user?.username || user?.name || 'User'}</span>
        </div>
        <div className="sidebar-actions">
          <button
            className="icon-btn"
            title="Contacts"
            onClick={() => setActivePanel('contacts')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
          <button
            id="new-chat-btn"
            className="icon-btn"
            title="New Chat"
            onClick={() => document.getElementById('search-input')?.focus()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>
            </svg>
          </button>
          <div className="menu-wrapper">
            <button
              id="menu-btn"
              className="icon-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            {showMenu && (
              <div className="dropdown-menu animate-fade-in">
                <button id="profile-btn" onClick={() => { setShowMenu(false); setActivePanel('profile'); }}>Profile</button>
                <button id="contacts-btn" onClick={() => { setShowMenu(false); setActivePanel('contacts'); }}>Contacts</button>
                <div className="menu-divider" />
                <button id="logout-btn" className="menu-danger" onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="search-input"
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); setIsSearching(false); }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chat List / Search Results */}
      <div className="sidebar-list">
        {isSearching ? (
          searchResults.length > 0 ? (
            searchResults.map((result) => {
              const resultId = result.id || result._id || result.user_id;
              return (
                <button
                  key={`search-${resultId}`}
                  className="chat-item"
                  onClick={() => handleStartChat(result)}
                >
                  <Avatar
                    name={result.username || result.name}
                    imageUrl={result.avatar_url}
                    size="md"
                    isOnline={statuses[resultId]?.isOnline}
                  />
                  <div className="chat-item-info">
                    <span className="chat-item-name">{result.username || result.name}</span>
                    <span className="chat-item-preview">Tap to start chatting</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="sidebar-empty">
              <p>No users found</p>
            </div>
          )
        ) : isLoadingChats ? (
          <div className="sidebar-loading">
            <div className="spinner" />
          </div>
        ) : chats.length > 0 ? (
          chats.map((chat) => {
            const otherUid = getOtherUserId(chat);
            const isOnline = otherUid ? statuses[otherUid]?.isOnline : false;
            return (
              <button
                key={chat._id || chat.id}
                className={`chat-item ${(activeChat?._id || activeChat?.id) === (chat._id || chat.id) ? 'chat-item--active' : ''}`}
                onClick={() => selectChat(chat)}
              >
                <Avatar
                  name={getChatName(chat)}
                  size="md"
                  isOnline={isOnline}
                />
                <div className="chat-item-info">
                  <div className="chat-item-top">
                    <span className="chat-item-name">{getChatName(chat)}</span>
                    <span className="chat-item-time">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <span className="chat-item-preview">{getLastMessagePreview(chat) || 'Start chatting...'}</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="sidebar-empty">
            <p>No conversations yet</p>
            <span>Search for users to start chatting</span>
          </div>
        )}
      </div>
    </div>
  );
}
