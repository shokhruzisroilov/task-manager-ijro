import React, { useMemo } from 'react';
import './Avatar.css';

export interface AvatarProps {
  user: {
    name: string;
    email?: string;
    profilePhotoUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = React.memo(({
  user,
  size = 'md',
  className = ''
}) => {
  const getInitials = useMemo(() => (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) {
      const part = parts[0];
      return part ? part.substring(0, 2).toUpperCase() : '??';
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (!first || !last) return '??';
    const firstChar = first[0];
    const lastChar = last[0];
    return firstChar && lastChar ? (firstChar + lastChar).toUpperCase() : '??';
  }, []);

  const getColorFromName = useMemo(() => (name: string): string => {
    const colors = [
      '#0079bf', // blue
      '#d29034', // orange
      '#519839', // green
      '#b04632', // red
      '#89609e', // purple
      '#cd5a91', // pink
      '#4bbf6b', // lime
      '#00aecc', // cyan
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    const color = colors[index];
    return color !== undefined ? color : '#0079bf';
  }, []);

  const initials = useMemo(() => getInitials(user.name), [user.name, getInitials]);
  const backgroundColor = useMemo(() => getColorFromName(user.name), [user.name, getColorFromName]);

  const classes = [
    'avatar',
    `avatar--${size}`,
    className
  ].filter(Boolean).join(' ');

  // If user has profile photo, show it
  if (user.profilePhotoUrl) {
    return (
      <div
        className={classes}
        title={user.name}
        aria-label={`Avatar for ${user.name}`}
      >
        <img
          src={user.profilePhotoUrl}
          alt={user.name}
          className="avatar__image"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        <span className="avatar__initials avatar__initials--fallback">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={classes}
      style={{ backgroundColor }}
      title={user.name}
      aria-label={`Avatar for ${user.name}`}
    >
      <span className="avatar__initials">{initials}</span>
    </div>
  );
});
