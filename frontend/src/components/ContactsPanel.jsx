import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import usePresenceStore from '../stores/presenceStore';
import Avatar from './Avatar';
import AddContactModal from './AddContactModal';
import './ContactsPanel.css';

export default function ContactsPanel({ onClose, onStartChat }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const statuses = usePresenceStore((s) => s.statuses);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const { data } = await userAPI.getContacts();
      setContacts(data.data || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
    setIsLoading(false);
  };

  // Normalize a contact row into the flat shape the UI cares about
  const shape = (c) => {
    const details = c.contactDetails || c.ContactDetail || {};
    return {
      row: c,
      contactUserId: c.contact_id || c.contactId,
      displayName:
        c.custom_name ||
        details.username ||
        c.nickname ||
        c.username ||
        'Unknown',
      about:
        details.status_message ||
        c.about ||
        c.status_message ||
        'Hey there! I am using WhatsApp',
      avatarUrl: details.avatar_url || c.avatar_url,
      phone: details.phone || c.phone,
      isBlocked: c.is_blocked,
    };
  };

  const handleRemove = async (contactUserId) => {
    if (!window.confirm('Remove this contact?')) return;
    try {
      await userAPI.removeContact(contactUserId);
      setContacts((prev) => prev.filter((c) => (c.contact_id || c.contactId) !== contactUserId));
    } catch (err) {
      console.error('Failed to remove contact:', err);
    }
  };

  const handleBlock = async (contactUserId) => {
    if (!window.confirm('Block this contact?')) return;
    try {
      await userAPI.blockContact(contactUserId);
      setContacts((prev) =>
        prev.map((c) =>
          (c.contact_id || c.contactId) === contactUserId ? { ...c, is_blocked: true } : c
        )
      );
    } catch (err) {
      console.error('Failed to block contact:', err);
    }
  };

  const handleStartChat = (shaped) => {
    onStartChat?.({
      id: shaped.contactUserId,
      user_id: shaped.contactUserId,
      username: shaped.displayName,
      avatar_url: shaped.avatarUrl,
    });
    onClose();
  };

  return (
    <div className="contacts-panel">
      <div className="contacts-panel-header">
        <button onClick={onClose} title="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2>Contacts</h2>
        <button
          className="contacts-add-btn"
          title="Add contact"
          onClick={() => setShowAdd(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </button>
      </div>

      <div className="contacts-list">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : contacts.length > 0 ? (
          contacts.map((c) => {
            const s = shape(c);
            const isOnline = statuses[s.contactUserId]?.isOnline;
            return (
              <div
                key={s.contactUserId}
                className={`contact-item ${s.isBlocked ? 'contact-item--blocked' : ''}`}
              >
                <button
                  className="contact-item-main"
                  onClick={() => handleStartChat(s)}
                  disabled={s.isBlocked}
                  title={s.isBlocked ? 'Blocked' : 'Message'}
                >
                  <Avatar
                    name={s.displayName}
                    imageUrl={s.avatarUrl}
                    size="md"
                    isOnline={isOnline}
                  />
                  <div className="contact-item-info">
                    <div className="contact-item-name">
                      {s.displayName}
                      {s.isBlocked && <span className="contact-blocked-tag">Blocked</span>}
                    </div>
                    <div className="contact-item-about">{s.about}</div>
                  </div>
                </button>

                <div className="contact-item-actions">
                  {!s.isBlocked && (
                    <button
                      className="block-btn"
                      title="Block contact"
                      onClick={() => handleBlock(s.contactUserId)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                    </button>
                  )}
                  <button
                    className="block-btn"
                    title="Remove contact"
                    onClick={() => handleRemove(s.contactUserId)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="contacts-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p>No contacts yet</p>
            <button className="contacts-add-cta" onClick={() => setShowAdd(true)}>
              Add your first contact
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddContactModal
          onClose={() => setShowAdd(false)}
          onAdded={() => loadContacts()}
        />
      )}
    </div>
  );
}
