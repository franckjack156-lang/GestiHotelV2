/* eslint-disable react-refresh/only-export-components */
/**
 * Router Configuration - VERSION OPTIMISÉE avec Lazy Loading
 *
 * Configuration des routes de l'application avec React Router
 * Utilise le lazy loading pour réduire le bundle initial
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { ProtectedRoute } from '@/shared/components/guards/ProtectedRoute';
import { GuestRoute } from '@/shared/components/guards/GuestRoute';
import { FeatureGuard } from '@/shared/components/guards/FeatureGuard';
import { Loader2 } from 'lucide-react';

// Composant de chargement
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
);

// Helper pour wrapper les composants lazy avec Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Auth Pages (chargées immédiatement car point d'entrée)
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { ResetPasswordPage } from '@/pages/ResetPassword';

// Dashboard (chargé immédiatement car première page après login)
import { DashboardPage } from '@/pages/Dashboard';

// TrashPage - Import direct pour éviter problèmes de lazy loading
import { TrashPage } from '@/pages/TrashPage';

// Lazy-loaded pages - Utilisation de named exports
const InterventionsPage = lazy(() =>
  import('@/pages/interventions/InterventionsPage').then(m => ({ default: m.InterventionsPage }))
);
const CreateInterventionPage = lazy(() =>
  import('@/pages/interventions/CreateInterventionPage').then(m => ({
    default: m.CreateInterventionPage,
  }))
);
const InterventionDetailsPage = lazy(() =>
  import('@/pages/interventions/InterventionDetailsPage').then(m => ({
    default: m.InterventionDetailsPage,
  }))
);
const EditInterventionPage = lazy(() =>
  import('@/pages/interventions/EditInterventionPage').then(m => ({
    default: m.EditInterventionPage,
  }))
);

const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then(m => ({ default: m.UsersPage }))
);
const CreateUserPage = lazy(() =>
  import('@/pages/users/CreateUserPage').then(m => ({ default: m.CreateUserPage }))
);
const UserDetailsPage = lazy(() =>
  import('@/pages/users/UserDetailsPage').then(m => ({ default: m.UserDetailsPage }))
);
const UserProfilePage = lazy(() =>
  import('@/pages/users/UserProfilePage').then(m => ({ default: m.UserProfilePage }))
);
const EditUserPage = lazy(() =>
  import('@/pages/users/EditUserPage').then(m => ({ default: m.EditUserPage }))
);

const RoomsListPage = lazy(() =>
  import('@/pages/rooms/RoomsPages').then(m => ({ default: m.RoomsListPage }))
);
const CreateRoomPage = lazy(() =>
  import('@/pages/rooms/RoomsPages').then(m => ({ default: m.CreateRoomPage }))
);
const RoomDetailPage = lazy(() =>
  import('@/pages/rooms/RoomDetailPage').then(m => ({ default: m.RoomDetailPage }))
);
const EditRoomPage = lazy(() =>
  import('@/pages/rooms/EditRoomPage').then(m => ({ default: m.EditRoomPage }))
);

const PlanningPage = lazy(() => import('@/pages/PlanningPage').then(m => ({ default: m.default })));
const NotificationCenterPage = lazy(() =>
  import('@/pages/NotificationCenterPage').then(m => ({ default: m.NotificationCenterPage }))
);
const MessagingPage = lazy(() =>
  import('@/pages/MessagingPage').then(m => ({ default: m.MessagingPage }))
);

const SettingsPage = lazy(() =>
  import('@/pages/Settings').then(m => ({ default: m.SettingsPage }))
);
const EstablishmentFeaturesPage = lazy(() =>
  import('@/pages/settings/EstablishmentFeaturesPage').then(m => ({
    default: m.EstablishmentFeaturesPage,
  }))
);
const EstablishmentSettingsPage = lazy(() =>
  import('@/pages/settings/EstablishmentSettingsPage').then(m => ({
    default: m.EstablishmentSettingsPage,
  }))
);
const MigrationToolsPage = lazy(() =>
  import('@/pages/settings/MigrationToolsPage').then(m => ({ default: m.MigrationToolsPage }))
);
const IntegrationsPage = lazy(() =>
  import('@/pages/settings/IntegrationsPage').then(m => ({ default: m.IntegrationsPage }))
);

const DiagnosticPage = lazy(() =>
  import('@/pages/DiagnosticPage').then(m => ({ default: m.DiagnosticPage }))
);
const DocumentationPage = lazy(() =>
  import('@/pages/DocumentationPage').then(m => ({ default: m.DocumentationPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFound').then(m => ({ default: m.NotFoundPage }))
);

/**
 * Configuration des routes
 */
export const router = createBrowserRouter([
  // ============================================================================
  // ROUTES PUBLIQUES (Authentification)
  // ============================================================================
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        ),
      },
    ],
  },

  // ============================================================================
  // ROUTES PROTÉGÉES (Application)
  // ============================================================================
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Redirection par défaut
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },

      // ----------------------------------------------------------------------------
      // DASHBOARD
      // ----------------------------------------------------------------------------
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },

      // ----------------------------------------------------------------------------
      // INTERVENTIONS
      // ----------------------------------------------------------------------------
      {
        path: 'interventions',
        children: [
          {
            index: true,
            element: (
              <FeatureGuard feature="interventions">{withSuspense(InterventionsPage)}</FeatureGuard>
            ),
          },
          {
            path: 'create',
            element: (
              <FeatureGuard feature="interventions">
                {withSuspense(CreateInterventionPage)}
              </FeatureGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <FeatureGuard feature="interventions">
                {withSuspense(InterventionDetailsPage)}
              </FeatureGuard>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <FeatureGuard feature="interventions">
                {withSuspense(EditInterventionPage)}
              </FeatureGuard>
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------------
      // USERS
      // ----------------------------------------------------------------------------
      {
        path: 'users',
        children: [
          {
            index: true,
            element: withSuspense(UsersPage),
          },
          {
            path: 'create',
            element: withSuspense(CreateUserPage),
          },
          {
            path: ':id',
            element: withSuspense(UserDetailsPage),
          },
          {
            path: ':id/profile',
            element: withSuspense(UserProfilePage),
          },
          {
            path: ':id/edit',
            element: withSuspense(EditUserPage),
          },
        ],
      },

      // ----------------------------------------------------------------------------
      // 🆕 ROOMS (Chambres)
      // ----------------------------------------------------------------------------
      {
        path: 'rooms',
        children: [
          {
            index: true,
            element: <FeatureGuard feature="rooms">{withSuspense(RoomsListPage)}</FeatureGuard>,
          },
          {
            path: 'create',
            element: <FeatureGuard feature="rooms">{withSuspense(CreateRoomPage)}</FeatureGuard>,
          },
          {
            path: ':roomId',
            element: <FeatureGuard feature="rooms">{withSuspense(RoomDetailPage)}</FeatureGuard>,
          },
          {
            path: ':roomId/edit',
            element: <FeatureGuard feature="rooms">{withSuspense(EditRoomPage)}</FeatureGuard>,
          },
        ],
      },

      // ----------------------------------------------------------------------------
      // 🆕 PLANNING (Calendrier)
      // ----------------------------------------------------------------------------
      {
        path: 'planning',
        element: (
          <FeatureGuard feature="interventionPlanning">{withSuspense(PlanningPage)}</FeatureGuard>
        ),
      },

      // ----------------------------------------------------------------------------
      // 🆕 NOTIFICATIONS (Centre de notifications)
      // ----------------------------------------------------------------------------
      {
        path: 'notifications',
        element: (
          <FeatureGuard feature="pushNotifications">
            {withSuspense(NotificationCenterPage)}
          </FeatureGuard>
        ),
      },

      // ----------------------------------------------------------------------------
      // 🆕 MESSAGING (Messagerie interne)
      // ----------------------------------------------------------------------------
      {
        path: 'messaging',
        element: <FeatureGuard feature="internalChat">{withSuspense(MessagingPage)}</FeatureGuard>,
      },

      // ----------------------------------------------------------------------------
      // SETTINGS (Paramètres)
      // ----------------------------------------------------------------------------
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
      },
      {
        path: 'settings/features',
        element: withSuspense(EstablishmentFeaturesPage),
      },
      {
        path: 'settings/establishment',
        element: withSuspense(EstablishmentSettingsPage),
      },
      {
        path: 'settings/migration',
        element: withSuspense(MigrationToolsPage),
      },
      {
        path: 'settings/integrations',
        element: withSuspense(IntegrationsPage),
      },

      // ----------------------------------------------------------------------------
      // 🔍 DIAGNOSTIC
      // ----------------------------------------------------------------------------
      {
        path: 'diagnostic',
        element: withSuspense(DiagnosticPage),
      },

      // ----------------------------------------------------------------------------
      // 🗑️ CORBEILLE (Trash)
      // ----------------------------------------------------------------------------
      {
        path: 'trash',
        element: <TrashPage />,
      },

      // ----------------------------------------------------------------------------
      // 📚 DOCUMENTATION
      // ----------------------------------------------------------------------------
      {
        path: 'documentation',
        element: withSuspense(DocumentationPage),
      },
    ],
  },

  // ============================================================================
  // REDIRECTIONS POUR ANCIENNES ROUTES
  // ============================================================================
  {
    path: '/dashboard',
    element: <Navigate to="/app/dashboard" replace />,
  },

  // ============================================================================
  // PAGE 404
  // ============================================================================
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]);

export default router;
