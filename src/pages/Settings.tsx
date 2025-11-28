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
 *
 * NOTE: Les sections ont été refactorisées dans des composants séparés
 * pour améliorer la maintenabilité. Voir src/pages/settings/sections/
 */

import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Info,
  List,
  Users,
  Building2,
  Palette,
  Lock,
} from 'lucide-react';
import { ReferenceListsOrchestrator } from '@/features/settings/components/ReferenceListsOrchestrator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

// Import des sections refactorisées
import {
  ProfileSection,
  NotificationsSection,
  SecuritySection,
  PreferencesSection,
  AboutSection,
  UsersManagementSection,
  EstablishmentsManagementSection,
} from './settings/sections';

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
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-12">
      {/* Header moderne - Responsive optimisé */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-md sm:shadow-lg shadow-blue-500/20 flex-shrink-0">
            <SettingsIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent truncate">
              Paramètres
            </h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground ml-8 sm:ml-14">
          <span className="hidden sm:inline">
            Personnalisez votre expérience et gérez vos préférences
          </span>
          <span className="sm:hidden">Gérez vos préférences</span>
        </p>
      </div>

      {/* Tabs modernes - Responsive avec scrolling horizontal optimisé */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 sm:py-3 bg-background/95 backdrop-blur-xl border-b">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max sm:w-auto h-auto p-0.5 sm:p-1 bg-muted/50 rounded-lg sm:rounded-xl gap-0.5 sm:gap-1">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
              >
                <User size={16} className="sm:w-4 sm:h-4" />
                <span className="font-medium text-xs sm:text-sm">Profil</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
              >
                <Bell size={16} className="sm:w-4 sm:h-4" />
                <span className="font-medium text-xs sm:text-sm hidden xs:inline">
                  Notifications
                </span>
                <span className="font-medium text-xs xs:hidden">Notifs</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
              >
                <Shield size={16} className="sm:w-4 sm:h-4" />
                <span className="font-medium text-xs sm:text-sm">Sécurité</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
              >
                <Palette size={16} className="sm:w-4 sm:h-4" />
                <span className="font-medium text-xs sm:text-sm hidden xs:inline">Préférences</span>
                <span className="font-medium text-xs xs:hidden">Préfs</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
                >
                  <Users size={16} className="sm:w-4 sm:h-4" />
                  <span className="font-medium text-xs sm:text-sm hidden xs:inline">
                    Utilisateurs
                  </span>
                  <span className="font-medium text-xs xs:hidden">Users</span>
                </TabsTrigger>
              )}
              {isSuperAdmin && (
                <TabsTrigger
                  value="establishments"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
                >
                  <Building2 size={16} className="sm:w-4 sm:h-4" />
                  <span className="font-medium text-xs sm:text-sm hidden xs:inline">
                    Établissements
                  </span>
                  <span className="font-medium text-xs xs:hidden">Étabs</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger
                  value="reference-lists"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
                >
                  <List size={16} className="sm:w-4 sm:h-4" />
                  <span className="font-medium text-xs sm:text-sm">Listes</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="about"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md sm:rounded-lg px-2 sm:px-4 py-1.5 sm:py-2.5 gap-1 sm:gap-2 whitespace-nowrap"
              >
                <Info size={16} className="sm:w-4 sm:h-4" />
                <span className="font-medium text-xs sm:text-sm">À propos</span>
              </TabsTrigger>
            </TabsList>
          </div>
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

export default SettingsPage;
