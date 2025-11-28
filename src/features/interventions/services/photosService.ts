/**
 * ============================================================================
 * PHOTOS SERVICE
 * ============================================================================
 *
 * Gestion des photos d'interventions avec Firebase Storage
 */

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/core/config/firebase';
import type { Photo, PhotoCategory, UploadPhotoData } from '../types/subcollections.types';
import { logPhotoAdded } from './historyService';

/**
 * Obtenir la référence de la collection photos
 */
const getPhotosCollection = (establishmentId: string, interventionId: string) => {
  return collection(
    db,
    'establishments',
    establishmentId,
    'interventions',
    interventionId,
    'photos'
  );
};

/**
 * Générer un nom de fichier unique
 */
const generateFileName = (
  interventionId: string,
  category: PhotoCategory,
  originalName: string
): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `interventions/${interventionId}/${category}/${timestamp}.${extension}`;
};

/**
 * Compresser une image (pour thumbnail)
 */
const compressImage = async (file: File, maxWidth: number = 300): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) resolve(blob);
            else reject(new Error('Erreur compression'));
          },
          'image/jpeg',
          0.7
        );
      };
    };
    reader.onerror = reject;
  });
};

/**
 * Upload une photo
 */
export const uploadPhoto = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  data: UploadPhotoData,
  userRole?: string
): Promise<string> => {
  try {
    const { file, category, caption } = data;

    // Vérifications
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('La taille du fichier ne doit pas dépasser 10MB');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    // Upload fichier principal
    const fileName = generateFileName(interventionId, category, file.name);
    const storageRef = ref(storage, fileName);
    const uploadResult = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(uploadResult.ref);

    // Créer thumbnail
    let thumbnailUrl: string | undefined;
    try {
      const thumbnail = await compressImage(file);
      const thumbnailName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '_thumb.$1');
      const thumbnailRef = ref(storage, thumbnailName);
      const thumbnailResult = await uploadBytes(thumbnailRef, thumbnail);
      thumbnailUrl = await getDownloadURL(thumbnailResult.ref);
    } catch (error) {
      logger.warn('⚠️ Impossible de créer le thumbnail:', error);
    }

    // Métadonnées
    const metadata = {
      size: file.size,
      type: file.type,
    };

    // Créer document Firestore
    const collectionRef = getPhotosCollection(establishmentId, interventionId);
    const photoData = {
      interventionId,
      url,
      thumbnailUrl,
      category,
      caption: caption || null,
      uploadedBy: userId,
      uploadedByName: userName,
      metadata,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, photoData);

    // Mettre à jour le compteur de photos dans l'intervention
    const interventionRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId
    );
    await updateDoc(interventionRef, {
      photosCount: (await getPhotosCount(establishmentId, interventionId)) + 1,
      updatedAt: serverTimestamp(),
    });

    // Logger dans l'historique
    try {
      await logPhotoAdded(establishmentId, interventionId, userId, userName, userRole, category);
    } catch (error) {
      logger.warn('⚠️ Erreur logging historique photo:', error);
    }

    return docRef.id;
  } catch (error) {
    logger.error('❌ Erreur upload photo:', error);
    throw error;
  }
};

/**
 * Supprimer une photo
 */
export const deletePhoto = async (
  establishmentId: string,
  interventionId: string,
  photoId: string,
  photoUrl: string,
  thumbnailUrl?: string
): Promise<void> => {
  try {
    // Supprimer de Storage
    try {
      const storageRef = ref(storage, photoUrl);
      await deleteObject(storageRef);

      if (thumbnailUrl) {
        const thumbnailRef = ref(storage, thumbnailUrl);
        await deleteObject(thumbnailRef);
      }
    } catch (error) {
      logger.warn('⚠️ Erreur suppression fichier Storage:', error);
    }

    // Supprimer de Firestore
    const docRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId,
      'photos',
      photoId
    );
    await deleteDoc(docRef);

    // Mettre à jour le compteur
    const interventionRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId
    );
    await updateDoc(interventionRef, {
      photosCount: Math.max(0, (await getPhotosCount(establishmentId, interventionId)) - 1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('❌ Erreur suppression photo:', error);
    throw new Error('Impossible de supprimer la photo');
  }
};

/**
 * Obtenir le nombre de photos
 */
const getPhotosCount = async (establishmentId: string, interventionId: string): Promise<number> => {
  const interventionRef = doc(
    db,
    'establishments',
    establishmentId,
    'interventions',
    interventionId
  );
  const interventionSnap = await getDoc(interventionRef);
  return interventionSnap.exists() ? interventionSnap.data()?.photosCount || 0 : 0;
};

/**
 * S'abonner aux photos en temps réel
 */
export const subscribeToPhotos = (
  establishmentId: string,
  interventionId: string,
  onSuccess: (photos: Photo[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const collectionRef = getPhotosCollection(establishmentId, interventionId);

    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const photos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Photo[];

        onSuccess(photos);
      },
      error => {
        logger.error('❌ Erreur subscription photos:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    logger.error('❌ Erreur création subscription:', error);
    onError(error as Error);
    return () => {};
  }
};

/**
 * Mettre à jour la légende d'une photo
 */
export const updatePhotoCaption = async (
  establishmentId: string,
  interventionId: string,
  photoId: string,
  caption: string
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId,
      'photos',
      photoId
    );

    await updateDoc(docRef, {
      caption,
    });
  } catch (error) {
    logger.error('❌ Erreur mise à jour légende:', error);
    throw new Error('Impossible de mettre à jour la légende');
  }
};

// Import manquant
import { getDoc } from 'firebase/firestore';
import { logger } from '@/core/utils/logger';

export default {
  uploadPhoto,
  deletePhoto,
  subscribeToPhotos,
  updatePhotoCaption,
};
