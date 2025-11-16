/**
 * Feature Guard Component
 *
 * Composant pour protéger une route en fonction d'une feature activée/désactivée
 */

import type { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useFeature } from '@/features/establishments/hooks/useFeature';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { AlertTriangle, Lock, ArrowLeft } from 'lucide-react';
import type { EstablishmentFeatures } from '@/shared/types/establishment.types';

interface FeatureGuardProps {
  children: ReactNode;
  feature: keyof EstablishmentFeatures;
  redirectTo?: string; // URL de redirection si feature désactivée
  fallback?: ReactNode; // Composant de fallback personnalisé
  showMessage?: boolean; // Afficher un message d'erreur (défaut: true)
}

/**
 * Guard pour protéger une route selon une feature
 *
 * @example
 * <FeatureGuard feature="planning">
 *   <PlanningPage />
 * </FeatureGuard>
 */
export const FeatureGuard = ({
  children,
  feature,
  redirectTo = '/app/dashboard',
  fallback,
  showMessage = true,
}: FeatureGuardProps) => {
  const { hasFeature } = useFeature();
  const { currentEstablishment } = useEstablishmentStore();

  const isEnabled = hasFeature(feature);
  const hasEstablishment = !!currentEstablishment;
  const featureExists = currentEstablishment?.features?.[feature] !== undefined;

  // Si la feature est activée, afficher le contenu
  if (isEnabled) {
    return <>{children}</>;
  }

  // Si un fallback custom est fourni, l'utiliser
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si on ne veut pas afficher de message, rediriger directement
  if (!showMessage) {
    return <Navigate to={redirectTo} replace />;
  }

  // Afficher un message d'erreur informatif
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle>Fonctionnalité désactivée</CardTitle>
              <CardDescription>
                Cette fonctionnalité n'est pas disponible pour cet établissement
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Message d'information */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {hasEstablishment ? (
                <>
                  La fonctionnalité <strong>{feature}</strong> n'est pas activée pour cet
                  établissement. Contactez un administrateur pour l'activer.
                </>
              ) : (
                <>
                  Aucun établissement sélectionné. Veuillez sélectionner un établissement pour
                  continuer.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Informations de debug (en dev uniquement) */}
          {import.meta.env.DEV && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-900">
              <p className="font-mono text-gray-600 dark:text-gray-400">
                <strong>Debug Info:</strong>
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-gray-500">
                <li>Feature: {feature}</li>
                <li>Enabled: {isEnabled ? 'Yes' : 'No'}</li>
                <li>Has Establishment: {hasEstablishment ? 'Yes' : 'No'}</li>
                <li>Feature Exists: {featureExists ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>

          {hasEstablishment && (
            <Button asChild>
              <Link to="/app/settings/features">Gérer les fonctionnalités</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

/**
 * Version HOC du FeatureGuard
 *
 * @example
 * const ProtectedPlanning = withFeatureGuard(PlanningPage, 'planning');
 */
export const withFeatureGuard = (
  Component: React.ComponentType,
  feature: keyof EstablishmentFeatures,
  options?: Omit<FeatureGuardProps, 'children' | 'feature'>
) => {
  return (props: any) => (
    <FeatureGuard feature={feature} {...options}>
      <Component {...props} />
    </FeatureGuard>
  );
};
