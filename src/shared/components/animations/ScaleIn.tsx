/**
 * ============================================================================
 * SCALE IN ANIMATION
 * ============================================================================
 *
 * Composant pour animer l'entrée avec scale (zoom)
 */

import { motion, type HTMLMotionProps } from 'framer-motion';

interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  initialScale?: number;
}

export const ScaleIn = ({
  children,
  delay = 0,
  duration = 0.3,
  initialScale = 0.8,
  ...props
}: ScaleInProps) => {
  return (
    <motion.div
      initial={{ scale: initialScale, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: initialScale, opacity: 0 }}
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

export default ScaleIn;
