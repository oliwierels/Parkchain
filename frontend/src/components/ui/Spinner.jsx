import PropTypes from 'prop-types';

/**
 * Loading spinner component
 */
const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const colors = {
    primary: 'border-parkchain-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    slate: 'border-slate-400 border-t-transparent',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full ${sizes[size]} ${colors[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'white', 'slate']),
  className: PropTypes.string,
};

// Full-page loading overlay
export const LoadingOverlay = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-slate-900 rounded-xl p-8 flex flex-col items-center gap-4 border border-slate-700">
      <Spinner size="xl" />
      <p className="text-white text-lg font-medium">{message}</p>
    </div>
  </div>
);

LoadingOverlay.propTypes = {
  message: PropTypes.string,
};

export default Spinner;
