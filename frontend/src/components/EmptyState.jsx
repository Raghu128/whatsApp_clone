import './EmptyState.css';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-content animate-fade-in">
        <div className="empty-state-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h2>WhatsApp Clone</h2>
        <p>Send and receive messages in real-time.<br/>Select a conversation or search for a user to get started.</p>
        <div className="empty-state-features">
          <div className="empty-feature">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>End-to-end encrypted (AES-256-GCM)</span>
          </div>
          <div className="empty-feature">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span>Real-time delivery & read receipts</span>
          </div>
          <div className="empty-feature">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Online presence & typing indicators</span>
          </div>
        </div>
      </div>
    </div>
  );
}
