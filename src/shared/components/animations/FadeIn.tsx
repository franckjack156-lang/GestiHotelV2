/**
 * ============================================================================
 * FADE IN ANIMATION
 * ============================================================================
 *
 * Composant pour animer l'entrée en fade in
 * - Configurable (delay, duration, direction)
 * - Réutilisable
 */

import { motion, type HTMLMotionProps } from 'framer-motion';

interface FadeInProps extends HTMLMotionProps<'div'> {
  /**
   * Délai avant l'animation (en secondes)
   */
  delay?: number;

  /**
   * Durée de l'animation (en secondes)
   */
  duration?: number;

  /**
   * Direction du fade in
   */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';

  /**
   * Distance du slide (en pixels)
   */
  distance?: number;
}

export const FadeIn = ({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 24,
  ...props
}: FadeInProps) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      case 'none':
      default:
        return {};
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...getInitialPosition(),
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
