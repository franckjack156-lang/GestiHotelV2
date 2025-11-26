/**
 * EditInterventionPage
 *
 * Page d'édition d'une intervention existante
 * - Formulaire prérempli
 * - Upload/suppression photos
 * - Mise à jour
 *
 * Destination: src/pages/interventions/EditInterventionPage.tsx
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
// TODO: Checkbox imported but unused
// import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { DynamicListSelect } from '@/shared/components/forms/DynamicListSelect';
import { TechnicianSelect } from '@/features/users/components';
import { RoomAutocomplete } from '@/features/rooms/components';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { getIntervention } from '@/features/interventions/services/interventionService';
import {
  // INTERVENTION_TYPE_LABELS, // TODO: Imported but unused
  // CATEGORY_LABELS, // TODO: Imported but unused
  // PRIORITY_LABELS, // TODO: Imported but unused
  type InterventionType,
  type InterventionCategory,
  type InterventionPriority,
} from '@/shared/types/status.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import { logger } from '@/core/utils/logger';

// Schéma de validation
const interventionSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  location: z.string().min(1, 'La localisation est requise'),
  roomNumber: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  assignedTo: z.array(z.string()).optional(),
  internalNotes: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

type InterventionFormData = z.infer<typeof interventionSchema>;

export const EditInterventionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { updateIntervention, isUpdating } = useInterventionActions();

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InterventionFormData>({
    resolver: zodResolver(interventionSchema),
  });

  // Charger l'intervention
  useEffect(() => {
    if (!establishmentId || !id) return;

    const loadIntervention = async () => {
      try {
        setIsLoading(true);
        const data = await getIntervention(establishmentId, id);

        if (!data) {
          toast.error('Intervention introuvable');
          navigate('/interventions');
          return;
        }

        setIntervention(data);

        // Préremplir le formulaire
        reset({
          title: data.title,
          description: data.description,
          type: data.type,
          category: data.category,
          priority: data.priority,
          location: data.location,
          roomNumber: data.roomNumber || '',
          floor: data.floor?.toString() || '',
          building: data.building || '',
          assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [],
          internalNotes: data.internalNotes || '',
          resolutionNotes: data.resolutionNotes || '',
        });
      } catch (err: any) {
        logger.error('Erreur chargement:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadIntervention();
  }, [establishmentId, id, reset]);

  // Gérer l'upload de nouvelles photos
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewPhotos(prev => [...prev, ...files]);
  };

  const handleNewPhotoRemove = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Soumettre le formulaire
  const onSubmit = async (data: InterventionFormData) => {
    if (!establishmentId || !id) return;

    try {
      const updateData = {
        title: data.title,
        description: data.description,
        type: data.type as InterventionType,
        category: data.category as InterventionCategory,
        priority: data.priority as InterventionPriority,
        location: data.location,
        roomNumber: data.roomNumber,
        floor: data.floor ? parseInt(data.floor) : undefined,
        building: data.building,
        assignedTo: data.assignedTo,
        internalNotes: data.internalNotes,
        resolutionNotes: data.resolutionNotes,
      };

      const success = await updateIntervention(id, updateData as any);

      if (success) {
        navigate(`/app/interventions/${id}`);
      }
    } catch (error) {
      logger.error('Erreur mise à jour:', error);
    }
  };

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Aucun établissement sélectionné</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Intervention introuvable</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/app/interventions/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Modifier l'intervention
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{intervention.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" {...register('description')} rows={4} />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Lieu *</Label>
              <DynamicListSelect
                listKey="interventionLocations"
                value={watch('location') || ''}
                onChange={value => setValue('location', value)}
                placeholder="Sélectionner une localisation"
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>

            {/* Champs conditionnels si localisation = Chambre */}
            {watch('location')?.toLowerCase() === 'chambre' && (
              <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Informations sur la chambre</p>

                <div>
                  <Label htmlFor="roomNumber">Numéro de chambre *</Label>
                  <RoomAutocomplete
                    value={watch('roomNumber') || ''}
                    onChange={room => {
                      if (room) {
                        setValue('roomNumber', room.number);
                        setValue('floor', room.floor.toString());
                        setValue('building', room.building || '');
                      } else {
                        setValue('roomNumber', '');
                        setValue('floor', '');
                        setValue('building', '');
                      }
                    }}
                    placeholder="Rechercher par numéro de chambre..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="floor">Étage</Label>
                    <Input
                      {...register('floor')}
                      placeholder="Auto-rempli"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="building">Bâtiment</Label>
                    <Input
                      {...register('building')}
                      placeholder="Auto-rempli"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignation */}
        <Card>
          <CardHeader>
            <CardTitle>Assignation</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="assignedTo">Assigner à des techniciens</Label>
              <TechnicianSelect
                value={watch('assignedTo') || []}
                onChange={value => setValue('assignedTo', value as string[])}
                multiple={true}
                placeholder="Sélectionner un ou plusieurs techniciens"
                showSkills={true}
                showAvatars={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                Vous pouvez assigner l'intervention à un ou plusieurs techniciens
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Photos existantes */}
        {intervention.photos && intervention.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Photos existantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {intervention.photos.map((photo, index) => (
                  <img
                    key={photo.id || index}
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="h-32 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nouvelles photos */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter des photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-indigo-500">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Cliquez pour ajouter des photos</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </label>
            </div>

            {newPhotos.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {newPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Nouvelle photo ${index + 1}`}
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => handleNewPhotoRemove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="internalNotes">Notes internes</Label>
              <Textarea id="internalNotes" {...register('internalNotes')} rows={3} />
            </div>

            <div>
              <Label htmlFor="resolutionNotes">Notes de résolution</Label>
              <Textarea id="resolutionNotes" {...register('resolutionNotes')} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/app/interventions/${id}`)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
