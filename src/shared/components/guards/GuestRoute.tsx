/**
 * GuestRoute Component
 * 
 * Guard pour les routes accessibles uniquement aux utilisateurs non authentifiés
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface GuestRouteProps {
  children: React.ReactNode;
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers dashboard si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Afficher le contenu si non authentifié
  return <>{children}</>;
};
