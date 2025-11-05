/**
 * CreateInterventionPage
 *
 * Page de création d'une nouvelle intervention
 * - Formulaire avec validation (React Hook Form + Zod)
 * - Upload photos
 * - Sélection assignation
 *
 * Destination: src/pages/interventions/CreateInterventionPage.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import {
  INTERVENTION_TYPE_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  type InterventionType,
  type InterventionCategory,
  type InterventionPriority,
} from '@/shared/types/status.types';

// Schéma de validation
const interventionSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  type: z.string().min(1, 'Le type est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  priority: z.string().min(1, 'La priorité est requise'),
  location: z.string().min(1, 'La localisation est requise'),
  roomNumber: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  isUrgent: z.boolean().default(false),
  isBlocking: z.boolean().default(false),
  internalNotes: z.string().optional(),
});

type InterventionFormData = z.infer<typeof interventionSchema>;

export const CreateInterventionPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { createIntervention, isCreating } = useInterventionActions(establishmentId || '');

  const [photos, setPhotos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InterventionFormData>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      isUrgent: false,
      isBlocking: false,
    },
  });

  // Gérer l'upload de photos
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Soumettre le formulaire
  const onSubmit = async (data: InterventionFormData) => {
    if (!establishmentId) {
      alert('Aucun établissement sélectionné');
      return;
    }

    try {
      const interventionData = {
        title: data.title,
        description: data.description,
        type: data.type as InterventionType,
        category: data.category as InterventionCategory,
        priority: data.priority as InterventionPriority,
        location: data.location,
        roomNumber: data.roomNumber,
        floor: data.floor ? parseInt(data.floor) : undefined,
        building: data.building,
        isUrgent: data.isUrgent,
        isBlocking: data.isBlocking,
        internalNotes: data.internalNotes,
        photos,
      };

      const interventionId = await createIntervention(interventionData);

      if (interventionId) {
        navigate(`/app/interventions/${interventionId}`);
      }
    } catch (error) {
      console.error('Erreur création:', error);
    }
  };

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Aucun établissement sélectionné</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/interventions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nouvelle intervention
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Créez une nouvelle demande d'intervention
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Titre */}
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" {...register('title')} placeholder="Ex: Fuite d'eau chambre 205" />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Décrivez le problème en détail..."
                rows={4}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Type, Catégorie, Priorité */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select onValueChange={value => setValue('type', value)} defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTERVENTION_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
              </div>

              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select onValueChange={value => setValue('category', value)} defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priorité *</Label>
                <Select onValueChange={value => setValue('priority', value)} defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
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
              <Input
                id="location"
                {...register('location')}
                placeholder="Ex: 2ème étage, couloir principal"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="roomNumber">Numéro de chambre</Label>
                <Input id="roomNumber" {...register('roomNumber')} placeholder="205" />
              </div>

              <div>
                <Label htmlFor="floor">Étage</Label>
                <Input id="floor" type="number" {...register('floor')} placeholder="2" />
              </div>

              <div>
                <Label htmlFor="building">Bâtiment</Label>
                <Input id="building" {...register('building')} placeholder="A" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="photos">Ajouter des photos</Label>
              <div className="mt-2">
                <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-indigo-500">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Cliquez pour sélectionner des photos
                    </p>
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG jusqu'à 5MB</p>
                  </div>
                  <input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
              </div>
            </div>

            {/* Preview photos */}
            {photos.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => handlePhotoRemove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isUrgent"
                checked={watch('isUrgent')}
                onCheckedChange={checked => setValue('isUrgent', !!checked)}
              />
              <Label htmlFor="isUrgent" className="font-normal">
                Intervention urgente
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBlocking"
                checked={watch('isBlocking')}
                onCheckedChange={checked => setValue('isBlocking', !!checked)}
              />
              <Label htmlFor="isBlocking" className="font-normal">
                Bloque la chambre
              </Label>
            </div>

            <div>
              <Label htmlFor="internalNotes">Notes internes</Label>
              <Textarea
                id="internalNotes"
                {...register('internalNotes')}
                placeholder="Notes visibles uniquement par l'équipe..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/app/interventions')}>
            Annuler
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Création...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Créer l'intervention
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
