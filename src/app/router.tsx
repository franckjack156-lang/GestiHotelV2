/**
 * Router Configuration - VERSION CORRIGÉE
 *
 * Configuration des routes de l'application avec React Router
 *
 * ✅ Corrections :
 * - Ajout de la route d'édition utilisateur (/app/users/:id/edit)
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { ProtectedRoute } from '@/shared/components/guards/ProtectedRoute';
import { GuestRoute } from '@/shared/components/guards/GuestRoute';

// Pages
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import { DashboardPage } from '@/pages/Dashboard';
import { NotFoundPage } from '@/pages/NotFound';
import { InterventionsPage } from '@/pages/interventions/InterventionsPage';
import { CreateInterventionPage } from '@/pages/interventions/CreateInterventionPage';
import { InterventionDetailsPage } from '@/pages/interventions/InterventionDetailsPage';
import { EditInterventionPage } from '@/pages/interventions/EditInterventionPage';

// Users
import { UsersPage } from '@/pages/users/UsersPage';
import { CreateUserPage } from '@/pages/users/CreateUserPage';
import { UserDetailsPage } from '@/pages/users/UserDetailsPage';
import { EditUserPage } from '@/pages/users/EditUserPage'; // ✅ AJOUTÉ

// Settings
import { SettingsPage } from '@/pages/Settings';
import ReferenceListsOrchestrator from '@/features/settings/components/ReferenceListsOrchestrator';

/**
 * Configuration des routes
 */
export const router = createBrowserRouter([
  // Routes publiques (authentification)
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

  // Routes protégées (application)
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },

      // Interventions
      {
        path: 'interventions',
        children: [
          {
            index: true,
            element: <InterventionsPage />,
          },
          {
            path: 'create',
            element: <CreateInterventionPage />,
          },
          {
            path: ':id',
            element: <InterventionDetailsPage />,
          },
          {
            path: ':id/edit',
            element: <EditInterventionPage />,
          },
        ],
      },

      // Users
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
          // ✅ ROUTE D'ÉDITION AJOUTÉE
          {
            path: ':id/edit',
            element: <EditUserPage />,
          },
        ],
      },

      // Settings
      {
        path: 'settings',
        element: <SettingsPage />,
        children: [
          {
            index: true,
            element: <Navigate to="/app/settings/reference-lists" replace />,
          },
          {
            path: 'reference-lists',
            element: <ReferenceListsOrchestrator />,
          },
          // Placeholders pour les autres sections settings
          {
            path: 'establishment',
            element: (
              <div className="text-center py-12">
                <p className="text-gray-500">Section Établissement - À venir</p>
              </div>
            ),
          },
          {
            path: 'users',
            element: (
              <div className="text-center py-12">
                <p className="text-gray-500">Section Utilisateurs - À venir</p>
              </div>
            ),
          },
          {
            path: 'notifications',
            element: (
              <div className="text-center py-12">
                <p className="text-gray-500">Section Notifications - À venir</p>
              </div>
            ),
          },
          {
            path: 'security',
            element: (
              <div className="text-center py-12">
                <p className="text-gray-500">Section Sécurité - À venir</p>
              </div>
            ),
          },
          {
            path: 'appearance',
            element: (
              <div className="text-center py-12">
                <p className="text-gray-500">Section Apparence - À venir</p>
              </div>
            ),
          },
        ],
      },
    ],
  },

  // Redirection pour les anciennes routes
  {
    path: '/dashboard',
    element: <Navigate to="/app/dashboard" replace />,
  },

  // Page 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
