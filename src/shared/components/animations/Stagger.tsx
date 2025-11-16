/**
 * ============================================================================
 * STAGGER ANIMATION
 * ============================================================================
 *
 * Composant pour animer des enfants en cascade (stagger)
 * Utile pour les listes, grilles, etc.
 */

import { motion } from 'framer-motion';
import { Children, type ReactNode } from 'react';

interface StaggerProps {
  children: ReactNode;
  /**
   * Délai entre chaque enfant (en secondes)
   */
  staggerDelay?: number;

  /**
   * Délai initial avant le début (en secondes)
   */
  initialDelay?: number;

  /**
   * Durée de l'animation de chaque enfant
   */
  duration?: number;

  className?: string;
}

export const Stagger = ({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  duration = 0.5,
  className,
}: StaggerProps) => {
  const childrenArray = Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration,
            delay: initialDelay + index * staggerDelay,
            ease: 'easeOut',
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

export default Stagger;
