/**
 * Establishment Features Page
 *
 * Page de gestion des fonctionnalités activées/désactivées par établissement
 * Accessible uniquement aux Super Admins
 */

import { useState, useMemo, useEffect } from 'react';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import { updateEstablishment } from '@/features/establishments/services/establishmentService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { Building2, Check, X, AlertCircle, Loader2, Save, AlertTriangle, ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Separator } from '@/shared/components/ui/separator';
import {
  FEATURES_CATALOG,
  DEFAULT_ESTABLISHMENT_FEATURES,
  type FeatureMetadata,
  type EstablishmentFeatures,
} from '@/shared/types/establishment.types';

export const EstablishmentFeaturesPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { currentEstablishment, updateEstablishmentInList } = useEstablishmentStore();
  const [features, setFeatures] = useState<EstablishmentFeatures>(
    currentEstablishment?.features ?? DEFAULT_ESTABLISHMENT_FEATURES
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Vérifier si l'utilisateur est Super Admin
  const isSuperAdmin = hasRole('super_admin');

  // Mettre à jour les features si l'établissement change
  useEffect(() => {
    // Fusionner les features de l'établissement avec les valeurs par défaut
    // pour s'assurer que toutes les features existent
    const mergedFeatures = {
      ...DEFAULT_ESTABLISHMENT_FEATURES,
      ...(currentEstablishment?.features || {}),
    };

    // Forcer l'activation des fonctionnalités indispensables
    FEATURES_CATALOG.forEach(feature => {
      if (feature.isRequired) {
        mergedFeatures[feature.key] = { enabled: true };
      }
    });

    setFeatures(mergedFeatures);
    setHasChanges(false);
  }, [currentEstablishment?.id]);

  // Grouper les features par catégorie
  const groupedFeatures = useMemo(() => {
    const groups: Record<string, FeatureMetadata[]> = {};

    FEATURES_CATALOG.forEach(feature => {
      if (!groups[feature.category]) {
        groups[feature.category] = [];
      }
      groups[feature.category].push(feature);
    });

    return groups;
  }, []);

  // Labels et descriptions des catégories
  const categoryLabels: Record<string, { label: string; description: string }> = {
    core: {
      label: 'Fonctionnalités essentielles',
      description: "Ces fonctionnalités sont indispensables au fonctionnement de l'application",
    },
    interventions: {
      label: 'Interventions',
      description: 'Fonctionnalités avancées pour la gestion des interventions',
    },
    communication: {
      label: 'Communication',
      description: 'Messagerie, notifications et échanges',
    },
    media: {
      label: 'Médias',
      description: 'Photos, documents et signatures',
    },
    parts: {
      label: 'Pièces et stocks',
      description: 'Gestion des pièces détachées et inventaire',
    },
    time: {
      label: 'Temps et facturation',
      description: 'Suivi du temps, facturation et rapports financiers',
    },
    analytics: {
      label: 'Analytique',
      description: 'Tableaux de bord, rapports et statistiques',
    },
    rooms: {
      label: 'Chambres',
      description: 'Gestion des chambres et espaces',
    },
    integrations: {
      label: 'Intégrations',
      description: 'API, webhooks et connexions tierces',
    },
  };

  /**
   * Activer une fonctionnalité et toutes ses dépendances
   */
  const enableFeatureWithDependencies = (featureKey: keyof EstablishmentFeatures) => {
    const newFeatures = { ...features };

    // Activer récursivement toutes les dépendances
    const enableRecursive = (key: keyof EstablishmentFeatures) => {
      const feat = FEATURES_CATALOG.find(f => f.key === key);
      if (feat?.dependsOn) {
        feat.dependsOn.forEach(dep => enableRecursive(dep));
      }
      if (newFeatures[key]) {
        newFeatures[key] = { ...newFeatures[key], enabled: true };
      }
    };

    enableRecursive(featureKey);
    setFeatures(newFeatures);
    setHasChanges(true);

    toast.success('Fonctionnalité activée', {
      description: 'La fonctionnalité et ses dépendances ont été activées.',
    });
  };

  /**
   * Toggle une feature
   */
  const toggleFeature = (featureKey: keyof EstablishmentFeatures) => {
    const feature = FEATURES_CATALOG.find(f => f.key === featureKey);

    // Empêcher la désactivation des fonctionnalités indispensables
    if (feature?.isRequired && features[featureKey]?.enabled) {
      toast.error('Fonctionnalité indispensable', {
        description: 'Cette fonctionnalité est essentielle et ne peut pas être désactivée.',
      });
      return;
    }

    const isCurrentlyEnabled = features[featureKey]?.enabled ?? false;

    // Si on active la fonctionnalité, vérifier les dépendances
    if (!isCurrentlyEnabled && feature?.dependsOn) {
      const missingDeps = feature.dependsOn.filter(dep => !features[dep]?.enabled);
      if (missingDeps.length > 0) {
        const depLabels = missingDeps
          .map(dep => FEATURES_CATALOG.find(f => f.key === dep)?.label)
          .filter(Boolean)
          .join(', ');

        // Proposer d'activer automatiquement les dépendances
        toast.error('Dépendances manquantes', {
          description: `Cette fonctionnalité nécessite : ${depLabels}. Cliquez sur "Activer avec dépendances" pour tout activer.`,
          duration: 5000,
          action: {
            label: 'Activer avec dépendances',
            onClick: () => enableFeatureWithDependencies(featureKey),
          },
        });
        return;
      }
    }

    // Si on désactive la fonctionnalité, vérifier si d'autres en dépendent
    if (isCurrentlyEnabled) {
      const dependentFeatures = FEATURES_CATALOG.filter(
        f => f.dependsOn?.includes(featureKey) && features[f.key]?.enabled
      );

      if (dependentFeatures.length > 0) {
        const depLabels = dependentFeatures.map(f => f.label).join(', ');
        toast.error('Fonctionnalités dépendantes actives', {
          description: `Cette fonctionnalité est requise par : ${depLabels}. Désactivez-les d'abord.`,
        });
        return;
      }
    }

    const newFeatures = {
      ...features,
      [featureKey]: {
        ...features[featureKey],
        enabled: !isCurrentlyEnabled,
      },
    };

    setFeatures(newFeatures);
    setHasChanges(true);
  };

  /**
   * Sauvegarder les changements
   */
  const handleSave = async () => {
    if (!currentEstablishment) return;

    setSaving(true);
    try {
      // Mettre à jour dans Firestore
      await updateEstablishment(currentEstablishment.id, { features } as any);

      // Mettre à jour le store local
      updateEstablishmentInList(currentEstablishment.id, { features } as any);

      toast.success('Fonctionnalités mises à jour avec succès');
      setHasChanges(false);
    } catch (error: unknown) {
      console.error('Error updating features:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Erreur lors de la mise à jour', {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Annuler les changements
   */
  const handleCancel = () => {
    setFeatures(currentEstablishment?.features ?? DEFAULT_ESTABLISHMENT_FEATURES);
    setHasChanges(false);
  };

  /**
   * Vérifier si une feature peut être désactivée
   */
  const canDisableFeature = (featureKey: keyof EstablishmentFeatures): boolean => {
    const dependentFeatures = FEATURES_CATALOG.filter(
      f => f.dependsOn?.includes(featureKey) && features[f.key]?.enabled
    );
    return dependentFeatures.length === 0;
  };

  /**
   * Obtenir le composant icône
   */
  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[iconName];
    return Icon ? <Icon size={20} /> : <AlertCircle size={20} />;
  };

  // Guard: Super Admin only
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. Seuls les Super
            Admins peuvent gérer les fonctionnalités.
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
              <p className="text-gray-600 dark:text-gray-400">{currentEstablishment.name}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/app/settings')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/app/settings/establishment')}
            className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <Settings size={16} className="mr-2" />
            Paramètres
          </Button>
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
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
            </>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Activer ou désactiver les fonctionnalités disponibles pour cet établissement. Les
          utilisateurs ne verront que les modules activés dans leur interface.
        </AlertDescription>
      </Alert>

      {/* Features par catégorie */}
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{categoryLabels[category].label}</CardTitle>
            <CardDescription>{categoryLabels[category].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryFeatures.map((feature, index) => {
              const isEnabled = features[feature.key]?.enabled ?? false;
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label
                            htmlFor={feature.key}
                            className="text-base font-medium cursor-pointer"
                          >
                            {feature.label}
                          </Label>

                          {/* Badge indispensable */}
                          {feature.isRequired && (
                            <Badge variant="secondary" className="text-xs">
                              Indispensable
                            </Badge>
                          )}

                          {/* Badge statut */}
                          {feature.badge && (
                            <Badge
                              className={`text-xs ${
                                feature.badge === 'new'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : feature.badge === 'beta'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    : feature.badge === 'premium'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {feature.badge === 'new'
                                ? 'Nouveau'
                                : feature.badge === 'beta'
                                  ? 'Bêta'
                                  : feature.badge === 'premium'
                                    ? 'Premium'
                                    : 'Bientôt'}
                            </Badge>
                          )}

                          {/* Configuration requise */}
                          {feature.requiresConfig && (
                            <Badge variant="outline" className="text-xs">
                              Config. requise
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>

                        {/* Dépendances */}
                        {feature.dependsOn && feature.dependsOn.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Nécessite :{' '}
                            {feature.dependsOn
                              .map(dep => FEATURES_CATALOG.find(f => f.key === dep)?.label)
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}

                        {/* Warning si ne peut pas désactiver */}
                        {isEnabled && !canDisable && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            D'autres fonctionnalités dépendent de celle-ci
                          </p>
                        )}

                        {/* Warning si fonctionnalité indispensable */}
                        {feature.isRequired && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Cette fonctionnalité ne peut pas être désactivée
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
                        disabled={saving || (isEnabled && (!canDisable || feature.isRequired))}
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
            Vous avez des modifications non enregistrées. N'oubliez pas de sauvegarder vos
            changements.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
