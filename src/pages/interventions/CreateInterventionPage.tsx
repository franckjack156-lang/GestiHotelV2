/**
 * ============================================================================
 * CREATE INTERVENTION PAGE - COMPLET
 * ============================================================================
 *
 * Page de création d'intervention avec 2 modes :
 * - Mode Wizard : Formulaire multi-étapes (5 étapes)
 * - Mode Simple : Formulaire 1 page
 *
 * Fonctionnalités :
 * - Upload photos (drag & drop)
 * - Validation Zod
 * - Auto-save brouillon
 * - Templates pré-remplis
 * - Suggestions intelligentes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, Upload, X, Save, Wand2, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FileUpload } from '@/shared/components/ui-extended';
import { DynamicListSelect } from '@/shared/components/forms/DynamicListSelect';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { useLocalStorage } from '@/shared/hooks/utilityHooks';
import { toast } from 'sonner';
import type { CreateInterventionData } from '@/features/interventions/types/intervention.types';
import {
  INTERVENTION_TYPE_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  type InterventionType,
  type InterventionCategory,
  type InterventionPriority,
} from '@/shared/types/status.types';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const interventionSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  type: z.string(),
  category: z.string(),
  priority: z.string(),
  location: z.string().min(3, 'La localisation est requise'),
  roomNumber: z.string().optional(),
  floor: z.coerce.number().optional(),
  building: z.string().optional(),
  assignedTo: z.string().optional(),
  estimatedDuration: z.coerce.number().optional(),
  internalNotes: z.string().optional(),
  isUrgent: z.boolean().default(false),
  isBlocking: z.boolean().default(false),
});

type FormData = z.infer<typeof interventionSchema>;

// ============================================================================
// TYPES
// ============================================================================

type FormMode = 'wizard' | 'simple' | null;
type WizardStep = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// COMPONENT
// ============================================================================

export const CreateInterventionPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { createIntervention, isCreating } = useInterventionActions();

  // Mode formulaire
  const [mode, setMode] = useState<FormMode>(null);

  // Wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Photos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Brouillon auto-save
  const [draft, setDraft] = useLocalStorage<Partial<FormData>>('intervention-draft', {});

  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(interventionSchema),
    defaultValues: draft,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Auto-save brouillon toutes les 30s
  useEffect(() => {
    const subscription = watch(value => {
      const timer = setTimeout(() => {
        setDraft(value as Partial<FormData>);
      }, 30000); // 30s

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [watch, setDraft]);

  // Gérer l'upload de fichiers
  const handleFilesSelected = (files: File[]) => {
    if (files.length + selectedFiles.length > 10) {
      toast.error('Maximum 10 photos');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedFiles([...selectedFiles, ...files]);
    setFilePreviews([...filePreviews, ...newPreviews]);
  };

  // Supprimer une photo
  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  // Soumettre le formulaire
  const onSubmit = async (data: FormData) => {
    try {
      const interventionData: CreateInterventionData = {
        ...data,
        type: data.type as InterventionType,
        category: data.category as InterventionCategory,
        priority: data.priority as InterventionPriority,
        photos: selectedFiles,
      };

      const id = await createIntervention(interventionData);

      if (id) {
        toast.success('Intervention créée avec succès');
        setDraft({}); // Clear draft
        navigate(`/app/interventions/${id}`);
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  // Navigation wizard
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep((currentStep + 1) as WizardStep);
  };

  const previousStep = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStep);
  };

  // Vérifier établissement
  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez sélectionner un établissement
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran de sélection du mode
  if (!mode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/app/interventions')}>
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Créer une intervention</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choisissez le mode de création qui vous convient
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mode Wizard */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setMode('wizard')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <Wand2 className="text-indigo-600 dark:text-indigo-400" size={32} />
              </div>
              <CardTitle>Mode Guidé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                Formulaire en 5 étapes pour vous guider pas à pas
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Guidé étape par étape
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Upload photos simplifié
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Recommandé pour débuter
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Mode Simple */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setMode('simple')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <FileText className="text-green-600 dark:text-green-400" size={32} />
              </div>
              <CardTitle>Mode Rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                Formulaire complet sur une seule page
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Création rapide
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Tous les champs visibles
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Pour utilisateurs expérimentés
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mode Wizard
  if (mode === 'wizard') {
    const steps = [
      { number: 1, title: 'Informations' },
      { number: 2, title: 'Localisation' },
      { number: 3, title: 'Photos' },
      { number: 4, title: 'Assignation' },
      { number: 5, title: 'Récapitulatif' },
    ];

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setMode(null)}>
            <ArrowLeft size={16} className="mr-2" />
            Changer de mode
          </Button>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {currentStep > step.number ? <Check size={20} /> : step.number}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className="text-sm font-medium">{step.title}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Informations */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Informations de base</h2>

                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input {...register('title')} placeholder="Ex: Fuite d'eau chambre 301" />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      {...register('description')}
                      placeholder="Décrivez le problème en détail"
                      rows={4}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <DynamicListSelect
                        listKey="interventionTypes"
                        value={watch('type')}
                        onChange={value => setValue('type', value)}
                        placeholder="Sélectionner un type"
                        showIcons
                        showColors
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Catégorie *</Label>
                      <DynamicListSelect
                        listKey="interventionCategories"
                        value={watch('category')}
                        onChange={value => setValue('category', value)}
                        placeholder="Sélectionner une catégorie"
                        showIcons
                        showColors
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priorité *</Label>
                      <DynamicListSelect
                        listKey="interventionPriorities"
                        value={watch('priority')}
                        onChange={value => setValue('priority', value)}
                        placeholder="Sélectionner une priorité"
                        showIcons
                        showColors
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimatedDuration">Durée estimée (min)</Label>
                      <Input
                        type="number"
                        {...register('estimatedDuration')}
                        placeholder="Ex: 60"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('isUrgent')} className="rounded" />
                      <span className="text-sm">Urgent</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('isBlocking')} className="rounded" />
                      <span className="text-sm">Bloquant</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Localisation */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Localisation</h2>

                  <div>
                    <Label htmlFor="location">Localisation *</Label>
                    <Input {...register('location')} placeholder="Ex: Chambre 301, Salle de bain" />
                    {errors.location && (
                      <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="roomNumber">Numéro chambre</Label>
                      <Input {...register('roomNumber')} placeholder="Ex: 301" />
                    </div>

                    <div>
                      <Label htmlFor="floor">Étage</Label>
                      <Input type="number" {...register('floor')} placeholder="Ex: 3" />
                    </div>

                    <div>
                      <Label htmlFor="building">Bâtiment</Label>
                      <Input {...register('building')} placeholder="Ex: A" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Photos (optionnel)</h2>

                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    accept="image/*"
                    multiple
                    maxFiles={10}
                    maxSize={10}
                  />

                  {filePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {filePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Assignation */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Assignation (optionnel)</h2>

                  <div>
                    <Label htmlFor="assignedTo">Assigner à</Label>
                    <Select onValueChange={value => setValue('assignedTo', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un technicien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech1">Jean Martin</SelectItem>
                        <SelectItem value="tech2">Marie Dupont</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="internalNotes">Notes internes</Label>
                    <Textarea
                      {...register('internalNotes')}
                      placeholder="Notes visibles uniquement par l'équipe"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Récapitulatif */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Titre</p>
                      <p className="font-medium">{watch('title')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                      <p>{watch('description')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                        <p>{INTERVENTION_TYPE_LABELS[watch('type') as InterventionType]}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Priorité</p>
                        <p>{PRIORITY_LABELS[watch('priority') as InterventionPriority]}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Localisation</p>
                      <p>{watch('location')}</p>
                    </div>
                    {filePreviews.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Photos</p>
                        <p>{filePreviews.length} photo(s) attachée(s)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={previousStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Précédent
                </Button>

                {currentStep < 5 ? (
                  <Button type="button" onClick={nextStep}>
                    Suivant
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Création...' : "Créer l'intervention"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode Simple - Formulaire complet sur 1 page
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setMode(null)}>
          <ArrowLeft size={16} className="mr-2" />
          Changer de mode
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer une intervention</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations de base</h3>

              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input {...register('title')} />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea {...register('description')} rows={4} />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Type *</Label>
                  <DynamicListSelect
                    listKey="interventionTypes"
                    value={watch('type')}
                    onChange={value => setValue('type', value)}
                    placeholder="Sélectionner un type"
                    showIcons
                    showColors
                  />
                </div>

                <div>
                  <Label>Catégorie *</Label>
                  <DynamicListSelect
                    listKey="interventionCategories"
                    value={watch('category')}
                    onChange={value => setValue('category', value)}
                    placeholder="Sélectionner une catégorie"
                    showIcons
                    showColors
                  />
                </div>

                <div>
                  <Label>Priorité *</Label>
                  <DynamicListSelect
                    listKey="interventionPriorities"
                    value={watch('priority')}
                    onChange={value => setValue('priority', value)}
                    placeholder="Sélectionner une priorité"
                    showIcons
                    showColors
                  />
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Localisation</h3>

              <div>
                <Label>Localisation *</Label>
                <Input {...register('location')} />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Chambre</Label>
                  <Input {...register('roomNumber')} />
                </div>
                <div>
                  <Label>Étage</Label>
                  <Input type="number" {...register('floor')} />
                </div>
                <div>
                  <Label>Bâtiment</Label>
                  <Input {...register('building')} />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Photos</h3>
              <FileUpload onFilesSelected={handleFilesSelected} />
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isUrgent')} className="rounded" />
                <span>Urgent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isBlocking')} className="rounded" />
                <span>Bloquant</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app/interventions')}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateInterventionPage;
