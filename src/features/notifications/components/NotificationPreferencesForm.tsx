/**
 * Formulaire de préférences de notifications
 */

import { useState } from 'react';
import { Save, Loader2, Bell, Mail, Smartphone, MessageSquare } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Input } from '@/shared/components/ui/input';
import { Separator } from '@/shared/components/ui/separator';
import type { NotificationPreferences } from '../types/notification.types';

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences;
  onSave: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  isLoading?: boolean;
}

export const NotificationPreferencesForm = ({
  preferences,
  onSave,
  isLoading = false,
}: NotificationPreferencesFormProps) => {
  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPrefs(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleTimeChange = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localPrefs);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canaux de notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canaux de notification
          </CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez recevoir vos notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Notifications dans l'application</Label>
                <p className="text-sm text-gray-500">Affichées dans le centre de notifications</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.enableInApp}
              onCheckedChange={() => handleToggle('enableInApp')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Notifications push</Label>
                <p className="text-sm text-gray-500">
                  Notifications sur votre navigateur ou appareil
                </p>
              </div>
            </div>
            <Switch
              checked={localPrefs.enablePush}
              onCheckedChange={() => handleToggle('enablePush')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Notifications par email</Label>
                <p className="text-sm text-gray-500">
                  Recevoir un email pour les notifications importantes
                </p>
              </div>
            </div>
            <Switch
              checked={localPrefs.enableEmail}
              onCheckedChange={() => handleToggle('enableEmail')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Notifications SMS</Label>
                <p className="text-sm text-gray-500">Recevoir un SMS pour les urgences</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.enableSMS}
              onCheckedChange={() => handleToggle('enableSMS')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Types de notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Types de notifications</CardTitle>
          <CardDescription>
            Sélectionnez les types de notifications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                key: 'interventionCreated',
                label: 'Nouvelle intervention',
                desc: 'Quand une intervention est créée',
              },
              {
                key: 'interventionAssigned',
                label: 'Assignation',
                desc: 'Quand vous êtes assigné',
              },
              {
                key: 'interventionStatusChanged',
                label: 'Changement de statut',
                desc: 'Quand le statut change',
              },
              {
                key: 'interventionCompleted',
                label: 'Intervention terminée',
                desc: 'Quand une intervention est terminée',
              },
              {
                key: 'interventionComment',
                label: 'Commentaires',
                desc: 'Nouveau commentaire sur vos interventions',
              },
              { key: 'interventionOverdue', label: 'Retards', desc: 'Interventions en retard' },
              { key: 'interventionUrgent', label: 'Urgences', desc: 'Interventions urgentes' },
              { key: 'slaAtRisk', label: 'SLA à risque', desc: 'SLA bientôt dépassé' },
              { key: 'slaBreached', label: 'SLA dépassé', desc: 'SLA non respecté' },
              { key: 'messageReceived', label: 'Messages', desc: 'Nouveaux messages reçus' },
              { key: 'mention', label: 'Mentions', desc: 'Quand vous êtes mentionné' },
              { key: 'roomBlocked', label: 'Chambres bloquées', desc: 'Statut des chambres' },
              { key: 'system', label: 'Système', desc: 'Notifications système importantes' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label className="font-medium">{label}</Label>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <Switch
                  checked={localPrefs[key as keyof NotificationPreferences] as boolean}
                  onCheckedChange={() => handleToggle(key as keyof NotificationPreferences)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heures de silence */}
      <Card>
        <CardHeader>
          <CardTitle>Heures de silence</CardTitle>
          <CardDescription>
            Définissez une période pendant laquelle vous ne souhaitez pas être dérangé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activer les heures de silence</Label>
            <Switch
              checked={localPrefs.quietHoursEnabled}
              onCheckedChange={() => handleToggle('quietHoursEnabled')}
            />
          </div>

          {localPrefs.quietHoursEnabled && (
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div>
                <Label>Début</Label>
                <Input
                  type="time"
                  value={localPrefs.quietHoursStart || '22:00'}
                  onChange={e => handleTimeChange('quietHoursStart', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Fin</Label>
                <Input
                  type="time"
                  value={localPrefs.quietHoursEnd || '08:00'}
                  onChange={e => handleTimeChange('quietHoursEnd', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regroupement */}
      <Card>
        <CardHeader>
          <CardTitle>Options avancées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Regrouper les notifications similaires</Label>
              <p className="text-sm text-gray-500">
                Combine les notifications du même type pour réduire le bruit
              </p>
            </div>
            <Switch
              checked={localPrefs.groupSimilar}
              onCheckedChange={() => handleToggle('groupSimilar')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les préférences
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
