import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Unified Card component for consistent layouts
 * Supports: default, hover, glass (glassmorphism)
 */
const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-200';

  const variants = {
    default: 'bg-slate-800 border border-slate-700',
    glass: 'bg-slate-900/40 backdrop-blur-xl border border-slate-700/50',
    gradient: 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const interactiveStyles = hoverable || clickable
    ? 'hover:shadow-xl hover:shadow-parkchain-500/10 hover:border-parkchain-500/50 hover:-translate-y-0.5'
    : '';

  const cursorStyle = clickable ? 'cursor-pointer' : '';

  const CardComponent = clickable || hoverable ? motion.div : 'div';

  const motionProps = clickable || hoverable
    ? {
        whileHover: { scale: 1.01 },
        whileTap: clickable ? { scale: 0.99 } : {},
      }
    : {};

  return (
    <CardComponent
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactiveStyles} ${cursorStyle} ${className}`}
      {...(clickable || hoverable ? motionProps : {})}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'glass', 'gradient']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  hoverable: PropTypes.bool,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

// Sub-components for common card sections
Card.Header = ({ children, className = '' }) => (
  <div className={`mb-4 pb-4 border-b border-slate-700 ${className}`}>
    {children}
  </div>
);

Card.Header.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.Title = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-white ${className}`}>
    {children}
  </h3>
);

Card.Title.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.Body = ({ children, className = '' }) => (
  <div className={`text-slate-300 ${className}`}>
    {children}
  </div>
);

Card.Body.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.Footer = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-slate-700 ${className}`}>
    {children}
  </div>
);

Card.Footer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Card;
