/**
 * useInterventionWizard Hook
 *
 * Hook pour gérer le formulaire multi-étapes de création d'intervention
 */

import { useState, useCallback } from 'react';
import type { CreateInterventionData, RecurrenceConfig } from '../types/intervention.types';
import { InterventionPriority } from '@/shared/types/status.types';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isValid: boolean;
  isCompleted: boolean;
}

export const WIZARD_STEPS: Omit<WizardStep, 'isValid' | 'isCompleted'>[] = [
  {
    id: 1,
    title: 'Informations de base',
    description: 'Type, titre et description',
  },
  {
    id: 2,
    title: 'Localisation',
    description: "Où se situe l'intervention",
  },
  {
    id: 3,
    title: 'Priorité & Planning',
    description: 'Urgence et planification',
  },
  {
    id: 4,
    title: 'Assignation',
    description: 'Technicien responsable',
  },
  {
    id: 5,
    title: 'Photos & Documents',
    description: 'Pièces jointes',
  },
  {
    id: 6,
    title: 'Récapitulatif',
    description: 'Vérification finale',
  },
];

export interface WizardData extends Partial<CreateInterventionData> {
  // Propriétés additionnelles spécifiques au wizard (non présentes dans CreateInterventionData)
  tags?: Array<{ id: string; label: string; color?: string }>;
  roomType?: 'chambre' | 'commun' | 'exterieur';
  locations?: string[]; // Multi-chambres
  floor?: number;
  building?: string;
  isUrgent?: boolean;
  isBlocking?: boolean;
  estimatedDuration?: number;
  photos?: File[];

  // Récurrence
  isRecurring?: boolean;
  recurrenceConfig?: RecurrenceConfig | null;

  // Note: Les autres propriétés (priority, assignedTo, scheduledAt, internalNotes, etc.)
  // sont héritées de Partial<CreateInterventionData> avec leur type correct
}

export const useInterventionWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    priority: InterventionPriority.NORMAL, // Priorité par défaut
  });
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  /**
   * Aller à l'étape suivante
   */
  const goToNextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      // Marquer l'étape actuelle comme complétée
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, completedSteps]);

  /**
   * Aller à l'étape précédente
   */
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Aller directement à une étape
   */
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  /**
   * Mettre à jour les données du wizard
   */
  const updateWizardData = useCallback((data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  }, []);

  /**
   * Réinitialiser le wizard
   */
  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setWizardData({});
    setCompletedSteps([]);
  }, []);

  /**
   * Vérifier si une étape est valide
   */
  const isStepValid = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          // Informations de base
          return !!(
            wizardData.title &&
            wizardData.title.length >= 3 &&
            wizardData.description &&
            wizardData.description.length >= 10 &&
            wizardData.type &&
            wizardData.category
          );

        case 2:
          // Localisation
          return !!(wizardData.roomType && wizardData.location);

        case 3:
          // Priorité & Planning
          return !!wizardData.priority;

        case 4:
          // Assignation (optionnel)
          return true;

        case 5:
          // Photos (optionnel)
          return true;

        case 6:
          // Récapitulatif
          return isStepValid(1) && isStepValid(2) && isStepValid(3);

        default:
          return false;
      }
    },
    [wizardData]
  );

  /**
   * Obtenir les données complètes pour la création
   */
  const getInterventionData = useCallback((): CreateInterventionData => {
    return {
      title: wizardData.title!,
      description: wizardData.description!,
      type: wizardData.type as CreateInterventionData['type'],
      category: wizardData.category as CreateInterventionData['category'],
      priority: wizardData.priority as CreateInterventionData['priority'],
      location: wizardData.location!,
      roomNumber: wizardData.roomNumber,
      floor: wizardData.floor,
      building: wizardData.building,
      assignedTo: wizardData.assignedTo,
      scheduledAt: wizardData.scheduledAt,
      estimatedDuration: wizardData.estimatedDuration,
      internalNotes: wizardData.internalNotes,
      isUrgent: wizardData.isUrgent || false,
      isBlocking: wizardData.isBlocking || false,
      tags: wizardData.tags,
      photos: wizardData.photos,
    };
  }, [wizardData]);

  /**
   * Obtenir la progression
   */
  const getProgress = useCallback((): number => {
    return Math.round((completedSteps.length / WIZARD_STEPS.length) * 100);
  }, [completedSteps]);

  return {
    // État
    currentStep,
    wizardData,
    completedSteps,

    // Actions
    goToNextStep,
    goToPreviousStep,
    goToStep,
    updateWizardData,
    resetWizard,

    // Validation
    isStepValid,
    canGoNext: isStepValid(currentStep),
    canGoPrevious: currentStep > 1,
    isLastStep: currentStep === WIZARD_STEPS.length,

    // Données
    getInterventionData,
    getProgress,

    // Configuration
    totalSteps: WIZARD_STEPS.length,
    steps: WIZARD_STEPS,
  };
};
