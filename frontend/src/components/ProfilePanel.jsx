import { useState } from 'react';
import useAuthStore from '../stores/authStore';
import { userAPI } from '../services/api';
import Avatar from './Avatar';
import './ProfilePanel.css';

export default function ProfilePanel({ onClose }) {
  const user = useAuthStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.username || user?.name || '');
  const [about, setAbout] = useState(user?.about || user?.status_message || 'Hey there! I am using WhatsApp');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await userAPI.updateProfile({ username: name, about });
      const updated = data.data;
      // Sync local store with the server response
      useAuthStore.setState((state) => ({
        user: { ...state.user, ...updated }
      }));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    }
    setIsSaving(false);
  };

  return (
    <div className="profile-panel">
      <div className="profile-panel-header">
        <button onClick={onClose} title="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2>Profile</h2>
      </div>

      <div className="profile-panel-avatar">
        <Avatar
          name={user?.username || user?.name}
          imageUrl={user?.avatar_url}
          size="xxl"
        />
      </div>

      <div className="profile-panel-body">
        <div className="profile-field">
          <div className="profile-field-label">Your Name</div>
          <div className="profile-field-value">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={50}
              />
            ) : (
              <>
                <span>{user?.username || user?.name || 'User'}</span>
                <button className="profile-field-edit" onClick={() => setIsEditing(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="profile-field">
          <div className="profile-field-label">About</div>
          <div className="profile-field-value">
            {isEditing ? (
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={140}
              />
            ) : (
              <>
                <span>{user?.about || user?.status_message || 'Hey there! I am using WhatsApp'}</span>
                <button className="profile-field-edit" onClick={() => setIsEditing(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="profile-field">
          <div className="profile-field-label">Phone</div>
          <div className="profile-field-value">
            <span>{user?.phone || 'Not set'}</span>
          </div>
        </div>

        {isEditing && (
          <button className="profile-save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
