/**
 * CreateUserPage - Création utilisateur
 */

// TODO: React imported but unused
// import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { UserForm } from '@/features/users/components';
import { useUserActions } from '@/features/users/hooks/useUsers';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const CreateUserPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { createUser, isCreating } = useUserActions();

  /**
   * Gérer la soumission
   */
  const handleSubmit = async (data: any) => {
    const userId = await createUser(data);

    if (userId) {
      toast.success('Utilisateur créé avec succès');
      navigate(`/app/users/${userId}`);
    } else {
      toast.error('Erreur lors de la création');
    }
  };

  if (!establishmentId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun établissement sélectionné</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/users')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouvel utilisateur</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créer un nouveau compte utilisateur
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            establishmentIds={[establishmentId]}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/app/users')}
            isSubmitting={isCreating}
          />
        </CardContent>
      </Card>
    </div>
  );
};
