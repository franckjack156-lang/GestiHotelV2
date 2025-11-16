/**
 * ============================================================================
 * SLIDE IN ANIMATION
 * ============================================================================
 *
 * Composant pour animer l'entrée en slide
 */

import { motion, type HTMLMotionProps } from 'framer-motion';

interface SlideInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  from?: 'left' | 'right' | 'top' | 'bottom';
}

export const SlideIn = ({
  children,
  delay = 0,
  duration = 0.3,
  from = 'right',
  ...props
}: SlideInProps) => {
  const getInitialPosition = () => {
    switch (from) {
      case 'left':
        return { x: '-100%' };
      case 'right':
        return { x: '100%' };
      case 'top':
        return { y: '-100%' };
      case 'bottom':
        return { y: '100%' };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0 }}
      exit={getInitialPosition()}
      transition={{
        duration,
        delay,
        ease: 'easeInOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default SlideIn;
