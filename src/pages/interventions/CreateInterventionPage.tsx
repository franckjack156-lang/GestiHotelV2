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

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, Upload, X, Save, Wand2, FileText, AlertCircle } from 'lucide-react';
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
import { Alert } from '@/shared/components/ui/alert';
import { FileUpload } from '@/shared/components/ui-extended';
import { DynamicListSelect } from '@/shared/components/forms/DynamicListSelect';
import { TechnicianSelect } from '@/features/users/components';
import { RoomAutocomplete } from '@/features/rooms/components';
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
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  assignedTo: z.array(z.string()).optional(), // Tableau d'IDs de techniciens
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  location: z.string().min(1, 'La localisation est requise'),
  roomNumber: z.string().optional(),
  floor: z.coerce.number().optional(),
  building: z.string().optional(),
  estimatedDuration: z.coerce.number().optional(),
  internalNotes: z.string().optional(),
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
  const location = useLocation();
  const { establishmentId } = useCurrentEstablishment();
  const { createIntervention, isCreating } = useInterventionActions();

  // Ref pour détecter si c'est le premier montage
  const isFirstMount = useRef(true);

  // Mode formulaire
  const [mode, setMode] = useState<FormMode>(null);

  // Wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Photos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Brouillon auto-save
  const [draft, setDraft] = useLocalStorage<Partial<FormData>>('intervention-draft', {});

  // Form - initialiser avec des valeurs vides, le draft sera chargé manuellement
  const form = useForm<FormData>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Réinitialiser le formulaire quand on navigue vers la page
  useEffect(() => {
    // Vérifier si le brouillon a été explicitement supprimé
    const wasDraftCleared = window.localStorage.getItem('intervention-draft-cleared') === 'true';

    if (wasDraftCleared) {
      // Le brouillon a été supprimé: ne rien charger et retirer le flag
      window.localStorage.removeItem('intervention-draft-cleared');
      form.reset({});
      setSelectedFiles([]);
      setFilePreviews([]);
      setCurrentStep(1);
      setMode(null);
      return;
    }

    if (isFirstMount.current) {
      // Premier montage: charger le brouillon s'il existe
      isFirstMount.current = false;
      if (Object.keys(draft).length > 0) {
        form.reset(draft);
      }
    } else {
      // Navigation suivante: toujours réinitialiser complètement
      form.reset({});
      setSelectedFiles([]);
      setFilePreviews([]);
      setCurrentStep(1);
      setMode(null);

      // Charger le brouillon si présent après reset
      if (Object.keys(draft).length > 0) {
        setTimeout(() => {
          form.reset(draft);
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Ne PAS inclure draft pour éviter les réinitialisations intempestives

  // Auto-save brouillon toutes les 30s
  useEffect(() => {
    const subscription = watch(value => {
      const timer = setTimeout(() => {
        setDraft(value as Partial<FormData>);
      }, 30000); // 30s

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pas de dépendances pour éviter les re-créations de subscription

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
      console.log('🔍 [onSubmit] Form data received:', data);
      console.log('🔍 [onSubmit] data.type:', data.type, 'is undefined?', data.type === undefined);

      const interventionData: CreateInterventionData = {
        ...data,
        type: data.type as InterventionType,
        category: data.category as InterventionCategory,
        priority: data.priority as InterventionPriority,
        photos: selectedFiles,
      };

      console.log('🔍 [onSubmit] Prepared interventionData:', interventionData);
      console.log('🔍 [onSubmit] interventionData.type:', interventionData.type);

      const id = await createIntervention(interventionData);

      if (id) {
        toast.success('Intervention créée avec succès');

        console.log('🔍 [onSubmit] Avant suppression draft - localStorage:', window.localStorage.getItem('intervention-draft'));

        // Supprimer complètement le brouillon du localStorage
        window.localStorage.removeItem('intervention-draft');

        // IMPORTANT: Mettre à jour l'état du hook useLocalStorage aussi
        setDraft({});

        console.log('🔍 [onSubmit] Après suppression draft - localStorage:', window.localStorage.getItem('intervention-draft'));
        console.log('🔍 [onSubmit] setDraft({}) appelé');

        // Réinitialiser le formulaire et tous les états
        form.reset({});
        setSelectedFiles([]);
        setFilePreviews([]);
        setCurrentStep(1);

        console.log('🔍 [onSubmit] Draft supprimé, navigation vers intervention');
        navigate(`/app/interventions/${id}`);
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  // Navigation wizard
  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as WizardStep);
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

  // Vérifier si un brouillon existe
  const hasDraft = Object.keys(draft).length > 0;

  // Fonction pour effacer le brouillon
  const clearDraft = () => {
    console.log('🔍 [clearDraft] Avant suppression - localStorage:', window.localStorage.getItem('intervention-draft'));

    // Supprimer complètement le brouillon du localStorage
    window.localStorage.removeItem('intervention-draft');

    // IMPORTANT: Mettre à jour l'état du hook useLocalStorage aussi
    setDraft({});

    console.log('🔍 [clearDraft] Après suppression - localStorage:', window.localStorage.getItem('intervention-draft'));
    console.log('🔍 [clearDraft] setDraft({}) appelé');

    // Marquer explicitement que le brouillon a été supprimé
    window.localStorage.setItem('intervention-draft-cleared', 'true');

    // Réinitialiser le formulaire et tous les états
    form.reset({});
    setSelectedFiles([]);
    setFilePreviews([]);
    setCurrentStep(1);
    setMode(null);

    console.log('🔍 [clearDraft] Draft supprimé, form reset, états réinitialisés');
    toast.success('Brouillon supprimé');
  };

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

        {/* Alerte brouillon */}
        {hasDraft && (
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div className="flex items-center justify-between flex-1">
                <div>
                  <h4 className="font-semibold">Brouillon détecté</h4>
                  <p className="text-sm text-muted-foreground">
                    Un brouillon d'intervention a été sauvegardé. Voulez-vous continuer ou recommencer ?
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={clearDraft}>
                  Supprimer le brouillon
                </Button>
              </div>
            </Alert>
          </div>
        )}

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
      { number: 4, title: 'Récapitulatif' },
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
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      {...register('description')}
                      placeholder="Décrivez le problème en détail"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="assignedTo">Technicien(s) assigné(s) (optionnel)</Label>
                    <TechnicianSelect
                      value={watch('assignedTo') || []}
                      onChange={(value) => setValue('assignedTo', value as string[])}
                      multiple={true}
                      placeholder="Sélectionner un ou plusieurs techniciens"
                      showSkills={true}
                      showAvatars={true}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="type">Type (optionnel)</Label>
                      <DynamicListSelect
                        listKey="interventionTypes"
                        value={watch('type') || ''}
                        onChange={value => setValue('type', value)}
                        placeholder="Sélectionner un type"
                        showIcons
                        showColors
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Catégorie (optionnel)</Label>
                      <DynamicListSelect
                        listKey="interventionCategories"
                        value={watch('category') || ''}
                        onChange={value => setValue('category', value)}
                        placeholder="Sélectionner une catégorie"
                        showIcons
                        showColors
                      />
                    </div>

                    <div>
                      <Label htmlFor="priority">Priorité (optionnel)</Label>
                      <DynamicListSelect
                        listKey="interventionPriorities"
                        value={watch('priority') || ''}
                        onChange={value => setValue('priority', value)}
                        placeholder="Sélectionner une priorité"
                        showIcons
                        showColors
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Step 2: Localisation */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Localisation</h2>

                  <div>
                    <Label htmlFor="location">Localisation *</Label>
                    <DynamicListSelect
                      listKey="interventionLocations"
                      value={watch('location') || ''}
                      onChange={(value) => setValue('location', value)}
                      placeholder="Sélectionner une localisation"
                      allowCustom={true}
                    />
                    {errors.location && (
                      <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Par défaut, "Chambre" est disponible dans la liste
                    </p>
                  </div>

                  {/* Champs conditionnels si localisation = Chambre */}
                  {watch('location')?.toLowerCase() === 'chambre' && (
                    <div className="space-y-4 border-l-4 border-indigo-500 pl-4 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-r-lg">
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        Sélectionner une chambre
                      </p>

                      <div>
                        <Label htmlFor="roomNumber">Chambre</Label>
                        <RoomAutocomplete
                          value={watch('roomNumber') || ''}
                          onChange={(room) => {
                            if (room) {
                              setValue('roomNumber', room.number);
                              setValue('floor', room.floor);
                              setValue('building', room.building || '');
                            } else {
                              setValue('roomNumber', '');
                              setValue('floor', undefined);
                              setValue('building', '');
                            }
                          }}
                          placeholder="Rechercher ou créer une chambre..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          L'étage et le bâtiment seront remplis automatiquement
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="floor">Étage</Label>
                          <Input
                            type="number"
                            value={watch('floor') ?? ''}
                            placeholder="Auto-rempli"
                            disabled
                            className="bg-gray-100 dark:bg-gray-800"
                          />
                        </div>

                        <div>
                          <Label htmlFor="building">Bâtiment</Label>
                          <Input
                            value={watch('building') || ''}
                            placeholder="Auto-rempli"
                            disabled
                            className="bg-gray-100 dark:bg-gray-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
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

              {/* Step 4: Récapitulatif */}
              {currentStep === 4 && (
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

                {currentStep < 4 ? (
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
                <Input {...register('title')} placeholder="Ex: Fuite d'eau chambre 301" />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea {...register('description')} rows={4} placeholder="Décrivez le problème en détail" />
              </div>

              <div>
                <Label htmlFor="assignedTo">Technicien(s) assigné(s) (optionnel)</Label>
                <TechnicianSelect
                  value={watch('assignedTo') || []}
                  onChange={(value) => setValue('assignedTo', value as string[])}
                  multiple={true}
                  placeholder="Sélectionner un ou plusieurs techniciens"
                  showSkills={true}
                  showAvatars={true}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Type (optionnel)</Label>
                  <DynamicListSelect
                    listKey="interventionTypes"
                    value={watch('type') || ''}
                    onChange={value => setValue('type', value)}
                    placeholder="Sélectionner un type"
                    showIcons
                    showColors
                  />
                </div>

                <div>
                  <Label>Catégorie (optionnel)</Label>
                  <DynamicListSelect
                    listKey="interventionCategories"
                    value={watch('category') || ''}
                    onChange={value => setValue('category', value)}
                    placeholder="Sélectionner une catégorie"
                    showIcons
                    showColors
                  />
                </div>

                <div>
                  <Label>Priorité (optionnel)</Label>
                  <DynamicListSelect
                    listKey="interventionPriorities"
                    value={watch('priority') || ''}
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
                <DynamicListSelect
                  listKey="interventionLocations"
                  value={watch('location') || ''}
                  onChange={(value) => setValue('location', value)}
                  placeholder="Sélectionner une localisation"
                  allowCustom={true}
                />
                {errors.location && (
                  <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Par défaut, "Chambre" est disponible dans la liste
                </p>
              </div>

              {/* Champs conditionnels si localisation = Chambre */}
              {watch('location')?.toLowerCase() === 'chambre' && (
                <div className="space-y-4 border-l-4 border-indigo-500 pl-4 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-r-lg">
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Sélectionner une chambre
                  </p>

                  <div>
                    <Label htmlFor="roomNumber">Chambre</Label>
                    <RoomAutocomplete
                      value={watch('roomNumber') || ''}
                      onChange={(room) => {
                        if (room) {
                          setValue('roomNumber', room.number);
                          setValue('floor', room.floor);
                          setValue('building', room.building || '');
                        } else {
                          setValue('roomNumber', '');
                          setValue('floor', undefined);
                          setValue('building', '');
                        }
                      }}
                      placeholder="Rechercher ou créer une chambre..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      L'étage et le bâtiment seront remplis automatiquement
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="floor">Étage</Label>
                      <Input
                        type="number"
                        value={watch('floor') ?? ''}
                        placeholder="Auto-rempli"
                        disabled
                        className="bg-gray-100 dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <Label htmlFor="building">Bâtiment</Label>
                      <Input
                        value={watch('building') || ''}
                        placeholder="Auto-rempli"
                        disabled
                        className="bg-gray-100 dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Photos (optionnel)</h3>
              <FileUpload
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple
                maxFiles={10}
                maxSize={10}
              />
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
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
