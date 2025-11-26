/**
 * Page de diagnostic pour débugger les problèmes de chargement
 */

import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '@/core/utils/logger';

export const DiagnosticPage = () => {
  const { user } = useAuth();
  const { currentEstablishment } = useEstablishmentStore();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({
    auth: null,
    establishment: null,
    interventions: null,
    features: null,
  });

  const runDiagnostic = async () => {
    setLoading(true);
    const newResults: any = {
      auth: null,
      establishment: null,
      interventions: null,
      features: null,
    };

    try {
      // 1. Vérifier l'authentification
      newResults.auth = {
        status: !!user,
        userId: user?.id,
        email: user?.email,
        displayName: user?.displayName,
      };

      // 2. Vérifier l'établissement
      newResults.establishment = {
        status: !!currentEstablishment,
        id: currentEstablishment?.id,
        name: currentEstablishment?.name,
      };

      // 3. Vérifier les features
      if (currentEstablishment) {
        newResults.features = {
          interventions: currentEstablishment.features?.interventions?.enabled || false,
          rooms: currentEstablishment.features?.rooms?.enabled || false,
          planning: currentEstablishment.features?.interventionPlanning?.enabled || false,
          notifications: currentEstablishment.features?.pushNotifications?.enabled || false,
          messaging: currentEstablishment.features?.internalChat?.enabled || false,
        };
      }

      // 4. Vérifier les interventions dans Firestore
      try {
        if (!currentEstablishment?.id) {
          newResults.interventions = {
            status: false,
            error: 'Aucun établissement sélectionné',
          };
        } else {
          const interventionsRef = collection(
            db,
            'establishments',
            currentEstablishment.id,
            'interventions'
          );
          const q = query(interventionsRef, limit(5));
          const snapshot = await getDocs(q);

          newResults.interventions = {
            status: true,
            count: snapshot.size,
            docs: snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })),
          };
        }
      } catch (error: any) {
        newResults.interventions = {
          status: false,
          error: error.message,
          code: error.code,
        };
      }
    } catch (error: any) {
      logger.error('Diagnostic error:', error);
    }

    setResults(newResults);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, [user, currentEstablishment]);

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diagnostic Système</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vérification de la configuration et des données
          </p>
        </div>
        <Button onClick={runDiagnostic} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Authentification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={results.auth?.status} />
            Authentification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.auth ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Connecté:</span>
                <span className="font-medium">{results.auth.status ? 'Oui' : 'Non'}</span>
              </div>
              {results.auth.status && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-mono text-xs">{results.auth.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span>{results.auth.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span>{results.auth.displayName || 'Non défini'}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-gray-500">Chargement...</p>
          )}
        </CardContent>
      </Card>

      {/* Établissement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={results.establishment?.status} />
            Établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.establishment ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Sélectionné:</span>
                <span className="font-medium">{results.establishment.status ? 'Oui' : 'Non'}</span>
              </div>
              {results.establishment.status && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-xs">{results.establishment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span>{results.establishment.name}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-gray-500">Chargement...</p>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      {results.features && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Fonctionnalités activées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(results.features).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{key}:</span>
                <div className="flex items-center gap-2">
                  <StatusIcon status={value as boolean} />
                  <span className="font-medium">{value ? 'Activée' : 'Désactivée'}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interventions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={results.interventions?.status} />
            Interventions Firestore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.interventions ? (
            results.interventions.status ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre trouvées:</span>
                  <span className="font-medium">{results.interventions.count}</span>
                </div>
                {results.interventions.count > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Interventions disponibles:
                    </p>
                    {results.interventions.docs.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{doc.title || 'Sans titre'}</p>
                            <p className="text-xs text-gray-500 font-mono">{doc.id}</p>
                          </div>
                          <Button size="sm" asChild>
                            <a href={`/app/interventions/${doc.id}`}>Voir</a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {results.interventions.count === 0 && (
                  <div className="mt-4 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-4 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      <strong>Aucune intervention trouvée!</strong>
                      <br />
                      Votre base de données Firestore est vide. Créez votre première intervention
                      pour tester.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Erreur:</span>
                  <span className="font-medium text-red-600">{results.interventions.error}</span>
                </div>
                {results.interventions.code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Code:</span>
                    <span className="font-mono text-xs">{results.interventions.code}</span>
                  </div>
                )}
                <div className="mt-4 rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Problème de connexion Firestore!</strong>
                    <br />
                    Vérifiez les règles de sécurité Firestore et votre configuration Firebase.
                  </p>
                </div>
              </div>
            )
          ) : (
            <p className="text-gray-500">Chargement...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
