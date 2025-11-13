/**
 * ============================================================================
 * PHOTO SERVICE - COMPLET
 * ============================================================================
 *
 * Service pour gérer les photos des interventions
 * - Upload vers Firebase Storage
 * - Compression automatique
 * - Génération de miniatures
 * - Suppression
 * - URLs signées
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type StorageReference,
} from 'firebase/storage';
import { storage } from '@/core/config/firebase';
import type { Photo } from '@/shared/types/common.types';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

interface UploadPhotoOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

interface UploadResult {
  photo: Photo;
  thumbnailUrl?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: UploadPhotoOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  generateThumbnail: true,
  thumbnailSize: 200,
};

// ============================================================================
// COMPRESSION & RESIZE
// ============================================================================

/**
 * Compresser et redimensionner une image
 */
const compressImage = async (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculer les dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en Blob
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Générer une miniature
 */
const generateThumbnail = async (file: File, size: number): Promise<Blob> => {
  return compressImage(file, size, size, 0.8);
};

/**
 * Extraire les données EXIF (simplifié)
 */
const extractExifData = async (file: File): Promise<Record<string, any>> => {
  // Pour l'instant, on retourne juste les infos basiques
  // On pourrait utiliser une librairie comme exif-js pour plus de détails
  return {
    filename: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
  };
};

// ============================================================================
// UPLOAD
// ============================================================================

/**
 * Upload une photo vers Firebase Storage
 */
export const uploadPhoto = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  file: File,
  options: UploadPhotoOptions = {}
): Promise<UploadResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 1. Générer un ID unique pour la photo
    const photoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const extension = file.name.split('.').pop() || 'jpg';

    // 2. Compresser l'image principale
    console.log("🔵 Compression de l'image principale...");
    const compressedBlob = await compressImage(
      file,
      opts.maxWidth!,
      opts.maxHeight!,
      opts.quality!
    );

    // 3. Upload l'image principale
    console.log("🔵 Upload de l'image principale...");
    const mainPath = `establishments/${establishmentId}/interventions/${interventionId}/${photoId}.${extension}`;
    const mainRef = ref(storage, mainPath);
    await uploadBytes(mainRef, compressedBlob);
    const mainUrl = await getDownloadURL(mainRef);

    // 4. Générer et uploader la miniature si demandé
    let thumbnailUrl: string | undefined;
    if (opts.generateThumbnail) {
      console.log('🔵 Génération de la miniature...');
      const thumbnailBlob = await generateThumbnail(file, opts.thumbnailSize!);
      const thumbPath = `establishments/${establishmentId}/interventions/${interventionId}/thumbs/${photoId}_thumb.${extension}`;
      const thumbRef = ref(storage, thumbPath);
      await uploadBytes(thumbRef, thumbnailBlob);
      thumbnailUrl = await getDownloadURL(thumbRef);
    }

    // 5. Extraire les métadonnées EXIF
    const exifData = await extractExifData(file);

    // 6. Créer l'objet Photo
    const photo: Photo = {
      id: photoId,
      url: mainUrl,
      thumbnailUrl,
      filename: file.name,
      size: file.size,
      uploadedBy: userId,
      uploadedAt: Timestamp.now(),
      description: '',
      metadata: exifData,
    };

    console.log('✅ Photo uploadée avec succès:', photoId);
    return { photo, thumbnailUrl };
  } catch (error) {
    console.error('❌ Erreur upload photo:', error);
    throw new Error("Impossible d'uploader la photo");
  }
};

/**
 * Upload plusieurs photos en parallèle
 */
export const uploadPhotos = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  files: File[],
  options?: UploadPhotoOptions,
  onProgress?: (uploaded: number, total: number) => void
): Promise<Photo[]> => {
  const photos: Photo[] = [];
  let uploaded = 0;

  console.log(`🔵 Upload de ${files.length} photos...`);

  // Upload en parallèle (max 3 à la fois pour éviter de surcharger)
  const batchSize = 3;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(file =>
        uploadPhoto(establishmentId, interventionId, userId, file, options)
          .then(result => {
            uploaded++;
            onProgress?.(uploaded, files.length);
            return result.photo;
          })
          .catch(error => {
            console.error(`❌ Erreur upload ${file.name}:`, error);
            return null;
          })
      )
    );

    photos.push(...results.filter((p): p is Photo => p !== null));
  }

  console.log(`✅ ${photos.length}/${files.length} photos uploadées`);
  return photos;
};

// ============================================================================
// DELETE
// ============================================================================

/**
 * Supprimer une photo de Firebase Storage
 */
export const deletePhoto = async (
  establishmentId: string,
  interventionId: string,
  photo: Photo
): Promise<void> => {
  try {
    console.log('🔵 Suppression de la photo:', photo.id);

    // Supprimer l'image principale
    const mainPath = extractPathFromUrl(photo.url);
    if (mainPath) {
      const mainRef = ref(storage, mainPath);
      await deleteObject(mainRef);
    }

    // Supprimer la miniature si elle existe
    if (photo.thumbnailUrl) {
      const thumbPath = extractPathFromUrl(photo.thumbnailUrl);
      if (thumbPath) {
        const thumbRef = ref(storage, thumbPath);
        await deleteObject(thumbRef).catch(() => {
          // Ignorer si la miniature n'existe pas
        });
      }
    }

    console.log('✅ Photo supprimée');
  } catch (error) {
    console.error('❌ Erreur suppression photo:', error);
    throw new Error('Impossible de supprimer la photo');
  }
};

/**
 * Supprimer plusieurs photos
 */
export const deletePhotos = async (
  establishmentId: string,
  interventionId: string,
  photos: Photo[]
): Promise<void> => {
  console.log(`🔵 Suppression de ${photos.length} photos...`);

  await Promise.all(
    photos.map(photo =>
      deletePhoto(establishmentId, interventionId, photo).catch(error => {
        console.error(`❌ Erreur suppression ${photo.id}:`, error);
      })
    )
  );

  console.log('✅ Photos supprimées');
};

// ============================================================================
// UTILS
// ============================================================================

/**
 * Extraire le path depuis une URL Firebase Storage
 */
const extractPathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Obtenir l'URL d'une photo
 */
export const getPhotoUrl = async (
  establishmentId: string,
  interventionId: string,
  photoId: string
): Promise<string> => {
  const path = `establishments/${establishmentId}/interventions/${interventionId}/${photoId}`;
  const photoRef = ref(storage, path);
  return await getDownloadURL(photoRef);
};

/**
 * Vérifier si un fichier est une image valide
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
};

/**
 * Valider plusieurs fichiers
 */
export const validateImageFiles = (
  files: File[]
): {
  valid: File[];
  invalid: { file: File; reason: string }[];
} => {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];

  files.forEach(file => {
    if (!isValidImageFile(file)) {
      const reason =
        file.size > 10 * 1024 * 1024
          ? 'Fichier trop volumineux (max 10MB)'
          : 'Type de fichier invalide (JPEG, PNG, WebP uniquement)';
      invalid.push({ file, reason });
    } else {
      valid.push(file);
    }
  });

  return { valid, invalid };
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  uploadPhoto,
  uploadPhotos,
  deletePhoto,
  deletePhotos,
  getPhotoUrl,
  isValidImageFile,
  validateImageFiles,
};
