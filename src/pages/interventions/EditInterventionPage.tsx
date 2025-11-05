/**
 * EditInterventionPage
 *
 * Page d'édition d'une intervention existante
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { InterventionForm } from '@/features/interventions/components/form/InterventionForm';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import type { Intervention } from '@/features/interventions/types/intervention.types';

export const EditInterventionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { getIntervention } = useInterventionActions();

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger l'intervention
  useEffect(() => {
    const loadIntervention = async () => {
      if (!id) {
        setError("ID d'intervention manquant");
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadIntervention();
  }, [id, getIntervention]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement de l'intervention...</p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error || !intervention) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Erreur</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Impossible de charger l'intervention"}
          </p>
        </div>
      </div>
    );
  }

  // Préparer les données initiales pour le formulaire
  const initialData = {
    title: intervention.title,
    description: intervention.description,
    type: intervention.type,
    category: intervention.category,
    priority: intervention.priority,
    location: intervention.location,
    roomNumber: intervention.roomNumber,
    floor: intervention.floor,
    building: intervention.building,
    assignedTo: intervention.assignedTo,
    scheduledAt: intervention.scheduledAt?.toDate(),
    estimatedDuration: intervention.estimatedDuration,
    internalNotes: intervention.internalNotes,
    isUrgent: intervention.isUrgent,
    isBlocking: intervention.isBlocking,
    tags: intervention.tags,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Modifier l'intervention
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {intervention.reference} - {intervention.title}
        </p>
      </div>

      {/* Formulaire */}
      <InterventionForm initialData={initialData} interventionId={id} mode="edit" />
    </div>
  );
};
