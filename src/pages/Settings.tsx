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

export default SettingsPage;
