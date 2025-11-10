/**
 * ============================================================================
 * USER CARD COMPONENT
 * ============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/utils/cn';
import { UserAvatar } from './UserAvatar';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import type { User } from '../types/user.types';
import {
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  Power,
  PowerOff,
} from 'lucide-react';

interface UserCardProps {
  /** Utilisateur à afficher */
  user: User;
  /** Afficher les actions */
  showActions?: boolean;
  /** Vue (compact, default, detailed) */
  view?: 'compact' | 'default' | 'detailed';
  /** Callback édition */
  onEdit?: (user: User) => void;
  /** Callback suppression */
  onDelete?: (user: User) => void;
  /** Callback toggle active */
  onToggleActive?: (user: User) => void;
  /** Classe CSS additionnelle */
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showActions = true,
  view = 'default',
  onEdit,
  onDelete,
  onToggleActive,
  className,
}) => {
  const isCompact = view === 'compact';
  const isDetailed = view === 'detailed';

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className={cn('pb-3', isCompact && 'pb-2')}>
        <div className="flex items-start justify-between gap-3">
          {/* Avatar et infos principales */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to={`/app/users/${user.id}`}>
              <UserAvatar
                photoURL={user.photoURL}
                displayName={user.displayName}
                size={isCompact ? 'md' : 'lg'}
                showOnline={isDetailed}
                isOnline={user.isActive}
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                to={`/app/users/${user.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
              >
                {user.displayName}
              </Link>

              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              {user.phoneNumber && !isCompact && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onToggleActive?.(user)}>
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
                  onClick={() => onDelete?.(user)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', isCompact && 'pb-3')}>
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <RoleBadge role={user.role} size={isCompact ? 'sm' : 'md'} />
          <StatusBadge status={user.status} size={isCompact ? 'sm' : 'md'} />
        </div>

        {/* Infos supplémentaires */}
        {!isCompact && (
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {user.jobTitle && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>{user.jobTitle}</span>
              </div>
            )}

            {isDetailed && user.lastLoginAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  Dernière connexion:{' '}
                  {format(
                    user.lastLoginAt instanceof Date
                      ? user.lastLoginAt
                      : user.lastLoginAt.toDate(),
                    'dd MMM yyyy',
                    { locale: fr }
                  )}
                </span>
              </div>
            )}

            {isDetailed && user.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {skill}
                  </span>
                ))}
                {user.skills.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    +{user.skills.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
