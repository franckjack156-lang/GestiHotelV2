/**
 * Shared Types Index
 *
 * Export centralisé de tous les types partagés
 */

// Common types
export * from './common.types';

// Status types
export * from './status.types';

// Establishment types
export * from './establishment.types';

// Reference lists types
export * from './reference-lists.types';

// Re-export user/auth types from features
export { UserStatus } from '@/features/users/types/user.types';

export type {
  User,
  UserProfile,
  CreateUserData,
  UpdateUserData,
  UpdateProfileData,
  UserFilters,
  UserSortOptions,
  UserInvitation,
  UserStats,
  UserActivity,
  UserSession,
  AuthCredentials,
  PasswordResetData,
  ChangePasswordData,
  NotificationPreferences,
  DisplayPreferences,
  Address,
  EmergencyContact,
} from '@/features/users/types/user.types';

// Re-export role types and enums as values (not just types)
export {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  ROLE_HIERARCHY,
  PERMISSION_GROUPS,
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
  getRolePermissions,
  isAdminRole,
  isSuperAdminRole,
  compareRoles,
} from '@/features/users/types/role.types';
