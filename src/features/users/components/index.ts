/**
 * ============================================================================
 * USERS COMPONENTS - INDEX
 * ============================================================================
 *
 * Export centralisé de tous les composants Users
 */

// Composants de base
export { UserAvatar } from './UserAvatar';
export { AvatarUpload } from './AvatarUpload';
export { RoleBadge } from './RoleBadge';
export { StatusBadge } from './StatusBadge';

// Composants carte et affichage
export { UserCard } from './UserCard';
export { UsersGrid } from './UsersGrid';
export { UsersTable } from './UsersTable';

// Formulaires et édition
export { UserForm } from './UserForm';
export { TechnicianSelect } from './TechnicianSelect';

// Filtres et recherche
export { UsersFilters } from './UsersFilters';

// Dialogs
export { UserDeleteDialog } from './UserDeleteDialog';

// Statistiques
export { UserStats } from './UserStats';

// Types (re-export pour convenience)
export type {
  User,
  UserProfile,
  CreateUserData,
  UpdateUserData,
  UserFilters,
  UserSortOptions,
  UserStats as UserStatsType,
} from '../types/user.types';

export { UserStatus } from '../types/user.types';

export type { UserRole } from '../types/role.types';

export { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS, Permission } from '../types/role.types';
