/**
 * CreateInterventionPage
 * 
 * Page de création d'une nouvelle intervention
 */

import { InterventionForm } from '@/features/interventions/components/form/InterventionForm';

export const CreateInterventionPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Nouvelle intervention
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Créez une nouvelle intervention technique
        </p>
      </div>

      {/* Formulaire */}
      <InterventionForm mode="create" />
    </div>
  );
};
