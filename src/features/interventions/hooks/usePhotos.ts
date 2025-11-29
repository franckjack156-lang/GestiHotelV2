/**
 * Hook pour gérer les photos d'une intervention
 */

import { useState, useEffect } from 'react';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  subscribeToPhotos,
  uploadPhoto,
  deletePhoto,
  updatePhotoCaption,
} from '../services/photosService';
import type { Photo, PhotoCategory, UploadPhotoData } from '../types/subcollections.types';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

export const usePhotos = (interventionId: string) => {
  const { establishmentId } = useCurrentEstablishment();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // S'abonner aux photos en temps réel
  useEffect(() => {
    if (!establishmentId || !interventionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToPhotos(
      establishmentId,
      interventionId,
      data => {
        setPhotos(data);
        setIsLoading(false);
        setError(null);
      },
      err => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [establishmentId, interventionId]);

  /**
   * Obtenir photos par catégorie
   */
  const getPhotosByCategory = (category: PhotoCategory): Photo[] => {
    return photos.filter(p => p.category === category);
  };

  /**
   * Upload une photo
   */
  const upload = async (data: UploadPhotoData): Promise<boolean> => {
    if (!establishmentId || !user) {
      toast.error("Impossible d'uploader la photo");
      return false;
    }

    setIsUploading(true);
    try {
      await uploadPhoto(
        establishmentId,
        interventionId,
        user.id,
        user.displayName || user.email || 'Utilisateur',
        data,
        user.role
      );
      toast.success('Photo ajoutée');
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'upload");
      logger.error(error);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Upload plusieurs photos
   */
  const uploadMultiple = async (files: File[], category: PhotoCategory): Promise<number> => {
    let successCount = 0;

    setIsUploading(true);
    try {
      for (const file of files) {
        const success = await upload({ file, category });
        if (success) successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} photo(s) ajoutée(s)`);
      }
    } finally {
      setIsUploading(false);
    }

    return successCount;
  };

  /**
   * Supprimer une photo
   */
  const remove = async (photoId: string): Promise<boolean> => {
    if (!establishmentId) {
      toast.error('Impossible de supprimer la photo');
      return false;
    }

    const photo = photos.find(p => p.id === photoId);
    if (!photo) {
      toast.error('Photo introuvable');
      return false;
    }

    try {
      await deletePhoto(establishmentId, interventionId, photoId, photo.url, photo.thumbnailUrl);
      toast.success('Photo supprimée');
      return true;
    } catch (error: unknown) {
      toast.error('Erreur lors de la suppression');
      logger.error(error);
      return false;
    }
  };

  /**
   * Mettre à jour la légende
   */
  const updateCaption = async (photoId: string, caption: string): Promise<boolean> => {
    if (!establishmentId) {
      toast.error('Impossible de mettre à jour la légende');
      return false;
    }

    try {
      await updatePhotoCaption(establishmentId, interventionId, photoId, caption);
      toast.success('Légende mise à jour');
      return true;
    } catch (error: unknown) {
      toast.error('Erreur lors de la mise à jour');
      logger.error(error);
      return false;
    }
  };

  return {
    photos,
    isLoading,
    error,
    isUploading,
    getPhotosByCategory,
    upload,
    uploadMultiple,
    remove,
    updateCaption,
  };
};
