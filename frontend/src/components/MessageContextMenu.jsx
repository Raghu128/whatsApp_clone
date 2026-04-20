import './MessageContextMenu.css';

export default function MessageContextMenu({ x, y, isMine, isStarred, onReply, onStar, onDelete, onClose }) {
  return (
    <>
      <div className="msg-context-overlay" onClick={onClose} />
      <div className="msg-context-menu" style={{ top: y, left: x }}>
        <button onClick={() => { onReply(); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
          </svg>
          Reply
        </button>

        <button onClick={() => { onStar(); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isStarred ? '#fbbf24' : 'none'} stroke={isStarred ? '#fbbf24' : 'currentColor'} strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {isStarred ? 'Unstar' : 'Star'}
        </button>

        <div className="msg-context-divider" />

        {isMine && (
          <button className="danger" onClick={() => { onDelete('everyone'); onClose(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6L18 20a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
            Delete for everyone
          </button>
        )}

        <button className="danger" onClick={() => { onDelete('me'); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6L18 20a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
          </svg>
          Delete for me
        </button>
      </div>
    </>
  );
}
