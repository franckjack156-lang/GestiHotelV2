/**
 * AppRouter Component
 *
 * Wrapper pour le RouterProvider avec page tracking
 */

import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { trackPageView } from '@/core/config/analytics';

/**
 * Composant qui wrap toutes les routes pour tracker les pages
 */
export const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view sur chaque changement de route
    trackPageView(location.pathname + location.search);
  }, [location]);

  return <Outlet />;
};
