/**
 * UserDetailsPage - Détails utilisateur
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  useUser,
  useUserActions,
  UserAvatar,
  RoleBadge,
  StatusBadge,
  UserDeleteDialog,
} from '@/features/users/components';
import { ArrowLeft, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useUser(id);
  const { deleteUser, toggleActive, isDeleting } = useUserActions();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">Utilisateur introuvable</div>;
  }

  /**
   * Gérer la suppression
   */
  const handleDelete = async () => {
    const success = await deleteUser(user.id);
    if (success) {
      toast.success('Utilisateur supprimé');
      navigate('/app/users');
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  /**
   * Gérer toggle active
   */
  const handleToggleActive = async () => {
    const success = await toggleActive(user.id, !user.isActive);
    if (success) {
      toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil utilisateur</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleActive}>
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
          </Button>
          <Button variant="outline" onClick={() => navigate(`/app/users/${user.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Infos principales */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <UserAvatar
              photoURL={user.photoURL}
              displayName={user.displayName}
              size="xl"
              showOnline
              isOnline={user.isActive}
            />

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>

              {user.jobTitle && (
                <div>
                  <span className="text-sm font-medium">Poste:</span>
                  <span className="ml-2 text-sm text-gray-600">{user.jobTitle}</span>
                </div>
              )}

              {user.phoneNumber && (
                <div>
                  <span className="text-sm font-medium">Téléphone:</span>
                  <span className="ml-2 text-sm text-gray-600">{user.phoneNumber}</span>
                </div>
              )}

              {user.lastLoginAt && (
                <div>
                  <span className="text-sm font-medium">Dernière connexion:</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {format(
                      user.lastLoginAt instanceof Date
                        ? user.lastLoginAt
                        : user.lastLoginAt.toDate(),
                      'dd MMMM yyyy à HH:mm',
                      { locale: fr }
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog suppression */}
      <UserDeleteDialog
        open={showDeleteDialog}
        user={user}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
