/**
 * ============================================================================
 * STORAGE SERVICE - Upload de fichiers vers Firebase Storage
 * ============================================================================
 *
 * Service pour uploader des fichiers (photos de profil, documents, etc.)
 * vers Firebase Storage
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type StorageReference,
} from 'firebase/storage';
import { storage } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

// =============================================================================
// TYPES
// =============================================================================

/** Interface pour les erreurs Firebase Storage */
interface StorageError extends Error {
  code?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

export interface UploadOptions {
  /** Taille maximale en bytes (défaut: 5MB) */
  maxSize?: number;
  /** Types MIME autorisés */
  allowedTypes?: string[];
  /** Redimensionner l'image (largeur max) */
  maxWidth?: number;
  /** Redimensionner l'image (hauteur max) */
  maxHeight?: number;
  /** Qualité de compression (0-1, défaut: 0.8) */
  quality?: number;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const PROFILE_PHOTO_MAX_SIZE = 256; // Taille max pour les photos de profil
const LOGO_MAX_SIZE = 512; // Taille max pour les logos carrés d'établissement
const LOGO_WIDE_MAX_WIDTH = 800; // Largeur max pour les logos rectangulaires
const LOGO_WIDE_MAX_HEIGHT = 200; // Hauteur max pour les logos rectangulaires

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Génère un nom de fichier unique
 */
const generateFileName = (originalName: string, userId: string): string => {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  return `${userId}_${timestamp}.${extension}`;
};

/**
 * Redimensionne une image
 */
const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculer les nouvelles dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx?.drawImage(img, 0, 0, width, height);

      // Convertir en blob
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Erreur lors de la conversion de l'image"));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Erreur lors du chargement de l'image"));
    };

    // Charger l'image depuis le fichier
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convertit un blob en File
 */
const blobToFile = (blob: Blob, fileName: string, mimeType: string): File => {
  return new File([blob], fileName, { type: mimeType });
};

// =============================================================================
// STORAGE SERVICE
// =============================================================================

class StorageService {
  /**
   * Upload une photo de profil utilisateur
   */
  async uploadProfilePhoto(
    userId: string,
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const maxSize = options?.maxSize || DEFAULT_MAX_SIZE;
    const allowedTypes = options?.allowedTypes || DEFAULT_ALLOWED_TYPES;
    const maxWidth = options?.maxWidth || PROFILE_PHOTO_MAX_SIZE;
    const maxHeight = options?.maxHeight || PROFILE_PHOTO_MAX_SIZE;
    const quality = options?.quality || 0.8;

    // Validation du type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
    }

    // Validation de la taille (avant redimensionnement)
    if (file.size > maxSize * 2) {
      throw new Error(
        `Fichier trop volumineux. Taille max: ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    try {
      // Redimensionner l'image
      const resizedBlob = await resizeImage(file, maxWidth, maxHeight, quality);

      // Vérifier la taille après redimensionnement
      if (resizedBlob.size > maxSize) {
        throw new Error(
          `Fichier trop volumineux après compression. Taille max: ${Math.round(maxSize / 1024 / 1024)}MB`
        );
      }

      const fileName = generateFileName(file.name, userId);
      // Chemin selon les règles Storage: /users/{userId}/profile/{photoId}
      const path = `users/${userId}/profile/${fileName}`;
      const storageRef: StorageReference = ref(storage, path);

      // Convertir blob en file pour l'upload
      const resizedFile = blobToFile(resizedBlob, fileName, file.type);

      // Uploader
      await uploadBytes(storageRef, resizedFile, {
        contentType: file.type,
        customMetadata: {
          userId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Obtenir l'URL de téléchargement
      const url = await getDownloadURL(storageRef);

      logger.info('Photo de profil uploadée avec succès', { userId, path });

      return {
        url,
        path,
        fileName,
      };
    } catch (error) {
      logger.error("Erreur lors de l'upload de la photo de profil", { userId, error });
      throw error;
    }
  }

  /**
   * Supprimer une photo de profil
   */
  async deleteProfilePhoto(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      logger.info('Photo de profil supprimée', { path });
    } catch (error) {
      // Ignorer l'erreur si le fichier n'existe pas
      const storageError = error as StorageError;
      if (storageError.code === 'storage/object-not-found') {
        logger.warn('Photo de profil déjà supprimée ou inexistante', { path });
        return;
      }
      logger.error('Erreur lors de la suppression de la photo de profil', { path, error });
      throw error;
    }
  }

  /**
   * Upload un logo d'établissement
   */
  async uploadEstablishmentLogo(
    establishmentId: string,
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const maxSize = options?.maxSize || DEFAULT_MAX_SIZE;
    const allowedTypes = options?.allowedTypes || DEFAULT_ALLOWED_TYPES;
    const maxWidth = options?.maxWidth || LOGO_MAX_SIZE;
    const maxHeight = options?.maxHeight || LOGO_MAX_SIZE;
    const quality = options?.quality || 0.9;

    // Validation du type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
    }

    // Validation de la taille (avant redimensionnement)
    if (file.size > maxSize * 2) {
      throw new Error(
        `Fichier trop volumineux. Taille max: ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    try {
      // Redimensionner l'image
      const resizedBlob = await resizeImage(file, maxWidth, maxHeight, quality);

      // Vérifier la taille après redimensionnement
      if (resizedBlob.size > maxSize) {
        throw new Error(
          `Fichier trop volumineux après compression. Taille max: ${Math.round(maxSize / 1024 / 1024)}MB`
        );
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const timestamp = Date.now();
      const fileName = `logo_${timestamp}.${extension}`;
      const path = `establishments/${establishmentId}/logo/${fileName}`;
      const storageRef: StorageReference = ref(storage, path);

      // Convertir blob en file pour l'upload
      const resizedFile = blobToFile(resizedBlob, fileName, file.type);

      // Uploader
      await uploadBytes(storageRef, resizedFile, {
        contentType: file.type,
        customMetadata: {
          establishmentId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Obtenir l'URL de téléchargement
      const url = await getDownloadURL(storageRef);

      logger.info("Logo d'établissement uploadé avec succès", { establishmentId, path });

      return {
        url,
        path,
        fileName,
      };
    } catch (error) {
      logger.error("Erreur lors de l'upload du logo", { establishmentId, error });
      throw error;
    }
  }

  /**
   * Supprimer un logo d'établissement
   */
  async deleteEstablishmentLogo(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      logger.info("Logo d'établissement supprimé", { path });
    } catch (error) {
      const storageError = error as StorageError;
      if (storageError.code === 'storage/object-not-found') {
        logger.warn('Logo déjà supprimé ou inexistant', { path });
        return;
      }
      logger.error('Erreur lors de la suppression du logo', { path, error });
      throw error;
    }
  }

  /**
   * Upload un logo rectangulaire/horizontal d'établissement (pour sidebar)
   */
  async uploadEstablishmentLogoWide(
    establishmentId: string,
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const maxSize = options?.maxSize || DEFAULT_MAX_SIZE;
    const allowedTypes = options?.allowedTypes || DEFAULT_ALLOWED_TYPES;
    const maxWidth = options?.maxWidth || LOGO_WIDE_MAX_WIDTH;
    const maxHeight = options?.maxHeight || LOGO_WIDE_MAX_HEIGHT;
    const quality = options?.quality || 0.9;

    // Validation du type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
    }

    // Validation de la taille (avant redimensionnement)
    if (file.size > maxSize * 2) {
      throw new Error(
        `Fichier trop volumineux. Taille max: ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    try {
      // Redimensionner l'image
      const resizedBlob = await resizeImage(file, maxWidth, maxHeight, quality);

      // Vérifier la taille après redimensionnement
      if (resizedBlob.size > maxSize) {
        throw new Error(
          `Fichier trop volumineux après compression. Taille max: ${Math.round(maxSize / 1024 / 1024)}MB`
        );
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const timestamp = Date.now();
      const fileName = `logo_wide_${timestamp}.${extension}`;
      const path = `establishments/${establishmentId}/logo/${fileName}`;
      const storageRef: StorageReference = ref(storage, path);

      // Convertir blob en file pour l'upload
      const resizedFile = blobToFile(resizedBlob, fileName, file.type);

      // Uploader
      await uploadBytes(storageRef, resizedFile, {
        contentType: file.type,
        customMetadata: {
          establishmentId,
          originalName: file.name,
          logoType: 'wide',
          uploadedAt: new Date().toISOString(),
        },
      });

      // Obtenir l'URL de téléchargement
      const url = await getDownloadURL(storageRef);

      logger.info("Logo rectangulaire d'établissement uploadé avec succès", {
        establishmentId,
        path,
      });

      return {
        url,
        path,
        fileName,
      };
    } catch (error) {
      logger.error("Erreur lors de l'upload du logo rectangulaire", { establishmentId, error });
      throw error;
    }
  }

  /**
   * Upload un fichier générique
   */
  async uploadFile(folder: string, file: File, options?: UploadOptions): Promise<UploadResult> {
    const maxSize = options?.maxSize || DEFAULT_MAX_SIZE;

    if (file.size > maxSize) {
      throw new Error(
        `Fichier trop volumineux. Taille max: ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const path = `${folder}/${fileName}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      const url = await getDownloadURL(storageRef);

      logger.info('Fichier uploadé avec succès', { path });

      return {
        url,
        path,
        fileName,
      };
    } catch (error) {
      logger.error("Erreur lors de l'upload du fichier", { folder, error });
      throw error;
    }
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

const storageService = new StorageService();
export default storageService;
