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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  // Upload, // TODO: Imported but unused
  X,
  // Save, // TODO: Imported but unused
  Wand2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert } from '@/shared/components/ui/alert';
import { FileUpload } from '@/shared/components/ui-extended';
import { DynamicListSelect } from '@/shared/components/forms/DynamicListSelect';
import { TechnicianSelect } from '@/features/users/components';
import { RoomAutocomplete } from '@/features/rooms/components';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { useLocalStorage } from '@/shared/hooks/utilityHooks';
import { useFeature } from '@/features/establishments/hooks/useFeature';
import { toast } from 'sonner';
import type { CreateInterventionData } from '@/features/interventions/types/intervention.types';
import {
  INTERVENTION_TYPE_LABELS,
  PRIORITY_LABELS,
  type InterventionType,
  type InterventionCategory,
  type InterventionPriority,
} from '@/shared/types/status.types';
import { QRCodeScanner } from '@/features/qrcode/components';
import type { RoomQRCodeData } from '@/features/qrcode/services/qrcodeService';
import { useTemplates } from '@/features/templates/hooks/useTemplates';
import { TemplateSelectDialog } from '@/features/templates/components';
import type { InterventionTemplate } from '@/features/templates/types/template.types';

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
  location: z.string().optional(), // Localisation facultative
  roomNumber: z.string().optional(),
  floor: z.coerce.number().optional(),
  building: z.string().optional(),
  estimatedDuration: z.coerce.number().optional(),
  internalNotes: z.string().optional(),
  scheduledAt: z.date().optional(), // Date/heure de planification
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
  const { hasFeature } = useFeature();
  const {
    templates,
    isLoading: isLoadingTemplates,
    incrementUsage,
  } = useTemplates(establishmentId);

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

  // Form - initialiser avec priorité normale par défaut (utiliser la valeur anglaise, pas le label)
  const form = useForm<FormData>({
    resolver: zodResolver(interventionSchema) as unknown,
    defaultValues: {
      priority: 'normal',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  /**
   * Handler pour le scan de QR code
   */
  const handleQRCodeScan = (qrData: RoomQRCodeData) => {
    // Auto-remplir le champ localisation avec "chambre"
    setValue('location', 'chambre');

    // Auto-remplir le numéro de chambre
    setValue('roomNumber', qrData.roomNumber);

    // Note: floor et building seront auto-remplis par le RoomAutocomplete
    // lors de la sélection de la chambre

    toast.success(`Chambre ${qrData.roomNumber} détectée`, {
      description: 'Les champs ont été remplis automatiquement',
    });
  };

  /**
   * Handler pour utiliser un template
   */
  const handleUseTemplate = async (template: InterventionTemplate) => {
    // Pré-remplir le formulaire avec les données du template
    setValue('title', template.templateData.title);
    if (template.templateData.description) {
      setValue('description', template.templateData.description);
    }
    if (template.templateData.type) {
      setValue('type', template.templateData.type);
    }
    if (template.templateData.priority) {
      setValue('priority', template.templateData.priority);
    }
    if (template.templateData.category) {
      setValue('category', template.templateData.category);
    }
    if (template.templateData.estimatedDuration) {
      setValue('estimatedDuration', template.templateData.estimatedDuration);
    }

    // Incrémenter le compteur d'utilisation
    await incrementUsage(template.id);

    toast.success(`Modèle "${template.name}" appliqué`, {
      description: 'Les champs ont été pré-remplis',
    });
  };

  // Charger la date planifiée depuis l'URL si présente
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const scheduledAtParam = searchParams.get('scheduledAt');

    if (scheduledAtParam) {
      try {
        const scheduledDate = new Date(decodeURIComponent(scheduledAtParam));
        // Vérifier que la date est valide
        if (!isNaN(scheduledDate.getTime())) {
          // Utiliser setTimeout pour s'assurer que le setValue se fait après le reset du formulaire
          setTimeout(() => {
            setValue('scheduledAt', scheduledDate);
          }, 100);
        }
      } catch {
        // Ignorer les erreurs de parsing de date
      }
    }
  }, [location.search, setValue]);

  // Réinitialiser le formulaire quand on navigue vers la page
  useEffect(() => {
    // Valeurs par défaut à appliquer (utiliser la valeur anglaise, pas le label)
    const defaultValues = { priority: 'normal' };

    // Vérifier si le brouillon a été explicitement supprimé
    const wasDraftCleared = window.localStorage.getItem('intervention-draft-cleared') === 'true';

    if (wasDraftCleared) {
      // Le brouillon a été supprimé: ne rien charger et retirer le flag
      window.localStorage.removeItem('intervention-draft-cleared');
      form.reset(defaultValues);
      setSelectedFiles([]);
      setFilePreviews([]);
      setCurrentStep(1);
      setMode(null);
      return;
    }

    if (isFirstMount.current) {
      // Premier montage: charger le brouillon s'il existe, sinon valeurs par défaut
      isFirstMount.current = false;
      if (Object.keys(draft).length > 0) {
        form.reset({ ...defaultValues, ...draft });
      } else {
        form.reset(defaultValues);
      }
    } else {
      // Navigation suivante: toujours réinitialiser complètement
      form.reset(defaultValues);
      setSelectedFiles([]);
      setFilePreviews([]);
      setCurrentStep(1);
      setMode(null);

      // Charger le brouillon si présent après reset
      if (Object.keys(draft).length > 0) {
        setTimeout(() => {
          form.reset({ ...defaultValues, ...draft });
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
      // Mapper assignedTo (tableau du formulaire) vers assignedToIds (attendu par le service)
      const { assignedTo, ...restData } = data;

      // Construire les données de l'intervention
      const interventionData: CreateInterventionData = {
        ...restData,
        type: data.type as InterventionType,
        category: data.category as InterventionCategory,
        priority: data.priority as InterventionPriority,
        ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
        ...(hasFeature('photos') && selectedFiles.length > 0 && { photos: selectedFiles }),
      } as unknown;

      // Ajouter explicitement assignedToIds si des techniciens sont sélectionnés
      if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
        interventionData.assignedToIds = assignedTo;
      }

      const id = await createIntervention(interventionData);

      if (id) {
        toast.success('Intervention créée avec succès');

        // Supprimer complètement le brouillon du localStorage
        window.localStorage.removeItem('intervention-draft');

        // IMPORTANT: Mettre à jour l'état du hook useLocalStorage aussi
        setDraft({});

        // Réinitialiser le formulaire et tous les états
        form.reset({});
        setSelectedFiles([]);
        setFilePreviews([]);
        setCurrentStep(1);

        navigate(`/app/interventions/${id}`);
      }
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  // Navigation wizard
  const maxStep = hasFeature('photos') ? 4 : 3;

  const nextStep = () => {
    let nextStepNum = currentStep + 1;

    // Sauter l'étape Photos (3) si la feature n'est pas activée
    if (!hasFeature('photos') && nextStepNum === 3) {
      nextStepNum = 4; // Passer directement au récapitulatif
    }

    if (currentStep < maxStep) {
      setCurrentStep(nextStepNum as WizardStep);
    }
  };

  const previousStep = () => {
    let prevStepNum = currentStep - 1;

    // Sauter l'étape Photos (3) si la feature n'est pas activée
    if (!hasFeature('photos') && currentStep === 4 && prevStepNum === 3) {
      prevStepNum = 2; // Revenir à la localisation
    }

    if (prevStepNum >= 1) {
      setCurrentStep(prevStepNum as WizardStep);
    }
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
    // Supprimer complètement le brouillon du localStorage
    window.localStorage.removeItem('intervention-draft');

    // IMPORTANT: Mettre à jour l'état du hook useLocalStorage aussi
    setDraft({});

    // Marquer explicitement que le brouillon a été supprimé
    window.localStorage.setItem('intervention-draft-cleared', 'true');

    // Réinitialiser le formulaire et tous les états
    form.reset({});
    setSelectedFiles([]);
    setFilePreviews([]);
    setCurrentStep(1);
    setMode(null);

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
                    Un brouillon d'intervention a été sauvegardé. Voulez-vous continuer ou
                    recommencer ?
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
    // Construire les étapes dynamiquement selon les features activées
    const steps = [
      { number: 1, title: 'Informations' },
      { number: 2, title: 'Localisation' },
      ...(hasFeature('photos') ? [{ number: 3, title: 'Photos' }] : []),
      { number: hasFeature('photos') ? 4 : 3, title: 'Récapitulatif' },
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
            <form onSubmit={handleSubmit(onSubmit as unknown)}>
              {/* Step 1: Informations */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Informations de base</h2>
                    {hasFeature('interventionTemplates') && (
                      <>
                        {templates.length > 0 ? (
                          <TemplateSelectDialog
                            templates={templates}
                            onSelect={handleUseTemplate}
                            isLoading={isLoadingTemplates}
                            trigger={
                              <Button variant="default" type="button" size="sm">
                                <Wand2 className="mr-2 h-4 w-4" />
                                Utiliser un modèle ({templates.length})
                              </Button>
                            }
                          />
                        ) : (
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            onClick={() => {
                              toast.info('Créez votre premier modèle', {
                                description:
                                  'Allez dans Modèles pour créer des modèles réutilisables',
                              });
                            }}
                          >
                            <Wand2 className="mr-2 h-4 w-4" />
                            Aucun modèle disponible
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input {...register('title')} placeholder="Ex: Fuite d'eau chambre 301" />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      {...register('description')}
                      placeholder="Décrivez le problème en détail"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="assignedTo">Technicien(s) assigné(s)</Label>
                    <TechnicianSelect
                      value={watch('assignedTo') || []}
                      onChange={value => setValue('assignedTo', value as string[])}
                      multiple={true}
                      placeholder="Sélectionner un ou plusieurs techniciens"
                      showSkills={true}
                      showAvatars={true}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
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
                      <Label htmlFor="category">Catégorie</Label>
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
                      <Label htmlFor="priority">Priorité</Label>
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
                      onChange={value => setValue('location', value)}
                      placeholder="Sélectionner une localisation"
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
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          Sélectionner une chambre
                        </p>
                        {hasFeature('roomsQRCode') && <QRCodeScanner onScan={handleQRCodeScan} />}
                      </div>

                      <div>
                        <Label htmlFor="roomNumber">Chambre</Label>
                        <RoomAutocomplete
                          value={watch('roomNumber') || ''}
                          onChange={room => {
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
                          {hasFeature('roomsQRCode')
                            ? "Scannez le QR code ou recherchez manuellement. L'étage et le bâtiment seront remplis automatiquement"
                            : "L'étage et le bâtiment seront remplis automatiquement"}
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
              {hasFeature('photos') && currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Photos</h2>

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

              {/* Step 4 (ou 3 si photos désactivées): Récapitulatif */}
              {(currentStep === 4 || (!hasFeature('photos') && currentStep === 3)) && (
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
                    {hasFeature('photos') && filePreviews.length > 0 && (
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

                {currentStep < maxStep ? (
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
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header avec bouton retour */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Changer de mode
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Nouvelle intervention
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Formulaire de création rapide
            </p>
          </div>
        </div>

        {/* Bouton modèle */}
        {hasFeature('interventionTemplates') && templates.length > 0 && (
          <TemplateSelectDialog
            templates={templates}
            onSelect={handleUseTemplate}
            isLoading={isLoadingTemplates}
            trigger={
              <Button variant="outline" type="button" size="sm" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Modèles ({templates.length})
              </Button>
            }
          />
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit as unknown)} className="space-y-6">
        {/* Titre principal - Hero Card */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="title"
                  className="text-base font-semibold text-gray-900 dark:text-gray-100"
                >
                  Titre de l'intervention *
                </Label>
                <Input
                  {...register('title')}
                  placeholder="Ex: Fuite d'eau chambre 301"
                  className="mt-2 text-lg h-12 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description détaillée
                </Label>
                <Textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Décrivez le problème rencontré, les circonstances, les impacts..."
                  className="mt-2 resize-none border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout 2 colonnes pour Assignation et Classification */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Assignation */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                Assignation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div>
                <Label htmlFor="assignedTo" className="text-sm">
                  Technicien(s)
                </Label>
                <TechnicianSelect
                  value={watch('assignedTo') || []}
                  onChange={value => setValue('assignedTo', value as string[])}
                  multiple={true}
                  placeholder="Sélectionner un ou plusieurs techniciens"
                  showSkills={true}
                  showAvatars={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <span className="text-lg">🏷️</span>
                </div>
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label className="text-sm">Type</Label>
                <DynamicListSelect
                  listKey="interventionTypes"
                  value={watch('type') || ''}
                  onChange={value => setValue('type', value)}
                  placeholder="Type d'intervention"
                  showIcons
                  showColors
                />
              </div>
              <div>
                <Label className="text-sm">Catégorie</Label>
                <DynamicListSelect
                  listKey="interventionCategories"
                  value={watch('category') || ''}
                  onChange={value => setValue('category', value)}
                  placeholder="Catégorie"
                  showIcons
                  showColors
                />
              </div>
              <div>
                <Label className="text-sm">Priorité</Label>
                <DynamicListSelect
                  listKey="interventionPriorities"
                  value={watch('priority') || ''}
                  onChange={value => setValue('priority', value)}
                  placeholder="Niveau de priorité"
                  showIcons
                  showColors
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Localisation - Card avec icône */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <span className="text-lg">📍</span>
              </div>
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Zone</Label>
                <DynamicListSelect
                  listKey="interventionLocations"
                  value={watch('location') || ''}
                  onChange={value => setValue('location', value)}
                  placeholder="Type de zone"
                  allowEmpty
                />
              </div>
              <div>
                <Label className="text-sm">Étage</Label>
                <DynamicListSelect
                  listKey="floors"
                  value={watch('floor')?.toString() || ''}
                  onChange={value => setValue('floor', value ? parseInt(value) : undefined)}
                  placeholder="Étage"
                  allowEmpty
                />
              </div>
              <div>
                <Label className="text-sm">Bâtiment</Label>
                <DynamicListSelect
                  listKey="buildings"
                  value={watch('building') || ''}
                  onChange={value => setValue('building', value || undefined)}
                  placeholder="Bâtiment"
                  allowEmpty
                />
              </div>
            </div>

            {/* Chambre - Conditionnelle */}
            {watch('location')?.toLowerCase() === 'chambre' && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <Label
                  htmlFor="roomNumber"
                  className="text-sm font-medium text-indigo-900 dark:text-indigo-100"
                >
                  Numéro de chambre
                </Label>
                <RoomAutocomplete
                  value={watch('roomNumber') || ''}
                  onChange={room => {
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
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  L'étage et le bâtiment seront remplis automatiquement
                </p>
              </div>
            )}

            {/* Avertissement localisation */}
            {!watch('location') && !watch('floor') && !watch('building') && (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Localisation recommandée
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Précisez au moins une information de localisation pour faciliter l'intervention
                  </p>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Photos - Card moderne */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-r from-pink-50/50 to-transparent dark:from-pink-950/20">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
                <span className="text-lg">📸</span>
              </div>
              Photos & Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <FileUpload
              onFilesSelected={handleFilesSelected}
              accept="image/*"
              multiple
              maxFiles={10}
              maxSize={10}
            />
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white font-medium">Photo {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions - Sticky bottom bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 -mx-6 -mb-6 px-6 py-4 mt-8 flex justify-between items-center shadow-lg">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/app/interventions')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isCreating}
            size="lg"
            className="gap-2 min-w-[180px] shadow-md hover:shadow-lg transition-shadow"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Créer l'intervention
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateInterventionPage;
