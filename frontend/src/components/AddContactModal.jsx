import { useState } from 'react';
import { userAPI } from '../services/api';
import './AddContactModal.css';

export default function AddContactModal({ onClose, onAdded, initialPhone = '', initialName = '' }) {
  const [phone, setPhone] = useState(initialPhone);
  const [customName, setCustomName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError('Phone number is required');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const { data } = await userAPI.addContact(trimmedPhone, customName.trim() || undefined);
      onAdded?.(data.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add contact';
      setError(msg);
    }
    setIsSaving(false);
  };

  return (
    <div className="add-contact-overlay" onClick={onClose}>
      <div className="add-contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-contact-header">
          <h3>Add new contact</h3>
          <button className="add-contact-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="add-contact-body" onSubmit={handleSubmit}>
          <label className="add-contact-field">
            <span>Phone number</span>
            <input
              type="tel"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              disabled={isSaving}
            />
          </label>

          <label className="add-contact-field">
            <span>Custom name (optional)</span>
            <input
              type="text"
              placeholder="How they appear in your contacts"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              maxLength={50}
              disabled={isSaving}
            />
          </label>

          {error && <div className="add-contact-error">{error}</div>}

          <div className="add-contact-actions">
            <button type="button" className="add-contact-btn secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="add-contact-btn primary" disabled={isSaving || !phone.trim()}>
              {isSaving ? 'Adding...' : 'Add contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
