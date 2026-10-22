import React, { useState } from 'react';

// Generates consistent initials from user's full name
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Generates a deterministic, tasteful cinema dark background gradient based on name
const getGradient = (name = '') => {
  const gradients = [
    'linear-gradient(135deg, #e50914 0%, #8b0000 100%)', // Crimson
    'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', // Indigo
    'linear-gradient(135deg, #059669 0%, #064e3b 100%)', // Emerald
    'linear-gradient(135deg, #d97706 0%, #78350f 100%)', // Amber
    'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', // Violet
    'linear-gradient(135deg, #db2777 0%, #831843 100%)', // Pink
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const UserAvatar = ({ user, size = 38, className = '', showBorder = true, style = {} }) => {
  const [imgError, setImgError] = useState(false);

  const name = user?.name || 'User';
  const initials = getInitials(name);
  const avatarSrc = user?.avatar;

  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    ...style,
  };

  const borderClass = showBorder ? 'border border-danger' : '';

  if (avatarSrc && !imgError) {
    return (
      <img
        src={avatarSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={`rounded-circle object-fit-cover shadow-sm ${borderClass} ${className}`}
        style={dimensionStyle}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${name}'s avatar`}
      className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-bold user-select-none shadow-sm ${borderClass} ${className}`}
      style={{
        ...dimensionStyle,
        background: getGradient(name),
        color: '#ffffff',
        fontSize: `${Math.max(11, Math.round(size * 0.4))}px`,
        letterSpacing: '0.5px',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
