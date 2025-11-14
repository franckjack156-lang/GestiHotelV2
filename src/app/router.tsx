/**
 * Router Configuration - VERSION COMPLÈTE
 *
 * Configuration des routes de l'application avec React Router
 * Inclut toutes les nouvelles pages créées
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { ProtectedRoute } from '@/shared/components/guards/ProtectedRoute';
import { GuestRoute } from '@/shared/components/guards/GuestRoute';
import { FeatureGuard } from '@/shared/components/guards/FeatureGuard';

// Auth Pages
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { ResetPasswordPage } from '@/pages/ResetPassword';

// Dashboard
import { DashboardPage } from '@/pages/Dashboard';

// Interventions
import { InterventionsPage } from '@/pages/interventions/InterventionsPage';
import { CreateInterventionPage } from '@/pages/interventions/CreateInterventionPage';
import { InterventionDetailsPage } from '@/pages/interventions/InterventionDetailsPage';
import { EditInterventionPage } from '@/pages/interventions/EditInterventionPage';

// Users
import { UsersPage } from '@/pages/users/UsersPage';
import { CreateUserPage } from '@/pages/users/CreateUserPage';
import { UserDetailsPage } from '@/pages/users/UserDetailsPage';
import { UserProfilePage } from '@/pages/users/UserProfilePage';
import { EditUserPage } from '@/pages/users/EditUserPage';

// 🆕 Establishments (nouvelles pages)
import {
  EstablishmentsListPage,
  CreateEstablishmentPage,
  EditEstablishmentPage,
} from '@/pages/establishments/EstablishmentsPages';

// 🆕 Rooms (nouvelles pages)
import { RoomsListPage, CreateRoomPage } from '@/pages/rooms/RoomsPages';

// 🆕 Planning (nouvelle page)
import { PlanningPage } from '@/pages/PlanningPage';

// 🆕 Notification Center (nouvelle page)
import { NotificationCenterPage } from '@/pages/NotificationCenterPage';

// 🆕 Messaging (nouvelle page)
import { MessagingPage } from '@/pages/MessagingPage';

// Settings
import { SettingsPage } from '@/pages/Settings';
import { EstablishmentFeaturesPage } from '@/pages/settings/EstablishmentFeaturesPage';

// 🔍 Diagnostic
import { DiagnosticPage } from '@/pages/DiagnosticPage';

// 404
import { NotFoundPage } from '@/pages/NotFound';

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
              <FeatureGuard feature="interventions">
                <InterventionsPage />
              </FeatureGuard>
            ),
          },
          {
            path: 'create',
            element: (
              <FeatureGuard feature="interventions">
                <CreateInterventionPage />
              </FeatureGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <FeatureGuard feature="interventions">
                <InterventionDetailsPage />
              </FeatureGuard>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <FeatureGuard feature="interventions">
                <EditInterventionPage />
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
            element: <UsersPage />,
          },
          {
            path: 'create',
            element: <CreateUserPage />,
          },
          {
            path: ':id',
            element: <UserDetailsPage />,
          },
          {
            path: ':id/profile',
            element: <UserProfilePage />,
          },
          {
            path: ':id/edit',
            element: <EditUserPage />,
          },
        ],
      },

      // ----------------------------------------------------------------------------
      // 🆕 ESTABLISHMENTS (Établissements)
      // ----------------------------------------------------------------------------
      {
        path: 'establishments',
        children: [
          {
            index: true,
            element: <EstablishmentsListPage />,
          },
          {
            path: 'create',
            element: <CreateEstablishmentPage />,
          },
          {
            path: ':id/edit',
            element: <EditEstablishmentPage />,
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
            element: (
              <FeatureGuard feature="rooms">
                <RoomsListPage />
              </FeatureGuard>
            ),
          },
          {
            path: 'create',
            element: (
              <FeatureGuard feature="rooms">
                <CreateRoomPage />
              </FeatureGuard>
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------------
      // 🆕 PLANNING (Calendrier)
      // ----------------------------------------------------------------------------
      {
        path: 'planning',
        element: (
          <FeatureGuard feature="planning">
            <PlanningPage />
          </FeatureGuard>
        ),
      },

      // ----------------------------------------------------------------------------
      // 🆕 NOTIFICATIONS (Centre de notifications)
      // ----------------------------------------------------------------------------
      {
        path: 'notifications',
        element: (
          <FeatureGuard feature="notifications">
            <NotificationCenterPage />
          </FeatureGuard>
        ),
      },

      // ----------------------------------------------------------------------------
      // 🆕 MESSAGING (Messagerie interne)
      // ----------------------------------------------------------------------------
      {
        path: 'messaging',
        element: (
          <FeatureGuard feature="messaging">
            <MessagingPage />
          </FeatureGuard>
        ),
      },

      // ----------------------------------------------------------------------------
      // SETTINGS (Paramètres)
      // ----------------------------------------------------------------------------
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'settings/features',
        element: <EstablishmentFeaturesPage />,
      },

      // ----------------------------------------------------------------------------
      // 🔍 DIAGNOSTIC
      // ----------------------------------------------------------------------------
      {
        path: 'diagnostic',
        element: <DiagnosticPage />,
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
    element: <NotFoundPage />,
  },
]);

export default router;
