import React, { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'fade';

/**
 * Props for the ScrollReveal component.
 */
interface ScrollRevealProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

const animationStyles: Record<AnimationType, { hidden: string; visible: string }> = {
  'fade-up': {
    hidden: 'opacity-0 translate-y-10',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    hidden: 'opacity-0 -translate-y-10',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    hidden: 'opacity-0 translate-x-10',
    visible: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    hidden: 'opacity-0 -translate-x-10',
    visible: 'opacity-100 translate-x-0',
  },
  'scale': {
    hidden: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
  },
  'fade': {
    hidden: 'opacity-0',
    visible: 'opacity-100',
  },
};

/**
 * Component that animates its children when they scroll into view.
 * Supports various animation types like fade-up, scale, etc.
 * 
 * @param {ScrollRevealProps} props - Component props.
 * @returns {JSX.Element} The animated wrapper.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className,
  threshold = 0.1,
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold });
  const styles = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        isVisible ? styles.visible : styles.hidden,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      {children}
    </div>
  );
};

// Staggered children animation wrapper
/**
 * Props for the StaggeredReveal component.
 */
interface StaggeredRevealProps {
  children: ReactNode[];
  animation?: AnimationType;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  childClassName?: string;
}

/**
 * Component that animates a list of children with a staggered delay.
 * Useful for lists or grids of items.
 * 
 * @param {StaggeredRevealProps} props - Component props.
 * @returns {JSX.Element} The staggered animation wrapper.
 */
export const StaggeredReveal: React.FC<StaggeredRevealProps> = ({
  children,
  animation = 'fade-up',
  staggerDelay = 100,
  duration = 600,
  className,
  childClassName,
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const styles = animationStyles[animation];

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={cn(
            'transition-all',
            isVisible ? styles.visible : styles.hidden,
            childClassName
          )}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: `${index * staggerDelay}ms`,
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
