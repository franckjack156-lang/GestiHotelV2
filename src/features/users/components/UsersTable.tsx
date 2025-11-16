/**
 * ============================================================================
 * USERS TABLE COMPONENT
 * ============================================================================
 */

import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { UserAvatar } from './UserAvatar';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import type { User, UserProfile, UserSortOptions } from '../types/user.types';
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Power,
  PowerOff,
} from 'lucide-react';
// TODO: cn imported but unused
// import { cn } from '@/shared/utils/cn';

interface UsersTableProps {
  /** Liste d'utilisateurs */
  users: User[];
  /** Options de tri */
  sortOptions?: UserSortOptions;
  /** Callback changement tri */
  onSortChange?: (field: UserSortOptions['field']) => void;
  /** Callback voir détails */
  onView?: (user: User) => void;
  /** Callback édition */
  onEdit?: (user: User) => void;
  /** Callback suppression */
  onDelete?: (user: User) => void;
  /** Callback toggle active */
  onToggleActive?: (user: User) => void;
  /** Colonnes visibles */
  visibleColumns?: string[];
}

const UsersTableComponent: React.FC<UsersTableProps> = ({
  users,
  sortOptions,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  visibleColumns = ['displayName', 'email', 'role', 'status', 'lastLoginAt'],
}) => {
  /**
   * Render sort icon - memoized
   */
  const renderSortIcon = useCallback(
    (field: UserSortOptions['field']) => {
      if (!sortOptions || sortOptions.field !== field) {
        return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
      }
      return sortOptions.direction === 'asc' ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      );
    },
    [sortOptions]
  );

  /**
   * Handle sort click - memoized
   */
  const handleSortClick = useCallback(
    (field: UserSortOptions['field']) => {
      if (onSortChange) {
        onSortChange(field);
      }
    },
    [onSortChange]
  );

  const handleView = useCallback(
    (user: User) => {
      onView?.(user);
    },
    [onView]
  );

  const handleEdit = useCallback(
    (user: User) => {
      onEdit?.(user);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (user: User) => {
      onDelete?.(user);
    },
    [onDelete]
  );

  const handleToggleActive = useCallback(
    (user: User) => {
      onToggleActive?.(user);
    },
    [onToggleActive]
  );

  if (users.length === 0) {
    return <div className="text-center py-12 text-gray-500">Aucun utilisateur trouvé</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Utilisateur */}
            {visibleColumns.includes('displayName') && (
              <TableHead>
                <button
                  onClick={() => handleSortClick('displayName')}
                  className="flex items-center gap-2 font-semibold hover:text-gray-900 dark:hover:text-white"
                >
                  Utilisateur
                  {renderSortIcon('displayName')}
                </button>
              </TableHead>
            )}

            {/* Email */}
            {visibleColumns.includes('email') && (
              <TableHead>
                <button
                  onClick={() => handleSortClick('email')}
                  className="flex items-center gap-2 font-semibold hover:text-gray-900 dark:hover:text-white"
                >
                  Email
                  {renderSortIcon('email')}
                </button>
              </TableHead>
            )}

            {/* Rôle */}
            {visibleColumns.includes('role') && (
              <TableHead>
                <button
                  onClick={() => handleSortClick('role')}
                  className="flex items-center gap-2 font-semibold hover:text-gray-900 dark:hover:text-white"
                >
                  Rôle
                  {renderSortIcon('role')}
                </button>
              </TableHead>
            )}

            {/* Statut */}
            {visibleColumns.includes('status') && <TableHead>Statut</TableHead>}

            {/* Dernière connexion */}
            {visibleColumns.includes('lastLoginAt') && (
              <TableHead>
                <button
                  onClick={() => handleSortClick('lastLoginAt')}
                  className="flex items-center gap-2 font-semibold hover:text-gray-900 dark:hover:text-white"
                >
                  Dernière connexion
                  {renderSortIcon('lastLoginAt')}
                </button>
              </TableHead>
            )}

            {/* Actions */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map(user => (
            <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {/* Utilisateur */}
              {visibleColumns.includes('displayName') && (
                <TableCell>
                  <Link
                    to={`/app/users/${user.id}`}
                    className="flex items-center gap-3 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <UserAvatar photoURL={user.photoURL} displayName={user.displayName} size="sm" />
                    <div>
                      <div className="font-medium">{user.displayName}</div>
                      {(user as UserProfile).jobTitle && (
                        <div className="text-xs text-gray-500">
                          {(user as UserProfile).jobTitle}
                        </div>
                      )}
                    </div>
                  </Link>
                </TableCell>
              )}

              {/* Email */}
              {visibleColumns.includes('email') && (
                <TableCell>
                  <a
                    href={`mailto:${user.email}`}
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {user.email}
                  </a>
                </TableCell>
              )}

              {/* Rôle */}
              {visibleColumns.includes('role') && (
                <TableCell>
                  <RoleBadge role={user.role} size="sm" />
                </TableCell>
              )}

              {/* Statut */}
              {visibleColumns.includes('status') && (
                <TableCell>
                  <StatusBadge status={user.status} size="sm" />
                </TableCell>
              )}

              {/* Dernière connexion */}
              {visibleColumns.includes('lastLoginAt') && (
                <TableCell>
                  {user.lastLoginAt ? (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {format(
                        user.lastLoginAt instanceof Date
                          ? user.lastLoginAt
                          : user.lastLoginAt.toDate(),
                        'dd MMM yyyy',
                        { locale: fr }
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Jamais</span>
                  )}
                </TableCell>
              )}

              {/* Actions */}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                      {user.isActive ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Activer
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => handleDelete(user)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

UsersTableComponent.displayName = 'UsersTable';

export const UsersTable = memo(UsersTableComponent);
