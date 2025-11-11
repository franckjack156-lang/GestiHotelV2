/**
 * UserDetailsPage - Détails utilisateur
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { UserAvatar, RoleBadge, StatusBadge, UserDeleteDialog } from '@/features/users/components';
import { useUser, useUserActions } from '@/features/users/hooks/useUsers';
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

      {/* Profil */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <UserAvatar user={user} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
              </div>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <RoleBadge role={user.role} />
                {user.jobTitle && <span className="text-sm text-gray-500">• {user.jobTitle}</span>}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium">{user.phoneNumber || 'Non renseigné'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Département</p>
              <p className="font-medium">{user.department || 'Non renseigné'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Membre depuis</p>
              <p className="font-medium">
                {user.createdAt ? format(user.createdAt.toDate(), 'PPP', { locale: fr }) : '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Dernière connexion</p>
              <p className="font-medium">
                {user.lastLoginAt
                  ? format(user.lastLoginAt.toDate(), 'PPP à HH:mm', { locale: fr })
                  : 'Jamais'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de suppression */}
      <UserDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        userName={user.displayName}
        isDeleting={isDeleting}
      />
    </div>
  );
};
