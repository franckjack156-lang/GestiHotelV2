/**
 * InterventionForm Component
 *
 * Formulaire de création/édition d'intervention
 */

import { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2 } from 'lucide-react';
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
import {
  InterventionType,
  InterventionCategory,
  InterventionPriority,
  INTERVENTION_TYPE_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
} from '@/shared/types/status.types';
import { DynamicListSelect } from '@/shared/components/forms/DynamicListSelect';
import { useInterventionForm } from '../../hooks/useInterventionForm';
import { useInterventionActions } from '../../hooks/useInterventionActions';
import type { CreateInterventionData } from '../../types/intervention.types';

interface InterventionFormProps {
  initialData?: Partial<CreateInterventionData>;
  interventionId?: string;
  mode?: 'create' | 'edit';
  onSuccess?: (interventionId: string) => void;
  onCancel?: () => void;
}

const InterventionFormComponent = ({
  initialData,
  interventionId,
  mode = 'create',
  onSuccess,
  onCancel,
}: InterventionFormProps) => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, errors, isValid } =
    useInterventionForm(initialData);

  const { createIntervention, updateIntervention, isCreating, isUpdating, actionError } =
    useInterventionActions();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const isLoading = isCreating || isUpdating;

  // Gérer l'upload de fichiers - memoized
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      if (files.length + selectedFiles.length > 5) {
        alert('Vous ne pouvez pas uploader plus de 5 photos');
        return;
      }

      // Générer les aperçus
      const newPreviews = files.map(file => URL.createObjectURL(file));

      setSelectedFiles([...selectedFiles, ...files]);
      setFilePreviews([...filePreviews, ...newPreviews]);
      setValue('photos', [...selectedFiles, ...files]);
    },
    [selectedFiles, filePreviews, setValue]
  );

  // Supprimer un fichier - memoized
  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      const newPreviews = filePreviews.filter((_, i) => i !== index);

      // Révoquer l'URL de l'aperçu
      URL.revokeObjectURL(filePreviews[index]);

      setSelectedFiles(newFiles);
      setFilePreviews(newPreviews);
      setValue('photos', newFiles);
    },
    [selectedFiles, filePreviews, setValue]
  );

  // Soumettre le formulaire - memoized
  const onSubmit = useCallback(
    async (data: any) => {
      try {
        if (mode === 'create') {
          const id = await createIntervention(data);
          if (id) {
            onSuccess?.(id);
            navigate(`/interventions/${id}`);
          }
        } else if (mode === 'edit' && interventionId) {
          const success = await updateIntervention(interventionId, data);
          if (success) {
            onSuccess?.(interventionId);
            navigate(`/interventions/${interventionId}`);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
      }
    },
    [mode, interventionId, createIntervention, updateIntervention, onSuccess, navigate]
  );

  const handleCancelClick = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  }, [onCancel, navigate]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Erreur globale */}
      {actionError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
        </div>
      )}

      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Fuite d'eau dans la salle de bain"
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail..."
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Type et Catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('type')}
                onValueChange={value => setValue('type', value as InterventionType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(InterventionType).map(type => (
                    <SelectItem key={type} value={type}>
                      {INTERVENTION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Catégorie <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('category')}
                onValueChange={value => setValue('category', value as InterventionCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(InterventionCategory).map(category => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
            </div>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              Priorité <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('priority')}
              onValueChange={value => {
                setValue('priority', value as InterventionPriority);
                // Auto-cocher "urgent" si priorité urgente ou critique
                if (value === 'urgent' || value === 'critical') {
                  setValue('isUrgent', true);
                }
              }}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Sélectionner une priorité" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(InterventionPriority).map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-sm text-red-600">{errors.priority.message}</p>}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isUrgent"
                checked={watch('isUrgent')}
                onCheckedChange={checked => setValue('isUrgent', checked as boolean)}
              />
              <Label htmlFor="isUrgent" className="font-normal cursor-pointer">
                Marquer comme urgente
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBlocking"
                checked={watch('isBlocking')}
                onCheckedChange={checked => setValue('isBlocking', checked as boolean)}
              />
              <Label htmlFor="isBlocking" className="font-normal cursor-pointer">
                Bloque la chambre/zone
              </Label>
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
          {/* Lieu */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Lieu
            </Label>
            <Input
              id="location"
              placeholder="Ex: Salle de bain principale"
              {...register('location')}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
          </div>

          {/* Numéro de chambre, Étage, Bâtiment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Numéro de chambre</Label>
              <Input id="roomNumber" placeholder="Ex: 205" {...register('roomNumber')} />
              {errors.roomNumber && (
                <p className="text-sm text-red-600">{errors.roomNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Étage</Label>
              <DynamicListSelect
                listKey="floors"
                value={watch('floor')?.toString() || ''}
                onChange={(value: string) => setValue('floor', value ? parseInt(value) : undefined)}
                placeholder="Sélectionner un étage"
                allowEmpty
              />
              {errors.floor && <p className="text-sm text-red-600">{errors.floor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="building">Bâtiment</Label>
              <DynamicListSelect
                listKey="buildings"
                value={watch('building') || ''}
                onChange={(value: string) => setValue('building', value || undefined)}
                placeholder="Sélectionner un bâtiment"
                allowEmpty
              />
              {errors.building && <p className="text-sm text-red-600">{errors.building.message}</p>}
            </div>
          </div>

          {/* Avertissement si aucune localisation */}
          {!watch('location') && !watch('roomNumber') && !watch('floor') && !watch('building') && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Aucune information de localisation fournie. Il est recommandé de renseigner au moins un champ pour situer l'intervention.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zone d'upload */}
          <div>
            <input
              type="file"
              id="photos"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={selectedFiles.length >= 5}
            />
            <Label
              htmlFor="photos"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                selectedFiles.length >= 5
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Cliquez pour uploader</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG ou WEBP (max. 5 photos de 5MB chacune)
                </p>
              </div>
            </Label>
          </div>

          {/* Aperçus */}
          {filePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Aperçu ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes internes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes internes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="internalNotes"
            placeholder="Notes visibles uniquement par l'équipe..."
            rows={3}
            {...register('internalNotes')}
          />
          {errors.internalNotes && (
            <p className="text-sm text-red-600 mt-2">{errors.internalNotes.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading || !isValid}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? "Créer l'intervention" : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
};

InterventionFormComponent.displayName = 'InterventionForm';

export const InterventionForm = memo(InterventionFormComponent);
