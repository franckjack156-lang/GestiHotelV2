/**
 * Shared Types Index
 *
 * Export centralisé de tous les types partagés
 */

// Common types
export * from './common.types';

// Establishment types
export * from './establishment.types';

// Reference lists types
export * from './reference-lists.types';

// Status types
export * from './status.types';

// Re-export user types for convenience
export type {
  User,
  UserStatus,
  UserProfile,
  CreateUserData,
  UpdateUserData,
  UpdateProfileData,
  UserFilters,
  UserSortOptions,
  UserStats,
  UserActivity,
  UserSession,
  AuthCredentials,
  PasswordResetData,
  ChangePasswordData,
  UserNotification,
  UserSimple,
  UserSummary,
} from '@/features/users/types/user.types';

// Export Permission enum and constants as values, not types
export {
  Permission,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  UserRole,
  UserRole as Role,
} from '@/features/users/types/role.types';
