/**
 * Establishment Features Page
 *
 * Page de gestion des fonctionnalités activées/désactivées par établissement
 * Accessible uniquement aux Super Admins
 */

import { useState, useMemo } from 'react';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import {
  Building2,
  Check,
  X,
  AlertCircle,
  Loader2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Separator } from '@/shared/components/ui/separator';
import {
  FEATURES_CATALOG,
  type FeatureMetadata,
  type EstablishmentFeatures,
} from '@/shared/types/establishment.types';

export const EstablishmentFeaturesPage = () => {
  const { hasRole } = useAuth();
  const { currentEstablishment, updateEstablishment } = useEstablishmentStore();
  const [features, setFeatures] = useState<EstablishmentFeatures | null>(
    currentEstablishment?.features ?? null
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Vérifier si l'utilisateur est Super Admin
  const isSuperAdmin = hasRole('SUPER_ADMIN');

  // Grouper les features par catégorie
  const groupedFeatures = useMemo(() => {
    const groups: Record<string, FeatureMetadata[]> = {
      core: [],
      communication: [],
      data: [],
      advanced: [],
    };

    FEATURES_CATALOG.forEach(feature => {
      groups[feature.category].push(feature);
    });

    return groups;
  }, []);

  // Labels des catégories
  const categoryLabels: Record<string, { label: string; description: string }> = {
    core: {
      label: 'Fonctionnalités principales',
      description: 'Modules essentiels de l\'application',
    },
    communication: {
      label: 'Communication',
      description: 'Messagerie et notifications',
    },
    data: {
      label: 'Gestion des données',
      description: 'Export, tags et fichiers',
    },
    advanced: {
      label: 'Fonctionnalités avancées',
      description: 'Modules optionnels et fonctionnalités premium',
    },
  };

  /**
   * Toggle une feature
   */
  const toggleFeature = (featureKey: keyof EstablishmentFeatures) => {
    if (!features) return;

    const newFeatures = {
      ...features,
      [featureKey]: {
        ...features[featureKey],
        enabled: !features[featureKey].enabled,
      },
    };

    // Vérifier les dépendances
    const feature = FEATURES_CATALOG.find(f => f.key === featureKey);
    if (feature?.dependsOn && !newFeatures[featureKey].enabled) {
      // On désactive une feature, vérifier si d'autres en dépendent
      const dependentFeatures = FEATURES_CATALOG.filter(f =>
        f.dependsOn?.includes(featureKey)
      );

      if (dependentFeatures.length > 0) {
        const activeDependent = dependentFeatures.find(f => newFeatures[f.key].enabled);
        if (activeDependent) {
          toast.error(
            `Impossible de désactiver ${feature.label}`,
            {
              description: `La fonctionnalité "${activeDependent.label}" en dépend. Désactivez-la d'abord.`,
            }
          );
          return;
        }
      }
    }

    setFeatures(newFeatures);
    setHasChanges(true);
  };

  /**
   * Sauvegarder les changements
   */
  const handleSave = async () => {
    if (!currentEstablishment || !features) return;

    setSaving(true);
    try {
      await updateEstablishment(currentEstablishment.id, { features });
      toast.success('Fonctionnalités mises à jour avec succès');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error updating features:', error);
      toast.error('Erreur lors de la mise à jour', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Annuler les changements
   */
  const handleCancel = () => {
    setFeatures(currentEstablishment?.features ?? null);
    setHasChanges(false);
  };

  /**
   * Vérifier si une feature peut être désactivée
   */
  const canDisableFeature = (featureKey: keyof EstablishmentFeatures): boolean => {
    const dependentFeatures = FEATURES_CATALOG.filter(f =>
      f.dependsOn?.includes(featureKey) && features?.[f.key].enabled
    );
    return dependentFeatures.length === 0;
  };

  /**
   * Obtenir le composant icône
   */
  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon size={20} /> : <AlertCircle size={20} />;
  };

  // Guard: Super Admin only
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les Super Admins peuvent gérer les fonctionnalités.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Guard: Pas d'établissement sélectionné
  if (!currentEstablishment) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez sélectionner un établissement pour gérer ses fonctionnalités.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestion des fonctionnalités
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentEstablishment.name}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Activer ou désactiver les fonctionnalités disponibles pour cet établissement.
          Les utilisateurs ne verront que les modules activés dans leur interface.
        </AlertDescription>
      </Alert>

      {/* Features par catégorie */}
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{categoryLabels[category].label}</CardTitle>
            <CardDescription>
              {categoryLabels[category].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryFeatures.map((feature, index) => {
              const isEnabled = features?.[feature.key]?.enabled ?? false;
              const canDisable = canDisableFeature(feature.key);

              return (
                <div key={feature.key}>
                  {index > 0 && <Separator className="my-4" />}

                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isEnabled
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                        }`}
                      >
                        {getIcon(feature.icon)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={feature.key}
                            className="text-base font-medium cursor-pointer"
                          >
                            {feature.label}
                          </Label>

                          {/* Badges */}
                          {feature.requiresConfig && (
                            <Badge variant="outline" className="text-xs">
                              Configuration requise
                            </Badge>
                          )}
                          {feature.dependsOn && feature.dependsOn.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Dépend de: {feature.dependsOn.join(', ')}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>

                        {/* Warning si ne peut pas désactiver */}
                        {isEnabled && !canDisable && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            D'autres fonctionnalités dépendent de celle-ci
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Switch */}
                    <div className="flex items-center gap-2">
                      {isEnabled ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <Switch
                        id={feature.key}
                        checked={isEnabled}
                        onCheckedChange={() => toggleFeature(feature.key)}
                        disabled={saving || (isEnabled && !canDisable)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Warning Changes */}
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous avez des modifications non enregistrées. N'oubliez pas de sauvegarder vos changements.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
