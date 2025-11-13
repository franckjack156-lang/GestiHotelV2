/**
 * Lazy Router Configuration
 *
 * Version optimisée du router avec lazy loading pour améliorer les performances
 * Utilisez ce fichier à la place de router.tsx pour activer le lazy loading
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { ProtectedRoute } from '@/shared/components/guards/ProtectedRoute';
import { GuestRoute } from '@/shared/components/guards/GuestRoute';
import { FeatureGuard } from '@/shared/components/guards/FeatureGuard';
import { Skeleton } from '@/shared/components/ui/skeleton';

// ============================================================================
// LOADING FALLBACK
// ============================================================================

const PageLoader = () => (
  <div className="container mx-auto py-8 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

// ============================================================================
// LAZY IMPORTS
// ============================================================================

// Auth Pages
const LoginPage = lazy(() =>
  import('@/pages/Login').then(module => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/Register').then(module => ({ default: module.RegisterPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPassword').then(module => ({ default: module.ResetPasswordPage }))
);

// Dashboard
const DashboardPage = lazy(() =>
  import('@/pages/Dashboard').then(module => ({ default: module.DashboardPage }))
);

// Interventions
const InterventionsPage = lazy(() =>
  import('@/pages/interventions/InterventionsPage').then(module => ({
    default: module.InterventionsPage,
  }))
);
const CreateInterventionPage = lazy(() =>
  import('@/pages/interventions/CreateInterventionPage').then(module => ({
    default: module.CreateInterventionPage,
  }))
);
const InterventionDetailsPage = lazy(() =>
  import('@/pages/interventions/InterventionDetailsPage').then(module => ({
    default: module.InterventionDetailsPage,
  }))
);
const EditInterventionPage = lazy(() =>
  import('@/pages/interventions/EditInterventionPage').then(module => ({
    default: module.EditInterventionPage,
  }))
);

// Users
const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then(module => ({ default: module.UsersPage }))
);
const CreateUserPage = lazy(() =>
  import('@/pages/users/CreateUserPage').then(module => ({ default: module.CreateUserPage }))
);
const UserDetailsPage = lazy(() =>
  import('@/pages/users/UserDetailsPage').then(module => ({ default: module.UserDetailsPage }))
);
const EditUserPage = lazy(() =>
  import('@/pages/users/EditUserPage').then(module => ({ default: module.EditUserPage }))
);

// Establishments
const EstablishmentsListPage = lazy(() =>
  import('@/pages/establishments/EstablishmentsPages').then(module => ({
    default: module.EstablishmentsListPage,
  }))
);
const CreateEstablishmentPage = lazy(() =>
  import('@/pages/establishments/EstablishmentsPages').then(module => ({
    default: module.CreateEstablishmentPage,
  }))
);
const EditEstablishmentPage = lazy(() =>
  import('@/pages/establishments/EstablishmentsPages').then(module => ({
    default: module.EditEstablishmentPage,
  }))
);

// Rooms
const RoomsListPage = lazy(() =>
  import('@/pages/rooms/RoomsPages').then(module => ({ default: module.RoomsListPage }))
);
const CreateRoomPage = lazy(() =>
  import('@/pages/rooms/RoomsPages').then(module => ({ default: module.CreateRoomPage }))
);

// Planning
const PlanningPage = lazy(() =>
  import('@/pages/PlanningPage').then(module => ({ default: module.PlanningPage }))
);

// Notifications
const NotificationCenterPage = lazy(() =>
  import('@/pages/NotificationCenterPage').then(module => ({
    default: module.NotificationCenterPage,
  }))
);

// Settings
const SettingsPage = lazy(() =>
  import('@/pages/Settings').then(module => ({ default: module.SettingsPage }))
);
const ReferenceListsOrchestrator = lazy(() =>
  import('@/features/settings/components/ReferenceListsOrchestrator')
);
const EstablishmentFeaturesPage = lazy(() =>
  import('@/pages/settings/EstablishmentFeaturesPage').then(module => ({
    default: module.EstablishmentFeaturesPage,
  }))
);

// 404
const NotFoundPage = lazy(() =>
  import('@/pages/NotFound').then(module => ({ default: module.NotFoundPage }))
);

// ============================================================================
// WRAPPER WITH SUSPENSE
// ============================================================================

const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
};

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================

export const router = createBrowserRouter([
  // Auth Routes
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
        element: <GuestRoute>{withSuspense(LoginPage)}</GuestRoute>,
      },
      {
        path: 'register',
        element: <GuestRoute>{withSuspense(RegisterPage)}</GuestRoute>,
      },
      {
        path: 'reset-password',
        element: <GuestRoute>{withSuspense(ResetPasswordPage)}</GuestRoute>,
      },
    ],
  },

  // Protected Routes
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
        element: withSuspense(DashboardPage),
      },

      // Interventions
      {
        path: 'interventions',
        children: [
          {
            index: true,
            element: <FeatureGuard feature="interventions">{withSuspense(InterventionsPage)}</FeatureGuard>,
          },
          {
            path: 'create',
            element: <FeatureGuard feature="interventions">{withSuspense(CreateInterventionPage)}</FeatureGuard>,
          },
          {
            path: ':id',
            element: <FeatureGuard feature="interventions">{withSuspense(InterventionDetailsPage)}</FeatureGuard>,
          },
          {
            path: ':id/edit',
            element: <FeatureGuard feature="interventions">{withSuspense(EditInterventionPage)}</FeatureGuard>,
          },
        ],
      },

      // Users
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
            path: ':id/edit',
            element: withSuspense(EditUserPage),
          },
        ],
      },

      // Establishments
      {
        path: 'establishments',
        children: [
          {
            index: true,
            element: withSuspense(EstablishmentsListPage),
          },
          {
            path: 'create',
            element: withSuspense(CreateEstablishmentPage),
          },
          {
            path: ':id/edit',
            element: withSuspense(EditEstablishmentPage),
          },
        ],
      },

      // Rooms
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
        ],
      },

      // Planning
      {
        path: 'planning',
        element: <FeatureGuard feature="planning">{withSuspense(PlanningPage)}</FeatureGuard>,
      },

      // Notifications
      {
        path: 'notifications',
        element: <FeatureGuard feature="notifications">{withSuspense(NotificationCenterPage)}</FeatureGuard>,
      },

      // Settings
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
        children: [
          {
            index: true,
            element: <Navigate to="/app/settings/reference-lists" replace />,
          },
          {
            path: 'reference-lists',
            element: withSuspense(ReferenceListsOrchestrator),
          },
          {
            path: 'features',
            element: withSuspense(EstablishmentFeaturesPage),
          },
        ],
      },
    ],
  },

  // Redirections
  {
    path: '/dashboard',
    element: <Navigate to="/app/dashboard" replace />,
  },

  // 404
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]);

export default router;
