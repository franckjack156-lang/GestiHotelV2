/**
 * Migration Tools Page
 *
 * Page pour exécuter les scripts de migration en production
 * Accessible uniquement aux Super Admins
 */

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  migrateEstablishmentFeatures,
  previewMigration,
} from '@/scripts/migrateEstablishmentFeatures';
import { toast } from 'sonner';
import {
  Database,
  Play,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';

export const MigrationToolsPage = () => {
  const { hasRole } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  // Guard: Super Admin only
  const isSuperAdmin = hasRole('super_admin');

  const handlePreview = async () => {
    setIsPreviewing(true);
    setMigrationResult(null);

    try {
      // Capturer les logs de la console
      const originalLog = console.log;
      let logs = '';

      console.log = (...args) => {
        logs += args.join(' ') + '\n';
        originalLog(...args);
      };

      await previewMigration();

      console.log = originalLog;

      toast.success('Prévisualisation terminée');
      setMigrationResult({ type: 'preview', logs });
    } catch (error: any) {
      toast.error('Erreur lors de la prévisualisation', {
        description: error.message,
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleMigrate = async () => {
    // Demander confirmation
    if (
      !window.confirm(
        '⚠️ ATTENTION: Cette action va modifier TOUS les établissements dans la base de données.\n\nÊtes-vous sûr de vouloir continuer ?'
      )
    ) {
      return;
    }

    setIsRunning(true);
    setMigrationResult(null);

    try {
      const result = await migrateEstablishmentFeatures();

      toast.success('Migration terminée', {
        description: `${result.updated} établissement(s) mis à jour`,
      });

      setMigrationResult({ type: 'migration', result });
    } catch (error: any) {
      toast.error('Erreur lors de la migration', {
        description: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. Seuls les Super
            Admins peuvent exécuter les migrations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
            <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Outils de Migration
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestion des scripts de migration de la base de données
            </p>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Attention :</strong> Ces outils modifient directement la base de données. Utilisez
          toujours la prévisualisation avant d'exécuter une migration.
        </AlertDescription>
      </Alert>

      {/* Migration des features */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Migration des Fonctionnalités
              </CardTitle>
              <CardDescription>
                Met à jour tous les établissements pour ajouter les fonctionnalités manquantes et
                force l'activation des fonctionnalités indispensables
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
            <h4 className="font-medium mb-2">Cette migration va :</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>
                  Ajouter toutes les fonctionnalités manquantes avec les valeurs par défaut
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>
                  Forcer l'activation des fonctionnalités indispensables (interventions,
                  interventionQuickCreate, history)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Conserver les valeurs existantes pour les autres fonctionnalités</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} disabled={isPreviewing || isRunning}>
              {isPreviewing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Prévisualisation...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Prévisualiser
                </>
              )}
            </Button>

            <Button onClick={handleMigrate} disabled={isRunning || isPreviewing}>
              {isRunning ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Migration en cours...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Exécuter la migration
                </>
              )}
            </Button>
          </div>

          {/* Résultats */}
          {migrationResult && (
            <>
              <Separator />

              {migrationResult.type === 'preview' && (
                <div>
                  <h4 className="font-medium mb-2">Prévisualisation</h4>
                  <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs overflow-auto max-h-96">
                    {migrationResult.logs}
                  </pre>
                </div>
              )}

              {migrationResult.type === 'migration' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Résultats de la migration</h4>

                  {/* Résumé */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold">{migrationResult.result.total}</p>
                    </div>
                    <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950">
                      <p className="text-sm text-green-600 dark:text-green-400">Mis à jour</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {migrationResult.result.updated}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Déjà à jour</p>
                      <p className="text-2xl font-bold">{migrationResult.result.skipped}</p>
                    </div>
                    <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950">
                      <p className="text-sm text-red-600 dark:text-red-400">Erreurs</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {migrationResult.result.errors}
                      </p>
                    </div>
                  </div>

                  {/* Détails */}
                  {migrationResult.result.details.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Détails</h5>
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {migrationResult.result.details.map((detail: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded border"
                          >
                            <div className="flex items-center gap-2">
                              {detail.status === 'updated' && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                              {detail.status === 'skipped' && (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                              {detail.status === 'error' && (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-medium">{detail.name}</span>
                            </div>
                            <Badge
                              variant={
                                detail.status === 'updated'
                                  ? 'default'
                                  : detail.status === 'error'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {detail.status === 'updated'
                                ? 'Mis à jour'
                                : detail.status === 'skipped'
                                  ? 'Déjà à jour'
                                  : 'Erreur'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
