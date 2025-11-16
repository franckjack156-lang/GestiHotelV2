/**
 * ============================================================================
 * USERS GRID COMPONENT
 * ============================================================================
 */

import React from 'react';
import { UserCard } from './UserCard';
import type { User } from '../types/user.types';

interface UsersGridProps {
  /** Liste d'utilisateurs */
  users: User[];
  /** Callback édition */
  onEdit?: (user: User) => void;
  /** Callback suppression */
  onDelete?: (user: User) => void;
  /** Callback toggle active */
  onToggleActive?: (user: User) => void;
  /** Vue de carte (compact, default, detailed) */
  cardView?: 'compact' | 'default' | 'detailed';
}

export const UsersGrid: React.FC<UsersGridProps> = ({
  users,
  onEdit,
  onDelete,
  onToggleActive,
  cardView = 'default',
}) => {
  if (users.length === 0) {
    return <div className="text-center py-12 text-gray-500">Aucun utilisateur trouvé</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          view={cardView}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
};
