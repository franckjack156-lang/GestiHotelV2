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
const UserProfilePage = lazy(() =>
  import('@/pages/users/UserProfilePage').then(module => ({ default: module.UserProfilePage }))
);
const EditUserPage = lazy(() =>
  import('@/pages/users/EditUserPage').then(module => ({ default: module.EditUserPage }))
);

// Rooms
const RoomsListPage = lazy(() =>
  import('@/pages/rooms/RoomsPages').then(module => ({ default: module.RoomsListPage }))
);
const CreateRoomPage = lazy(() =>
  import('@/pages/rooms/RoomsPages').then(module => ({ default: module.CreateRoomPage }))
);
const RoomDetailPage = lazy(() =>
  import('@/pages/rooms/RoomDetailPage').then(module => ({ default: module.RoomDetailPage }))
);
const EditRoomPage = lazy(() =>
  import('@/pages/rooms/EditRoomPage').then(module => ({ default: module.EditRoomPage }))
);

// Messaging
const MessagingPage = lazy(() =>
  import('@/pages/MessagingPage').then(module => ({ default: module.MessagingPage }))
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
const EstablishmentFeaturesPage = lazy(() =>
  import('@/pages/settings/EstablishmentFeaturesPage').then(module => ({
    default: module.EstablishmentFeaturesPage,
  }))
);
const EstablishmentSettingsPage = lazy(() =>
  import('@/pages/settings/EstablishmentSettingsPage').then(module => ({
    default: module.EstablishmentSettingsPage,
  }))
);
const MigrationToolsPage = lazy(() =>
  import('@/pages/settings/MigrationToolsPage').then(module => ({
    default: module.MigrationToolsPage,
  }))
);
const IntegrationsPage = lazy(() =>
  import('@/pages/settings/IntegrationsPage').then(module => ({
    default: module.IntegrationsPage,
  }))
);

// Diagnostic
const DiagnosticPage = lazy(() =>
  import('@/pages/DiagnosticPage').then(module => ({ default: module.DiagnosticPage }))
);

// Documentation
const DocumentationPage = lazy(() =>
  import('@/pages/DocumentationPage').then(module => ({ default: module.DocumentationPage }))
);

// Support
const MyTicketsPage = lazy(() =>
  import('@/pages/support/MyTicketsPage').then(module => ({ default: module.MyTicketsPage }))
);
const TicketDetailPage = lazy(() =>
  import('@/pages/support/TicketDetailPage').then(module => ({ default: module.TicketDetailPage }))
);
const AdminTicketsPage = lazy(() =>
  import('@/pages/support/AdminTicketsPage').then(module => ({ default: module.AdminTicketsPage }))
);
const AdminTicketDetailPage = lazy(() =>
  import('@/pages/support/AdminTicketDetailPage').then(module => ({
    default: module.AdminTicketDetailPage,
  }))
);

// Templates
const TemplatesPage = lazy(() =>
  import('@/pages/templates/TemplatesPage').then(module => ({ default: module.TemplatesPage }))
);

// Suppliers
const SuppliersPage = lazy(() =>
  import('@/pages/suppliers/SuppliersPage').then(module => ({ default: module.SuppliersPage }))
);
const SupplierDetailPage = lazy(() =>
  import('@/pages/suppliers/SupplierDetailPage').then(module => ({
    default: module.SupplierDetailPage,
  }))
);

// Inventory
const InventoryPage = lazy(() =>
  import('@/pages/inventory/InventoryPage').then(module => ({ default: module.InventoryPage }))
);
const InventoryItemDetailPage = lazy(() =>
  import('@/pages/inventory/InventoryItemDetailPage').then(module => ({
    default: module.InventoryItemDetailPage,
  }))
);

// 404
const NotFoundPage = lazy(() =>
  import('@/pages/NotFound').then(module => ({ default: module.NotFoundPage }))
);

// ============================================================================
// WRAPPER WITH SUSPENSE
// ============================================================================

const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<unknown>>) => {
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
            path: ':id/profile',
            element: withSuspense(UserProfilePage),
          },
          {
            path: ':id/edit',
            element: withSuspense(EditUserPage),
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

      // Planning
      {
        path: 'planning',
        element: (
          <FeatureGuard feature="interventionPlanning">{withSuspense(PlanningPage)}</FeatureGuard>
        ),
      },

      // Notifications
      {
        path: 'notifications',
        element: (
          <FeatureGuard feature="pushNotifications">
            {withSuspense(NotificationCenterPage)}
          </FeatureGuard>
        ),
      },

      // Messaging
      {
        path: 'messaging',
        element: <FeatureGuard feature="internalChat">{withSuspense(MessagingPage)}</FeatureGuard>,
      },

      // Settings
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

      // Diagnostic
      {
        path: 'diagnostic',
        element: withSuspense(DiagnosticPage),
      },

      // Documentation
      {
        path: 'documentation',
        element: withSuspense(DocumentationPage),
      },

      // Support (Mes demandes)
      {
        path: 'support',
        children: [
          {
            index: true,
            element: withSuspense(MyTicketsPage),
          },
          {
            path: ':id',
            element: withSuspense(TicketDetailPage),
          },
        ],
      },

      // Admin Support (Gestion des tickets)
      {
        path: 'admin/support',
        children: [
          {
            index: true,
            element: withSuspense(AdminTicketsPage),
          },
          {
            path: ':id',
            element: withSuspense(AdminTicketDetailPage),
          },
        ],
      },

      // Templates
      {
        path: 'templates',
        element: (
          <FeatureGuard feature="interventionTemplates">{withSuspense(TemplatesPage)}</FeatureGuard>
        ),
      },

      // Suppliers
      {
        path: 'suppliers',
        children: [
          {
            index: true,
            element: <FeatureGuard feature="suppliers">{withSuspense(SuppliersPage)}</FeatureGuard>,
          },
          {
            path: ':supplierId',
            element: (
              <FeatureGuard feature="suppliers">{withSuspense(SupplierDetailPage)}</FeatureGuard>
            ),
          },
        ],
      },

      // Inventory
      {
        path: 'inventory',
        children: [
          {
            index: true,
            element: <FeatureGuard feature="inventory">{withSuspense(InventoryPage)}</FeatureGuard>,
          },
          {
            path: ':itemId',
            element: (
              <FeatureGuard feature="inventory">
                {withSuspense(InventoryItemDetailPage)}
              </FeatureGuard>
            ),
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
