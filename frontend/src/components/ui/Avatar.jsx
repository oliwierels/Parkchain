import PropTypes from 'prop-types';

/**
 * Avatar component for user profile pictures
 */
const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'md',
  fallback,
  status,
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizes[size]} rounded-full object-cover border-2 border-slate-700`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-parkchain-500 to-parkchain-600 flex items-center justify-center text-white font-semibold border-2 border-slate-700`}
        >
          {getInitials(fallback || alt)}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full border-2 border-slate-900 ${statusColors[status]}`}
        />
      )}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl']),
  fallback: PropTypes.string,
  status: PropTypes.oneOf(['online', 'offline', 'busy', 'away']),
  className: PropTypes.string,
};

export default Avatar;
