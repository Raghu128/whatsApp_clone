import './Avatar.css';

export default function Avatar({ name, imageUrl, size = 'md', isOnline = false }) {
  const getInitials = (n) => {
    if (!n || typeof n !== 'string') return '?';
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`avatar-wrapper avatar-wrapper--${size}`}>
      {imageUrl ? (
        <img className="avatar-img" src={imageUrl} alt={name} />
      ) : (
        <div className="avatar-initials">{getInitials(name)}</div>
      )}
      {isOnline && <span className="avatar-online-dot" />}
    </div>
  );
}
