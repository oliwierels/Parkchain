import PropTypes from 'prop-types';

/**
 * Skeleton loading components
 * Used to show loading states with shimmer animation
 */
const Skeleton = ({ className = '', variant = 'rect', width, height, circle = false }) => {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%]';

  const shapeStyles = circle
    ? 'rounded-full'
    : variant === 'text'
    ? 'rounded h-4'
    : 'rounded-lg';

  const customStyles = {
    width: width || (circle ? height : '100%'),
    height: height || (variant === 'text' ? '1rem' : '100%'),
  };

  return (
    <div
      className={`${baseStyles} ${shapeStyles} ${className}`}
      style={customStyles}
    />
  );
};

Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['rect', 'text', 'circle']),
  width: PropTypes.string,
  height: PropTypes.string,
  circle: PropTypes.bool,
};

// Pre-built skeleton layouts
export const SkeletonCard = () => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
    <Skeleton height="24px" width="60%" />
    <Skeleton variant="text" />
    <Skeleton variant="text" />
    <Skeleton variant="text" width="80%" />
    <div className="flex gap-2 pt-4">
      <Skeleton height="40px" width="100px" />
      <Skeleton height="40px" width="100px" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
        <Skeleton circle height="48px" width="48px" />
        <div className="flex-1 space-y-2">
          <Skeleton height="20px" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

SkeletonList.propTypes = {
  count: PropTypes.number,
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
    <div className="p-4 border-b border-slate-700 flex gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height="20px" width={`${100 / columns}%`} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="p-4 border-b border-slate-700/50 flex gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} />
        ))}
      </div>
    ))}
  </div>
);

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};

export const SkeletonProfile = () => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
    <div className="flex items-center gap-4 mb-6">
      <Skeleton circle height="80px" width="80px" />
      <div className="flex-1 space-y-2">
        <Skeleton height="24px" width="200px" />
        <Skeleton variant="text" width="150px" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton variant="text" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="90%" />
    </div>
  </div>
);

export default Skeleton;
