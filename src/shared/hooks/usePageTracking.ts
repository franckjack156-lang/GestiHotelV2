/**
 * ============================================================================
 * USE PAGE TRACKING HOOK
 * ============================================================================
 *
 * Hook pour tracker automatiquement les vues de page avec Google Analytics
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/core/config/analytics';

/**
 * Hook pour tracker automatiquement les page views
 * À utiliser dans le composant App ou dans chaque route
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view sur chaque changement de route
    trackPageView(location.pathname + location.search);
  }, [location]);
};
