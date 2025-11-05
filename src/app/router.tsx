/**
 * Router Configuration
 *
 * Configuration des routes de l'application avec React Router
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
      {
        path: '/app/interventions',
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
