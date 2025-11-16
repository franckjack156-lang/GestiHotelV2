/**
 * useInterventionForm Hook
 *
 * Hook pour gérer le formulaire d'intervention avec React Hook Form et Zod
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  InterventionType,
  InterventionCategory,
  InterventionPriority,
} from '@/shared/types/status.types';
import type { CreateInterventionData } from '../types/intervention.types';

/**
 * Schéma de validation Zod
 */
const interventionSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),

  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),

  type: z.nativeEnum(InterventionType, {
    message: "Type d'intervention requis",
  }).optional(),

  category: z.nativeEnum(InterventionCategory, {
    message: 'Catégorie requise',
  }).optional(),

  priority: z.nativeEnum(InterventionPriority).optional(),

  location: z
    .string()
    .max(200, 'La localisation ne peut pas dépasser 200 caractères')
    .optional(),

  roomNumber: z
    .string()
    .max(20, 'Le numéro de chambre ne peut pas dépasser 20 caractères')
    .optional(),

  floor: z
    .number()
    .int("L'étage doit être un nombre entier")
    .min(-5, "L'étage ne peut pas être inférieur à -5")
    .max(200, "L'étage ne peut pas dépasser 200")
    .optional()
    .nullable(),

  building: z.string().max(50, 'Le nom du bâtiment ne peut pas dépasser 50 caractères').optional(),

  assignedTo: z.string().optional(),

  scheduledAt: z.date().optional().nullable(),

  estimatedDuration: z
    .number()
    .int('La durée doit être un nombre entier')
    .min(5, 'La durée minimale est de 5 minutes')
    .max(1440, 'La durée maximale est de 1440 minutes (24h)')
    .optional()
    .nullable(),

  internalNotes: z
    .string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional(),

  isUrgent: z.boolean().optional(),

  isBlocking: z.boolean().optional(),

  tags: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        color: z.string().optional(),
      })
    )
    .optional(),

  photos: z
    .array(z.instanceof(File))
    .max(5, 'Vous ne pouvez pas uploader plus de 5 photos')
    .optional(),
});

export type InterventionFormData = z.infer<typeof interventionSchema>;

/**
 * Valeurs par défaut du formulaire
 */
const defaultValues: Partial<InterventionFormData> = {
  title: '',
  description: '',
  type: undefined,
  category: InterventionCategory.REPAIR,
  priority: InterventionPriority.NORMAL,
  location: '',
  roomNumber: '',
  floor: null,
  building: '',
  assignedTo: undefined,
  scheduledAt: null,
  estimatedDuration: null,
  internalNotes: '',
  isUrgent: false,
  isBlocking: false,
  tags: [],
  photos: [],
};

export const useInterventionForm = (initialData?: Partial<CreateInterventionData>) => {
  const form = useForm<InterventionFormData>({
    resolver: zodResolver(interventionSchema),
    defaultValues: initialData || defaultValues,
    mode: 'onBlur',
  });

  /**
   * Réinitialiser le formulaire
   */
  const resetForm = () => {
    form.reset(defaultValues);
  };

  /**
   * Pré-remplir le formulaire avec des données
   */
  const fillForm = (data: Partial<InterventionFormData>) => {
    form.reset(data);
  };

  /**
   * Vérifier si le formulaire a été modifié
   */
  const isDirty = form.formState.isDirty;

  /**
   * Vérifier si le formulaire est valide
   */
  const isValid = form.formState.isValid;

  /**
   * Obtenir les erreurs du formulaire
   */
  const errors = form.formState.errors;

  /**
   * Vérifier si le formulaire est en cours de soumission
   */
  const isSubmitting = form.formState.isSubmitting;

  return {
    // React Hook Form
    form,
    register: form.register,
    handleSubmit: form.handleSubmit,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
    control: form.control,

    // États
    isDirty,
    isValid,
    isSubmitting,
    errors,

    // Actions
    resetForm,
    fillForm,
  };
};

/**
 * Hook pour pré-visualiser les fichiers uploadés
 */
export const usePhotoPreview = () => {
  const [previews, setPreviews] = useState<string[]>([]);

  const generatePreviews = (files: File[]) => {
    // Nettoyer les anciennes previews
    previews.forEach((url: string) => URL.revokeObjectURL(url));

    // Générer les nouvelles
    const newPreviews = files.map((file: File) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const clearPreviews = () => {
    previews.forEach((url: string) => URL.revokeObjectURL(url));
    setPreviews([]);
  };

  return {
    previews,
    generatePreviews,
    clearPreviews,
  };
};
