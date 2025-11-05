/**
 * InterventionDetailsPage
 * 
 * Page d'affichage des détails d'une intervention
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { InterventionDetails } from '@/features/interventions/components/details/InterventionDetails';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { Intervention } from '@/features/interventions/types/intervention.types';

export const InterventionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    getIntervention,
    deleteIntervention,
    navigateToEdit,
    isDeleting,
    actionError,
  } = useInterventionActions();

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger l'intervention
  useEffect(() => {
    const loadIntervention = async () => {
      if (!id) {
        setError('ID d\'intervention manquant');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getIntervention(id);
        
        if (!data) {
          setError('Intervention non trouvée');
        } else {
          setIntervention(data);
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadIntervention();
  }, [id, getIntervention]);

  // Gérer la suppression
  const handleDelete = async () => {
    if (!id) return;

    const success = await deleteIntervention(id);
    if (success) {
      navigate('/interventions');
    }
  };

  // Gérer l'édition
  const handleEdit = () => {
    if (id) {
      navigateToEdit(id);
    }
  };

  // Retour
  const handleBack = () => {
    navigate('/interventions');
  };

  // Vérifier les permissions
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Chargement de l'intervention...
          </p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error || !intervention) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Erreur
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Impossible de charger l\'intervention'}
          </p>
          <button
            onClick={handleBack}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InterventionDetails
        intervention={intervention}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onBack={handleBack}
      />
    </div>
  );
};
