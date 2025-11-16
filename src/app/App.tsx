/**
 * App Component
 *
 * Composant racine de l'application avec routing et providers
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.lazy'; // Lazy loading enabled for better performance
import { offlineSyncManager } from '@/core/services/offlineSync';
import { PWAInstallPrompt, PWAUpdatePrompt } from '@/shared/components/pwa';
import ErrorBoundary from '@/shared/components/error/ErrorBoundary';

export const App = () => {
  // Initialiser le gestionnaire de synchronisation offline
  useEffect(() => {
    // Démarrer la synchronisation automatique (toutes les 30 secondes)
    offlineSyncManager.startAutoSync();

    return () => {
      offlineSyncManager.stopAutoSync();
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <RouterProvider router={router} />

        {/* PWA Components */}
        <PWAInstallPrompt />
        <PWAUpdatePrompt />
      </div>
    </ErrorBoundary>
  );
};
