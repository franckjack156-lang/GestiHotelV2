/**
 * UsersPage - Liste des utilisateurs
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { useUsers, useUserActions } from '@/features/users/hooks/useUsers';

// Composants
import {
  UsersFilters,
  UsersTable,
  UsersGrid,
  UserDeleteDialog,
  UserStats,
} from '@/features/users/components';
import { Plus, Grid, List } from 'lucide-react';
import { toast } from 'sonner';

export const UsersPage = () => {
  const navigate = useNavigate();
  const {
    users,
    isLoading,
    filters,
    sortOptions,
    listConfig,
    stats,
    applyFilters,
    clearFilters,
    changeSort,
    changeView,
  } = useUsers();

  const { deleteUser, toggleActive, isDeleting } = useUserActions();

  const [userToDelete, setUserToDelete] = useState<any>(null);

  /**
   * Gérer la suppression
   */
  const handleDelete = async () => {
    if (!userToDelete) return;

    const success = await deleteUser(userToDelete.id);
    if (success) {
      toast.success('Utilisateur supprimé avec succès');
      setUserToDelete(null);
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  /**
   * Gérer toggle active
   */
  const handleToggleActive = async (user: any) => {
    const success = await toggleActive(user.id, !user.isActive);
    if (success) {
      toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
    } else {
      toast.error('Erreur lors de la modification');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>

        <Button onClick={() => navigate('/app/users/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Statistiques */}
      <UserStats stats={stats} isLoading={isLoading} />

      {/* Filtres */}
      <UsersFilters filters={filters} onFiltersChange={applyFilters} onReset={clearFilters} />

      {/* Contrôles vue */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={listConfig.view === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => changeView('table')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={listConfig.view === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => changeView('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
      </div>

      {/* Liste */}
      {listConfig.view === 'table' ? (
        <UsersTable
          users={users}
          sortOptions={sortOptions}
          onSortChange={changeSort}
          onView={user => navigate(`/app/users/${user.id}`)}
          onEdit={user => navigate(`/app/users/${user.id}/edit`)}
          onDelete={setUserToDelete}
          onToggleActive={handleToggleActive}
        />
      ) : (
        <UsersGrid
          users={users}
          onEdit={user => navigate(`/app/users/${user.id}/edit`)}
          onDelete={setUserToDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Dialog suppression */}
      <UserDeleteDialog
        open={!!userToDelete}
        user={userToDelete}
        isDeleting={isDeleting}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
