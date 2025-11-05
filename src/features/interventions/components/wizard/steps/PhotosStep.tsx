/**
 * PhotosStep Component
 * 
 * Étape 5 : Upload de photos avec compression automatique
 */

import { useState, useCallback } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { WizardData } from '../../../hooks/useInterventionWizard';

interface PhotosStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 5;
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const PhotosStep = ({ data, onUpdate }: PhotosStepProps) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof WizardData, value: any) => {
    onUpdate({ [field]: value });
  };

  /**
   * Valider un fichier
   */
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Le fichier est trop volumineux. Maximum 5 MB par photo.';
    }
    return null;
  };

  /**
   * Gérer la sélection de fichiers
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const currentPhotos = data.photos || [];

      // Vérifier le nombre total
      if (currentPhotos.length + files.length > MAX_PHOTOS) {
        setError(`Vous ne pouvez pas uploader plus de ${MAX_PHOTOS} photos au total`);
        return;
      }

      // Valider chaque fichier
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }

        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      // Mettre à jour
      handleChange('photos', [...currentPhotos, ...validFiles]);
      setPreviews([...previews, ...newPreviews]);
      setError(null);

      // Réinitialiser l'input
      e.target.value = '';
    },
    [data.photos, previews, handleChange]
  );

  /**
   * Supprimer une photo
   */
  const handleRemovePhoto = (index: number) => {
    const currentPhotos = data.photos || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    // Révoquer l'URL de l'aperçu
    URL.revokeObjectURL(previews[index]);

    handleChange('photos', newPhotos);
    setPreviews(newPreviews);
    setError(null);
  };

  /**
   * Gérer le drag & drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const currentPhotos = data.photos || [];

      if (currentPhotos.length + files.length > MAX_PHOTOS) {
        setError(`Vous ne pouvez pas uploader plus de ${MAX_PHOTOS} photos au total`);
        return;
      }

      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }

        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      handleChange('photos', [...currentPhotos, ...validFiles]);
      setPreviews([...previews, ...newPreviews]);
      setError(null);
    },
    [data.photos, previews, handleChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const currentPhotos = data.photos || [];
  const canAddMore = currentPhotos.length < MAX_PHOTOS;

  return (
    <div className="space-y-6">
      {/* Zone d'upload */}
      <div className="space-y-2">
        <Label>Photos (optionnel)</Label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`relative ${!canAddMore && 'opacity-50 cursor-not-allowed'}`}
        >
          <input
            type="file"
            id="photos"
            accept={ACCEPTED_FORMATS.join(',')}
            multiple
            onChange={handleFileChange}
            disabled={!canAddMore}
            className="hidden"
          />
          <Label
            htmlFor="photos"
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              canAddMore
                ? 'border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                : 'border-gray-200 bg-gray-100 cursor-not-allowed dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, WEBP (max. 5MB par photo)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum {MAX_PHOTOS} photos
              </p>
            </div>
          </Label>
        </div>

        {/* Compteur */}
        <p className="text-xs text-gray-500">
          {currentPhotos.length} / {MAX_PHOTOS} photos ajoutées
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Aperçus des photos */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <Label>Aperçu des photos ({previews.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={preview}
                  alt={`Aperçu ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePhoto(index)}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
                {currentPhotos[index] && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {(currentPhotos[index].size / 1024).toFixed(0)} KB
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aide */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Conseils pour les photos
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Prenez des photos claires et bien éclairées</li>
          <li>• Montrez le problème sous différents angles</li>
          <li>• Maximum 5 photos de 5 MB chacune</li>
          <li>• Les photos seront compressées automatiquement</li>
          <li>• Formats acceptés : JPG, PNG, WebP</li>
        </ul>
      </div>

      {/* Récapitulatif */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          📸 Récapitulatif des photos
        </h4>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {currentPhotos.length > 0 ? (
            <>
              <p className="mb-2">
                <span className="font-medium">{currentPhotos.length}</span> photo
                {currentPhotos.length > 1 ? 's' : ''} ajoutée
                {currentPhotos.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">
                Taille totale:{' '}
                {(
                  currentPhotos.reduce((acc, photo) => acc + photo.size, 0) /
                  1024 /
                  1024
                ).toFixed(2)}{' '}
                MB
              </p>
            </>
          ) : (
            <p className="text-gray-500">Aucune photo ajoutée</p>
          )}
        </div>
      </div>
    </div>
  );
};
