/**
 * InterventionWizard Component
 *
 * Formulaire multi-étapes pour créer une intervention
 * Supporte les interventions récurrentes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, X, Repeat } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { useInterventionWizard } from '@/features/interventions/hooks/useInterventionWizard';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { createRecurringInterventions } from '@/features/interventions/services/recurrenceService';
import { toast } from 'sonner';

// Import des étapes
import { BasicInfoStep } from './steps/BasicInfoStep';
import { LocationStep } from './steps/LocationStep';
import { PriorityPlanningStep } from './steps/PriorityPlanningStep';
import { AssignmentStep } from './steps/AssignmentStep';
import { PhotosStep } from './steps/PhotosStep';
import { SummaryStep } from './steps/SummaryStep';
import { logger } from '@/core/utils/logger';

interface InterventionWizardProps {
  onCancel?: () => void;
  onSuccess?: (interventionId: string) => void;
}

export const InterventionWizard = ({ onCancel, onSuccess }: InterventionWizardProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const {
    currentStep,
    wizardData,
    completedSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    updateWizardData,
    resetWizard,
    isStepValid,
    canGoNext,
    canGoPrevious,
    isLastStep,
    getInterventionData,
    getProgress,
    totalSteps,
    steps,
  } = useInterventionWizard();

  const { createIntervention, actionError } = useInterventionActions();
  const establishmentId = user?.currentEstablishmentId || user?.establishmentIds?.[0];
  const userId = user?.id || '';

  /**
   * Gérer le passage à l'étape suivante
   */
  const handleNext = () => {
    if (canGoNext) {
      goToNextStep();
    }
  };

  /**
   * Gérer le retour à l'étape précédente
   */
  const handlePrevious = () => {
    if (canGoPrevious) {
      goToPreviousStep();
    }
  };

  /**
   * Gérer la soumission finale
   */
  const handleSubmit = async () => {
    if (!isStepValid(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = getInterventionData();

      // Vérifier si c'est une intervention récurrente
      if (wizardData.isRecurring && wizardData.recurrenceConfig && wizardData.scheduledAt) {
        if (!establishmentId || !userId) {
          toast.error('Utilisateur ou établissement non défini');
          return;
        }

        // Créer les interventions récurrentes
        const result = await createRecurringInterventions(
          establishmentId,
          userId,
          data,
          wizardData.recurrenceConfig,
          wizardData.scheduledAt
        );

        toast.success(`${result.count} interventions récurrentes créées`);
        resetWizard();
        onSuccess?.(result.interventionIds[0]);
        navigate('/app/planning');
      } else {
        // Créer une intervention simple
        const interventionId = await createIntervention(data);

        if (interventionId) {
          toast.success('Intervention créée avec succès');
          resetWizard();
          onSuccess?.(interventionId);
          navigate(`/app/interventions/${interventionId}`);
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de l\'intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gérer l'annulation
   */
  const handleCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ? Toutes les données seront perdues.')) {
      resetWizard();
      onCancel?.();
      navigate('/interventions');
    }
  };

  /**
   * Rendre l'étape actuelle
   */
  const renderStep = () => {
    const stepProps = {
      data: wizardData,
      onUpdate: updateWizardData,
    };

    switch (currentStep) {
      case 1:
        return <BasicInfoStep {...stepProps} />;
      case 2:
        return <LocationStep {...stepProps} />;
      case 3:
        return <PriorityPlanningStep {...stepProps} />;
      case 4:
        return <AssignmentStep {...stepProps} />;
      case 5:
        return <PhotosStep {...stepProps} />;
      case 6:
        return <SummaryStep {...stepProps} />;
      default:
        return null;
    }
  };

  const progress = getProgress();
  const currentStepInfo = steps[currentStep - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Nouvelle intervention
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Étape {currentStep} sur {totalSteps}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{progress}% complété</p>
      </div>

      {/* Stepper - Navigation entre étapes */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isAccessible = stepNumber <= currentStep || isCompleted;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Cercle d'étape */}
              <button
                onClick={() => isAccessible && goToStep(stepNumber)}
                disabled={!isAccessible}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : isCompleted
                      ? 'border-green-600 bg-green-600 text-white'
                      : isAccessible
                        ? 'border-gray-300 bg-white text-gray-500 hover:border-indigo-400 dark:bg-gray-800 dark:border-gray-600'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-900 dark:border-gray-700'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </button>

              {/* Ligne de connexion */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Titre de l'étape actuelle */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {currentStepInfo.title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{currentStepInfo.description}</p>
      </div>

      {/* Contenu de l'étape */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}

          {/* Message d'erreur */}
          {actionError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!canGoPrevious || isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {!isLastStep ? (
          <Button onClick={handleNext} disabled={!canGoNext || isSubmitting}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canGoNext || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : wizardData.isRecurring ? (
              <>
                <Repeat className="h-4 w-4 mr-2" />
                Créer les interventions récurrentes
              </>
            ) : (
              "Créer l'intervention"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
