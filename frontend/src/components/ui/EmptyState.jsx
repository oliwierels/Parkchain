import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import Button from './Button';

/**
 * Empty state component for when there's no data to display
 * Provides helpful messaging and optional actions
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 text-slate-500">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-slate-400 max-w-md mb-6">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button onClick={action} variant="primary">
              {actionLabel || 'Get Started'}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction} variant="outline">
              {secondaryActionLabel || 'Learn More'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.func,
  actionLabel: PropTypes.string,
  secondaryAction: PropTypes.func,
  secondaryActionLabel: PropTypes.string,
  className: PropTypes.string,
};

// Pre-built empty state variants
export const EmptyStateNoResults = ({ searchTerm, onClear }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    }
    title="No results found"
    description={searchTerm ? `No results for "${searchTerm}". Try adjusting your search.` : 'Try adjusting your filters to find what you\'re looking for.'}
    action={onClear}
    actionLabel="Clear filters"
  />
);

EmptyStateNoResults.propTypes = {
  searchTerm: PropTypes.string,
  onClear: PropTypes.func,
};

export const EmptyStateNoReservations = ({ onCreateNew }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    }
    title="No reservations yet"
    description="You haven't made any parking reservations yet. Start by finding a parking spot on the map."
    action={onCreateNew}
    actionLabel="Find Parking"
  />
);

EmptyStateNoReservations.propTypes = {
  onCreateNew: PropTypes.func,
};

export const EmptyStateNoParkingSpots = ({ onAddNew }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    }
    title="No parking spots"
    description="You haven't added any parking spots yet. Add your first parking spot to start earning."
    action={onAddNew}
    actionLabel="Add Parking Spot"
  />
);

EmptyStateNoParkingSpots.propTypes = {
  onAddNew: PropTypes.func,
};

export const EmptyStateNoBadges = () => (
  <EmptyState
    icon={
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    }
    title="No badges yet"
    description="Complete charging sessions and milestones to unlock NFT badges. Your achievements will appear here."
  />
);

export const EmptyStateError = ({ onRetry }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    }
    title="Something went wrong"
    description="We couldn't load this data. Please try again."
    action={onRetry}
    actionLabel="Try Again"
  />
);

EmptyStateError.propTypes = {
  onRetry: PropTypes.func,
};

export default EmptyState;
