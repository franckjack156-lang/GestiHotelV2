/**
 * ============================================================================
 * NOTIFICATIONS SECTION - Settings Page
 * ============================================================================
 *
 * Section for managing notification preferences:
 * - Email notifications
 * - Push notifications
 * - In-app notifications
 *
 * Extracted from Settings.tsx
 */

import { useUserPreferences } from '@/features/users/hooks/useUserPreferences';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/lib/utils';
import {
  Bell,
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Smartphone,
  Target,
  Volume2,
  Zap,
  Monitor,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { User } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationOptionProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentColor: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const NotificationsSection = () => {
  const { notificationPreferences, updateNotificationPreferences, isSaving } = useUserPreferences();

  const NotificationOption = ({
    icon: Icon,
    label,
    description,
    checked,
    onChange,
    accentColor,
  }: NotificationOptionProps) => (
    <div className="group flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
      <div className="flex items-start gap-3 flex-1">
        <div
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            checked ? accentColor : 'bg-muted'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 transition-colors duration-200',
              checked ? 'text-white' : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="space-y-0.5">
          <p className="font-medium text-sm">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={isSaving}
        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-violet-600"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 shadow-sm">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Notifications par email</CardTitle>
            </div>
          </div>
          <CardDescription className="text-base">
            Configurez les notifications que vous souhaitez recevoir par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master toggle */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-base">Activer les notifications email</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recevoir des notifications par email pour rester informé
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPreferences.email.enabled}
                onCheckedChange={checked =>
                  updateNotificationPreferences({
                    email: { ...notificationPreferences.email, enabled: checked },
                  })
                }
                disabled={isSaving}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-violet-600"
              />
            </div>
          </div>

          {/* Email options */}
          {notificationPreferences.email.enabled && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <NotificationOption
                icon={Zap}
                label="Nouvelles interventions"
                description="Être notifié lors de la création d'une intervention"
                checked={notificationPreferences.email.interventions}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    email: { ...notificationPreferences.email, interventions: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-orange-500 to-red-600"
              />

              <NotificationOption
                icon={User}
                label="Interventions assignées"
                description="Recevoir un email quand une intervention vous est assignée"
                checked={notificationPreferences.email.assignments}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    email: { ...notificationPreferences.email, assignments: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-blue-500 to-cyan-600"
              />

              <NotificationOption
                icon={CheckCircle}
                label="Changements de statut"
                description="Suivre l'évolution des interventions"
                checked={notificationPreferences.email.statusChanges}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    email: { ...notificationPreferences.email, statusChanges: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-green-500 to-emerald-600"
              />

              <NotificationOption
                icon={MessageSquare}
                label="Nouveaux messages"
                description="Ne manquez aucune communication importante"
                checked={notificationPreferences.email.messages}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    email: { ...notificationPreferences.email, messages: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-purple-500 to-pink-600"
              />

              <NotificationOption
                icon={FileText}
                label="Rapports"
                description="Recevoir les rapports d'activité"
                checked={notificationPreferences.email.reports}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    email: { ...notificationPreferences.email, reports: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-gray-500 to-slate-600"
              />

              <NotificationOption
                icon={Calendar}
                label="Résumé quotidien"
                description="Un récapitulatif de votre journée chaque matin"
                checked={notificationPreferences.email.dailyDigest || false}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    email: { ...notificationPreferences.email, dailyDigest: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-indigo-500 to-blue-600"
              />
            </div>
          )}

          {!notificationPreferences.email.enabled && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Les notifications email sont désactivées</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Notifications push</CardTitle>
            </div>
          </div>
          <CardDescription className="text-base">
            Recevez des notifications en temps réel sur votre appareil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master toggle */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-100 dark:border-green-900">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-base">Activer les notifications push</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recevoir des alertes instantanées sur votre appareil
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPreferences.push.enabled}
                onCheckedChange={checked =>
                  updateNotificationPreferences({
                    push: { ...notificationPreferences.push, enabled: checked },
                  })
                }
                disabled={isSaving}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600"
              />
            </div>
          </div>

          {/* Push options */}
          {notificationPreferences.push.enabled && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <NotificationOption
                icon={Zap}
                label="Nouvelles interventions"
                description="Notifications instantanées pour les nouvelles demandes"
                checked={notificationPreferences.push.interventions}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    push: { ...notificationPreferences.push, interventions: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-orange-500 to-red-600"
              />

              <NotificationOption
                icon={Target}
                label="Interventions assignées"
                description="Alertes pour les tâches qui vous sont attribuées"
                checked={notificationPreferences.push.assignments}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    push: { ...notificationPreferences.push, assignments: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-blue-500 to-cyan-600"
              />

              <NotificationOption
                icon={CheckCircle}
                label="Changements de statut"
                description="Notifications lors des mises à jour d'interventions"
                checked={notificationPreferences.push.statusChanges}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    push: { ...notificationPreferences.push, statusChanges: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-green-500 to-emerald-600"
              />

              <NotificationOption
                icon={MessageSquare}
                label="Nouveaux messages"
                description="Alertes instantanées pour les nouveaux messages"
                checked={notificationPreferences.push.messages}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    push: { ...notificationPreferences.push, messages: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-purple-500 to-pink-600"
              />
            </div>
          )}

          {!notificationPreferences.push.enabled && (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Les notifications push sont désactivées</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Notifications dans l'application</CardTitle>
            </div>
          </div>
          <CardDescription className="text-base">
            Personnalisez l'affichage des notifications dans l'interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master toggle */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-100 dark:border-violet-900">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                  <Bell className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-base">Activer les notifications</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Afficher les notifications dans l'interface de l'application
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPreferences.inApp.enabled}
                onCheckedChange={checked =>
                  updateNotificationPreferences({
                    inApp: { ...notificationPreferences.inApp, enabled: checked },
                  })
                }
                disabled={isSaving}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-purple-600"
              />
            </div>
          </div>

          {/* In-app options */}
          {notificationPreferences.inApp.enabled && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <NotificationOption
                icon={Volume2}
                label="Son des notifications"
                description="Jouer un son lors de l'arrivée d'une notification"
                checked={notificationPreferences.inApp.sound}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    inApp: { ...notificationPreferences.inApp, sound: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-yellow-500 to-orange-600"
              />

              <NotificationOption
                icon={Monitor}
                label="Notifications bureau"
                description="Afficher les notifications sur le bureau de votre ordinateur"
                checked={notificationPreferences.inApp.desktop}
                onChange={(checked: boolean) =>
                  updateNotificationPreferences({
                    inApp: { ...notificationPreferences.inApp, desktop: checked },
                  })
                }
                accentColor="bg-gradient-to-br from-cyan-500 to-blue-600"
              />
            </div>
          )}

          {!notificationPreferences.inApp.enabled && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Les notifications in-app sont désactivées</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info badge */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Enregistrement des préférences...</span>
        </div>
      )}
    </div>
  );
};
