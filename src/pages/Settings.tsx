/**
 * ============================================================================
 * SETTINGS PAGE - MODERN UI/UX
 * ============================================================================
 *
 * Page de paramètres avec sections :
 * - Profil utilisateur
 * - Notifications
 * - Sécurité
 * - Préférences
 * - Utilisateurs
 * - Établissements
 * - Listes de référence
 * - À propos
 *
 * Design moderne inspiré de Vercel, Linear et Stripe
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Info,
  Save,
  Eye,
  EyeOff,
  List,
  Users,
  Building2,
  Plus,
  Edit,
  Monitor,
  Moon,
  Sun,
  Globe,
  Calendar,
  Clock,
  Layout,
  RotateCcw,
  Palette,
  Type,
  Sidebar as SidebarIcon,
  Mail,
  Phone,
  Briefcase,
  Building,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  MessageSquare,
  FileText,
  ChevronRight,
  Lock,
  UserCircle,
  CheckCircle,
  Target,
  Smartphone,
} from 'lucide-react';
import { ReferenceListsOrchestrator } from '@/features/settings/components/ReferenceListsOrchestrator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { toast } from 'sonner';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { useUserPreferences } from '@/features/users/hooks/useUserPreferences';
import { cn } from '@/shared/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header moderne */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Paramètres
            </h1>
          </div>
        </div>
        <p className="text-lg text-muted-foreground ml-14">
          Personnalisez votre expérience et gérez vos préférences
        </p>
      </div>

      {/* Tabs modernes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="sticky top-0 z-10 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-xl border-b">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
            >
              <User size={16} />
              <span className="font-medium">Profil</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
            >
              <Bell size={16} />
              <span className="font-medium">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
            >
              <Shield size={16} />
              <span className="font-medium">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
            >
              <Palette size={16} />
              <span className="font-medium">Préférences</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
              >
                <Users size={16} />
                <span className="font-medium">Utilisateurs</span>
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger
                value="establishments"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
              >
                <Building2 size={16} />
                <span className="font-medium">Établissements</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger
                value="reference-lists"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
              >
                <List size={16} />
                <span className="font-medium">Listes</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="about"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 gap-2"
            >
              <Info size={16} />
              <span className="font-medium">À propos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profil */}
        <TabsContent value="profile" className="space-y-6 mt-0">
          <ProfileSection user={user} />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 mt-0">
          <NotificationsSection />
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security" className="space-y-6 mt-0">
          <SecuritySection />
        </TabsContent>

        {/* Préférences */}
        <TabsContent value="preferences" className="space-y-6 mt-0">
          <PreferencesSection />
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-6 mt-0">
          {isAdmin ? (
            <UsersManagementSection />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Accès réservé aux administrateurs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Établissements */}
        <TabsContent value="establishments" className="space-y-6 mt-0">
          {isSuperAdmin ? (
            <EstablishmentsManagementSection />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Accès réservé aux super administrateurs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Listes de référence */}
        <TabsContent value="reference-lists" className="space-y-6 mt-0">
          {isAdmin ? (
            <ReferenceListsOrchestrator />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Accès réservé aux administrateurs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* À propos */}
        <TabsContent value="about" className="space-y-6 mt-0">
          <AboutSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============================================================================
// SECTION PROFIL
// ============================================================================

const ProfileSection = ({ user }: any) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      displayName: user?.displayName || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      jobTitle: user?.jobTitle || '',
      department: user?.department || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = form;

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      // TODO: Implement profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profil mis à jour avec succès', {
        description: 'Vos informations ont été enregistrées',
      });
      setHasChanges(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour', {
        description: 'Veuillez réessayer',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl">Informations personnelles</CardTitle>
            </div>
            <CardDescription className="text-base">
              Gérez vos informations de profil et vos coordonnées
            </CardDescription>
          </div>
          {isDirty && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Modifications non enregistrées
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Informations principales */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Informations principales
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <Label htmlFor="displayName" className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Nom d'affichage
                </Label>
                <Input
                  {...register('displayName')}
                  placeholder="Comment souhaitez-vous être appelé ?"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-muted-foreground">
                  Visible par tous les utilisateurs
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5 text-gray-500" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    value={user?.email}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  Prénom
                </Label>
                <Input
                  {...register('firstName')}
                  placeholder="Votre prénom"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Nom
                </Label>
                <Input
                  {...register('lastName')}
                  placeholder="Votre nom"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées professionnelles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Coordonnées professionnelles
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-3.5 w-3.5 text-green-500" />
                  Téléphone
                </Label>
                <Input
                  {...register('phoneNumber')}
                  placeholder="+33 6 12 34 56 78"
                  className="transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                  Poste
                </Label>
                <Input
                  {...register('jobTitle')}
                  placeholder="Votre fonction"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="department" className="flex items-center gap-2 text-sm font-medium">
                  <Building className="h-3.5 w-3.5 text-orange-500" />
                  Département
                </Label>
                <Input
                  {...register('department')}
                  placeholder="Votre département ou service"
                  className="transition-all duration-200 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Les modifications seront visibles immédiatement
            </p>
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
              size="lg"
              className="relative overflow-hidden group min-w-[160px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2 transition-transform group-hover:scale-110" />
                  Enregistrer
                  {isDirty && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {Object.keys(form.formState.dirtyFields).length}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SECTION NOTIFICATIONS
// ============================================================================

const NotificationsSection = () => {
  const { notificationPreferences, updateNotificationPreferences, isSaving } = useUserPreferences();

  const NotificationOption = ({
    icon: Icon,
    label,
    description,
    checked,
    onChange,
    accentColor,
  }: any) => (
    <div className="group flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
      <div className="flex items-start gap-3 flex-1">
        <div className={cn(
          "p-2 rounded-lg transition-colors duration-200",
          checked ? accentColor : "bg-muted"
        )}>
          <Icon className={cn(
            "h-4 w-4 transition-colors duration-200",
            checked ? "text-white" : "text-muted-foreground"
          )} />
        </div>
        <div className="space-y-0.5">
          <p className="font-medium text-sm">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
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

// ============================================================================
// SECTION SÉCURITÉ
// ============================================================================

const SecuritySection = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<SecurityFormData>();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = form;

  const newPassword = watch('newPassword');

  // Calculer la force du mot de passe
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  // Mettre à jour la force du mot de passe
  useState(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword || ''));
  });

  const onSubmit = async (data: SecurityFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas', {
        description: 'Veuillez vérifier la confirmation',
      });
      return;
    }

    if (calculatePasswordStrength(data.newPassword) < 3) {
      toast.error('Mot de passe trop faible', {
        description: 'Utilisez au moins 8 caractères avec majuscules, minuscules et chiffres',
      });
      return;
    }

    setIsUpdating(true);
    try {
      // TODO: Implement password update
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Mot de passe modifié avec succès', {
        description: 'Votre nouveau mot de passe est maintenant actif',
      });
      reset();
    } catch (error) {
      toast.error('Erreur lors de la modification', {
        description: 'Veuillez réessayer',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'Faible';
    if (passwordStrength <= 3) return 'Moyen';
    return 'Fort';
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Sécurité</CardTitle>
            </div>
          </div>
          <CardDescription className="text-base">
            Gérez votre mot de passe et protégez votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Info security */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Conseils pour un mot de passe sécurisé
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Au moins 8 caractères (12 recommandés)</li>
                  <li>• Mélangez majuscules, minuscules, chiffres et symboles</li>
                  <li>• Évitez les informations personnelles</li>
                  <li>• N'utilisez pas le même mot de passe ailleurs</li>
                </ul>
              </div>
            </div>

            {/* Mot de passe actuel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Changer le mot de passe
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  Mot de passe actuel
                </Label>
                <div className="relative">
                  <Input
                    {...register('currentPassword', { required: true })}
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Entrez votre mot de passe actuel"
                    className={cn(
                      "pr-10 transition-all duration-200",
                      errors.currentPassword && "border-red-500 focus:ring-red-500/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Ce champ est requis
                  </p>
                )}
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    {...register('newPassword', { required: true, minLength: 8 })}
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Entrez votre nouveau mot de passe"
                    className={cn(
                      "pr-10 transition-all duration-200",
                      errors.newPassword && "border-red-500 focus:ring-red-500/20"
                    )}
                    onChange={(e) => setPasswordStrength(calculatePasswordStrength(e.target.value))}
                  />
                </div>
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Force du mot de passe</span>
                      <span className={cn(
                        "font-medium",
                        passwordStrength <= 1 && "text-red-500",
                        passwordStrength > 1 && passwordStrength <= 3 && "text-orange-500",
                        passwordStrength > 3 && "text-green-500"
                      )}>
                        {getStrengthLabel()}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 rounded-full transition-all duration-300",
                            i < passwordStrength ? getStrengthColor() : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {errors.newPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.newPassword.type === 'minLength'
                      ? 'Minimum 8 caractères'
                      : 'Ce champ est requis'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    {...register('confirmPassword', { required: true })}
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Confirmez votre nouveau mot de passe"
                    className={cn(
                      "pr-10 transition-all duration-200",
                      errors.confirmPassword && "border-red-500 focus:ring-red-500/20"
                    )}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Ce champ est requis
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => reset()}
                disabled={isUpdating || !isDirty}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || !isDirty}
                size="lg"
                className="relative overflow-hidden group min-w-[180px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Shield size={16} className="mr-2 transition-transform group-hover:scale-110" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// SECTION PRÉFÉRENCES
// ============================================================================

const PreferencesSection = () => {
  const {
    displayPreferences,
    updateDisplayPreferences,
    resetToDefaults,
    isSaving,
  } = useUserPreferences();

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updateDisplayPreferences({ theme });

    // Appliquer immédiatement le thème
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const ThemeOption = ({ value, icon: Icon, label, description }: any) => (
    <button
      onClick={() => handleThemeChange(value)}
      className={cn(
        "group relative p-4 border-2 rounded-xl transition-all duration-300 hover:scale-105",
        displayPreferences.theme === value
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 shadow-md"
          : "border-border hover:border-blue-300 dark:hover:border-blue-700"
      )}
    >
      <Icon className={cn(
        "mx-auto mb-2 transition-colors duration-200",
        displayPreferences.theme === value ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
      )} size={24} />
      <div className="text-sm font-semibold mb-1">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
      {displayPreferences.theme === value && (
        <div className="absolute -top-2 -right-2 p-1 bg-blue-600 rounded-full shadow-lg">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );

  const ColorOption = ({ value, color, name }: any) => (
    <button
      onClick={() => updateDisplayPreferences({ themeColor: value })}
      className={cn(
        "group relative p-2.5 border-2 rounded-xl transition-all duration-300 hover:scale-105",
        displayPreferences.themeColor === value
          ? "border-foreground shadow-md"
          : "border-border hover:border-muted-foreground"
      )}
    >
      <div className={cn("w-full h-8 rounded-lg", color)} />
      {displayPreferences.themeColor === value && (
        <div className="absolute -top-2 -right-2 p-1 bg-foreground rounded-full shadow-lg">
          <Check className="h-3 w-3 text-background" />
        </div>
      )}
    </button>
  );

  const DensityOption = ({ value, label, description, preview }: any) => (
    <button
      onClick={() => updateDisplayPreferences({ density: value })}
      className={cn(
        "group relative p-4 border-2 rounded-xl transition-all duration-300 hover:scale-105",
        displayPreferences.density === value
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 shadow-md"
          : "border-border hover:border-blue-300 dark:hover:border-blue-700"
      )}
    >
      <div className="mb-2">{preview}</div>
      <div className="text-sm font-semibold mb-1">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
      {displayPreferences.density === value && (
        <div className="absolute -top-2 -right-2 p-1 bg-blue-600 rounded-full shadow-lg">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header avec bouton Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Préférences d'affichage
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personnalisez votre expérience utilisateur
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          disabled={isSaving}
          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
        >
          <RotateCcw size={16} className="mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Preview Card - Now at top */}
      <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50/50 to-violet-50/50 dark:from-blue-950/10 dark:to-violet-950/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Aperçu des préférences</CardTitle>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Enregistrement...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Thème', value: displayPreferences.theme, icon: Monitor },
              { label: 'Couleur', value: displayPreferences.themeColor || 'blue', icon: Palette },
              { label: 'Densité', value: displayPreferences.density, icon: Type },
              { label: 'Langue', value: displayPreferences.language, icon: Globe },
              { label: 'Format date', value: displayPreferences.dateFormat, icon: Calendar },
              { label: 'Format heure', value: displayPreferences.timeFormat, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-2.5 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-xs font-semibold capitalize truncate">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Sections */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <Accordion type="multiple" defaultValue={["apparence", "interface", "localisation"]} className="space-y-4">
            {/* Section 1: Apparence */}
            <AccordionItem value="apparence" className="border rounded-xl px-4 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/10 dark:to-purple-950/10">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                    <Palette className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Apparence</h3>
                    <p className="text-xs text-muted-foreground">Thème, couleurs et densité</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Thème */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Mode d'affichage</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <ThemeOption value="light" icon={Sun} label="Clair" description="Lumineux" />
                    <ThemeOption value="dark" icon={Moon} label="Sombre" description="Sombre" />
                    <ThemeOption value="auto" icon={Monitor} label="Auto" description="Système" />
                  </div>
                </div>

                {/* Couleur d'accent */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Couleur d'accent</h4>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { value: 'blue', color: 'bg-gradient-to-br from-blue-500 to-blue-600', name: 'Bleu' },
                      { value: 'green', color: 'bg-gradient-to-br from-green-500 to-emerald-600', name: 'Vert' },
                      { value: 'purple', color: 'bg-gradient-to-br from-purple-500 to-violet-600', name: 'Violet' },
                      { value: 'orange', color: 'bg-gradient-to-br from-orange-500 to-amber-600', name: 'Orange' },
                      { value: 'red', color: 'bg-gradient-to-br from-red-500 to-rose-600', name: 'Rouge' },
                      { value: 'pink', color: 'bg-gradient-to-br from-pink-500 to-rose-600', name: 'Rose' },
                    ].map((color) => (
                      <ColorOption key={color.value} value={color.value} color={color.color} name={color.name} />
                    ))}
                  </div>
                </div>

                {/* Densité */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Densité de l'interface</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <DensityOption
                      value="compact"
                      label="Compacte"
                      description="Maximise l'espace"
                      preview={
                        <div className="flex flex-col gap-0.5">
                          <div className="h-1 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1 bg-muted-foreground/40 rounded w-full" />
                        </div>
                      }
                    />
                    <DensityOption
                      value="comfortable"
                      label="Confortable"
                      description="Recommandé"
                      preview={
                        <div className="flex flex-col gap-1.5">
                          <div className="h-1.5 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1.5 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1.5 bg-muted-foreground/40 rounded w-full" />
                        </div>
                      }
                    />
                    <DensityOption
                      value="spacious"
                      label="Espacé"
                      description="Plus d'espace"
                      preview={
                        <div className="flex flex-col gap-2.5">
                          <div className="h-2 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-2 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-2 bg-muted-foreground/40 rounded w-full" />
                        </div>
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Interface */}
            <AccordionItem value="interface" className="border rounded-xl px-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/10 dark:to-amber-950/10">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-sm">
                    <Layout className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Interface</h3>
                    <p className="text-xs text-muted-foreground">Menu, vue et affichage</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Sidebar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SidebarIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Menu latéral</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-sm mb-1">Menu réduit par défaut</p>
                        <p className="text-xs text-muted-foreground">
                          Mode icônes uniquement au démarrage
                        </p>
                      </div>
                      <Switch
                        checked={displayPreferences.sidebarCollapsed}
                        onCheckedChange={checked =>
                          updateDisplayPreferences({ sidebarCollapsed: checked })
                        }
                        disabled={isSaving}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-violet-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Vue par défaut */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Vue par défaut</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'list', label: 'Liste', icon: List },
                      { value: 'grid', label: 'Grille', icon: Layout },
                      { value: 'calendar', label: 'Calendrier', icon: Calendar }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => updateDisplayPreferences({ defaultView: value as any })}
                        className={cn(
                          "p-3 border-2 rounded-xl transition-all duration-300 hover:scale-105",
                          displayPreferences.defaultView === value
                            ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 shadow-md"
                            : "border-border hover:border-orange-300 dark:hover:border-orange-700"
                        )}
                      >
                        <Icon className={cn(
                          "mx-auto mb-1",
                          displayPreferences.defaultView === value ? "text-orange-600" : "text-muted-foreground"
                        )} size={20} />
                        <div className="text-xs font-semibold">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items par page */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Éléments par page</h4>
                  </div>
                  <select
                    id="itemsPerPage"
                    value={displayPreferences.itemsPerPage}
                    onChange={e =>
                      updateDisplayPreferences({ itemsPerPage: parseInt(e.target.value) })
                    }
                    className="w-full p-2.5 border-2 rounded-xl bg-background hover:border-orange-300 dark:hover:border-orange-700 transition-colors focus:ring-2 focus:ring-orange-500/20 text-sm"
                  >
                    <option value="10">10 éléments</option>
                    <option value="20">20 éléments</option>
                    <option value="50">50 éléments</option>
                    <option value="100">100 éléments</option>
                  </select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Localisation */}
            <AccordionItem value="localisation" className="border rounded-xl px-4 bg-gradient-to-br from-cyan-50/30 to-blue-50/30 dark:from-cyan-950/10 dark:to-blue-950/10">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Localisation</h3>
                    <p className="text-xs text-muted-foreground">Langue, date et heure</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Langue */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Langue de l'interface</h4>
                  </div>
                  <select
                    id="language"
                    value={displayPreferences.language}
                    onChange={e => updateDisplayPreferences({ language: e.target.value })}
                    className="w-full p-2.5 border-2 rounded-xl bg-background hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors focus:ring-2 focus:ring-cyan-500/20 text-sm"
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="de">🇩🇪 Deutsch</option>
                  </select>
                </div>

                {/* Format de date */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Format de date</h4>
                  </div>
                  <select
                    id="dateFormat"
                    value={displayPreferences.dateFormat}
                    onChange={e => updateDisplayPreferences({ dateFormat: e.target.value })}
                    className="w-full p-2.5 border-2 rounded-xl bg-background hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors focus:ring-2 focus:ring-cyan-500/20 text-sm"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (31 Déc 2024)</option>
                  </select>
                </div>

                {/* Format d'heure */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Format d'heure</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateDisplayPreferences({ timeFormat: '12h' })}
                      className={cn(
                        "p-3 border-2 rounded-xl transition-all duration-300 hover:scale-105 relative",
                        displayPreferences.timeFormat === '12h'
                          ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 shadow-md"
                          : "border-border hover:border-cyan-300 dark:hover:border-cyan-700"
                      )}
                    >
                      <div className="font-semibold text-sm">12 heures</div>
                      <div className="text-xs text-muted-foreground mt-1">2:30 PM</div>
                      {displayPreferences.timeFormat === '12h' && (
                        <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-cyan-600" />
                      )}
                    </button>
                    <button
                      onClick={() => updateDisplayPreferences({ timeFormat: '24h' })}
                      className={cn(
                        "p-3 border-2 rounded-xl transition-all duration-300 hover:scale-105 relative",
                        displayPreferences.timeFormat === '24h'
                          ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 shadow-md"
                          : "border-border hover:border-cyan-300 dark:hover:border-cyan-700"
                      )}
                    >
                      <div className="font-semibold text-sm">24 heures</div>
                      <div className="text-xs text-muted-foreground mt-1">14:30</div>
                      {displayPreferences.timeFormat === '24h' && (
                        <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-cyan-600" />
                      )}
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Debug info - Optional, collapsible */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              Informations de débogage
            </summary>
            <div className="mt-3 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-auto max-h-64">
              <pre>{JSON.stringify(displayPreferences, null, 2)}</pre>
              <hr className="my-3 border-gray-700" />
              <div className="space-y-1">
                <div>HTML Classes: {document.documentElement.className}</div>
                <div>HTML Lang: {document.documentElement.lang}</div>
                <div>--primary: {getComputedStyle(document.documentElement).getPropertyValue('--primary')}</div>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// SECTION À PROPOS
// ============================================================================

const AboutSection = () => {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 shadow-sm">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">À propos</CardTitle>
          </div>
        </div>
        <CardDescription className="text-base">
          Informations sur l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo et version */}
        <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              GestiHôtel v2
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                Version 2.0.0
              </span>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                Stable
              </span>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">Date de sortie</h4>
            </div>
            <p className="text-sm text-muted-foreground">Janvier 2024</p>
          </div>

          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold">Licence</h4>
            </div>
            <p className="text-sm text-muted-foreground">Propriétaire</p>
          </div>

          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold">Développeur</h4>
            </div>
            <p className="text-sm text-muted-foreground">GestiHôtel Team</p>
          </div>

          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-cyan-600" />
              <h4 className="font-semibold">Langue</h4>
            </div>
            <p className="text-sm text-muted-foreground">Multi-langue (FR, EN, ES, DE)</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 GestiHôtel. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Plateforme de gestion hôtelière complète
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SECTION UTILISATEURS
// ============================================================================

const UsersManagementSection = () => {
  const navigate = useNavigate();
  const { users, isLoading } = useUsers();

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl">Gestion des utilisateurs</CardTitle>
            </div>
            <CardDescription className="text-base">
              Gérez les membres de votre équipe et leurs permissions
            </CardDescription>
          </div>
          <Button
            onClick={() => navigate('/app/users')}
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
          >
            <Users size={16} className="mr-2" />
            Voir tous
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
            <p className="text-muted-foreground">Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-purple-50 dark:bg-purple-950/20 mb-4">
              <Users className="h-12 w-12 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun utilisateur</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Commencez par créer votre premier utilisateur pour collaborer avec votre équipe
            </p>
            <Button
              onClick={() => navigate('/app/users/create')}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
            >
              <Plus size={18} className="mr-2" />
              Créer un utilisateur
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</span>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{users.length}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">utilisateurs</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Actifs</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {users.filter((u: any) => u.status === 'active').length}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">en ligne</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactifs</span>
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {users.filter((u: any) => u.status === 'inactive').length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">hors ligne</p>
              </div>
            </div>

            {/* Liste d'utilisateurs */}
            <div className="space-y-3">
              {users.slice(0, 5).map((user: any) => (
                <div
                  key={user.id}
                  className="group p-4 border-2 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 cursor-pointer transition-all duration-200"
                  onClick={() => navigate(`/app/users/${user.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
                          <span className="text-base font-semibold text-white">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        {user.status === 'active' && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {user.firstName} {user.lastName}
                          {user.role === 'super_admin' && (
                            <Shield className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 text-xs font-medium rounded-full",
                        user.role === 'admin' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
                        user.role === 'super_admin' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                        !['admin', 'super_admin'].includes(user.role) && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      )}>
                        {user.role}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {users.length > 5 && (
              <Button
                variant="outline"
                onClick={() => navigate('/app/users')}
                className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700"
              >
                Voir tous les {users.length} utilisateurs
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SECTION ÉTABLISSEMENTS
// ============================================================================

const EstablishmentsManagementSection = () => {
  const navigate = useNavigate();
  const { establishments, isLoading } = useEstablishments();

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl">Gestion des établissements</CardTitle>
            </div>
            <CardDescription className="text-base">
              Gérez vos propriétés et leurs configurations
            </CardDescription>
          </div>
          <Button
            onClick={() => navigate('/app/establishments')}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            <Building2 size={16} className="mr-2" />
            Voir tous
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
            <p className="text-muted-foreground">Chargement des établissements...</p>
          </div>
        ) : establishments.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/20 mb-4">
              <Building2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun établissement</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Créez votre premier établissement pour commencer à gérer vos propriétés
            </p>
            <Button
              onClick={() => navigate('/app/establishments/create')}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              <Plus size={18} className="mr-2" />
              Créer un établissement
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Établissements</span>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{establishments.length}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">propriétés gérées</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Chambres totales</span>
                  <Layout className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {establishments.reduce((sum: number, e: any) => sum + (e.totalRooms || 0), 0)}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">chambres disponibles</p>
              </div>
            </div>

            {/* Liste d'établissements */}
            <div className="space-y-3">
              {establishments.map((establishment: any) => (
                <div
                  key={establishment.id}
                  className="group p-4 border-2 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 cursor-pointer transition-all duration-200"
                  onClick={() => navigate(`/app/establishments/${establishment.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                        <Building2 size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg mb-1">{establishment.name}</div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" />
                            {establishment.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {establishment.city}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            <Layout className="h-3.5 w-3.5" />
                            {establishment.totalRooms} chambres
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/establishments/${establishment.id}/edit`);
                        }}
                        className="hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
                      >
                        <Edit size={16} className="mr-1" />
                        Modifier
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {establishments.length > 5 && (
              <Button
                variant="outline"
                onClick={() => navigate('/app/establishments')}
                className="w-full hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700"
              >
                Voir tous les établissements
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default SettingsPage;
