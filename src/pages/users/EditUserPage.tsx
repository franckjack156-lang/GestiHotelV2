/**
 * ============================================================================
 * EDIT USER PAGE
 * ============================================================================
 *
 * Page de modification d'un utilisateur existant
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UserForm } from '@/features/users/components/UserForm';
import { useUser, useUserActions } from '@/features/users/hooks/useUsers';
import { toast } from 'sonner';
import type { UpdateUserData } from '@/features/users/types/user.types';

export const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useUser(id);
  const { updateUser, isUpdating } = useUserActions();

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (data: UpdateUserData) => {
    if (!id) return;

    try {
      await updateUser(id, data);
      toast.success('Utilisateur modifié avec succès !');
      navigate(`/app/users/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Utilisateur introuvable</p>
        <Button onClick={() => navigate('/app/users')}>Retour à la liste</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/users/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Modifier l'utilisateur
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user.displayName} ({user.email})
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            mode="edit"
            initialData={{
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              photoURL: user.photoURL || undefined,
              phoneNumber: user.phoneNumber || undefined,
              jobTitle: user.jobTitle || undefined,
              department: user.department || undefined,
              establishmentIds: user.establishmentIds,
              skills: user.skills || [],
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/app/users/${id}`)}
            isSubmitting={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  );
};
