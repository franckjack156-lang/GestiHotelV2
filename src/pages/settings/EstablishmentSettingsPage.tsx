/**
 * ============================================================================
 * ESTABLISHMENT SETTINGS PAGE
 * ============================================================================
 *
 * Page de configuration des paramètres d'établissement
 * Accessible aux admins et super admins
 */

import { useState, useEffect } from 'react';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import {
  Building2,
  Save,
  Loader2,
  Mail,
  Globe,
  Package,
  AlertCircle,
  Info,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Separator } from '@/shared/components/ui/separator';
import type { EstablishmentSettings } from '@/shared/types/establishment.types';

export const EstablishmentSettingsPage = () => {
  const { hasRole } = useAuth();
  const { currentEstablishment, updateEstablishment } = useEstablishments();
  const [settings, setSettings] = useState<EstablishmentSettings | null>(
    currentEstablishment?.settings ?? null
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Vérifier si l'utilisateur est Admin ou Super Admin
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  // Sync settings when establishment changes
  useEffect(() => {
    if (currentEstablishment?.settings) {
      setSettings(currentEstablishment.settings);
      setHasChanges(false);
    }
  }, [currentEstablishment]);

  /**
   * Update a setting value
   */
  const updateSetting = <K extends keyof EstablishmentSettings>(
    key: K,
    value: EstablishmentSettings[K]
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [key]: value,
    });
    setHasChanges(true);
  };

  /**
   * Save settings
   */
  const handleSave = async () => {
    if (!currentEstablishment || !settings) return;

    setSaving(true);
    try {
      await updateEstablishment(currentEstablishment.id, { settings });
      toast.success('Paramètres enregistrés avec succès');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error('Erreur lors de la sauvegarde', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancel changes
   */
  const handleCancel = () => {
    setSettings(currentEstablishment?.settings ?? null);
    setHasChanges(false);
  };

  // Guard: Admin only
  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. Seuls les
            administrateurs peuvent modifier les paramètres de l'établissement.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Guard: No establishment selected
  if (!currentEstablishment) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez sélectionner un établissement pour gérer ses paramètres.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Paramètres de l'établissement
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{currentEstablishment.name}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {hasChanges && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ces paramètres s'appliquent à l'ensemble de l'établissement et affectent tous les
          utilisateurs.
        </AlertDescription>
      </Alert>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuration Email
          </CardTitle>
          <CardDescription>
            Adresses email pour les notifications et communications automatiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email de notification
            </Label>
            <Input
              id="notificationEmail"
              type="email"
              placeholder="notifications@hotel.com"
              value={settings.notificationEmail || ''}
              onChange={e => updateSetting('notificationEmail', e.target.value)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adresse email pour recevoir les notifications générales de l'application
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="orderEmail" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Email pour les commandes de pièces
            </Label>
            <Input
              id="orderEmail"
              type="email"
              placeholder="achats@hotel.com"
              value={settings.orderEmail || ''}
              onChange={e => updateSetting('orderEmail', e.target.value)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adresse email du service achats ou du responsable des commandes. Les demandes de
              commande de pièces seront envoyées à cette adresse.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localisation
          </CardTitle>
          <CardDescription>Langue, fuseau horaire et formats régionaux</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Langue par défaut</Label>
              <Select
                value={settings.defaultLanguage}
                onValueChange={value => updateSetting('defaultLanguage', value as 'fr' | 'en')}
              >
                <SelectTrigger id="defaultLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select
                value={settings.timezone}
                onValueChange={value => updateSetting('timezone', value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">America/New York (GMT-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los Angeles (GMT-8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Format de date</Label>
              <Input
                id="dateFormat"
                value={settings.dateFormat}
                onChange={e => updateSetting('dateFormat', e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat">Format d'heure</Label>
              <Select
                value={settings.timeFormat}
                onValueChange={value => updateSetting('timeFormat', value as '12h' | '24h')}
              >
                <SelectTrigger id="timeFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="12h">12 heures (AM/PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Select
              value={settings.currency}
              onValueChange={value => updateSetting('currency', value)}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CHF">CHF (Fr)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Intervention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Numérotation des interventions
          </CardTitle>
          <CardDescription>Personnalisez le format des numéros d'intervention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interventionPrefix">Préfixe</Label>
              <Input
                id="interventionPrefix"
                value={settings.interventionPrefix}
                onChange={e => updateSetting('interventionPrefix', e.target.value.toUpperCase())}
                placeholder="INT"
                maxLength={10}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">Exemple : INT-2024-001</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interventionStartNumber">Numéro de départ</Label>
              <Input
                id="interventionStartNumber"
                type="number"
                min="1"
                value={settings.interventionStartNumber}
                onChange={e =>
                  updateSetting('interventionStartNumber', parseInt(e.target.value) || 1)
                }
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Numéro à partir duquel commencer
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
