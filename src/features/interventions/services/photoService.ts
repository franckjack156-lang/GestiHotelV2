/**
 * Photo Service
 * 
 * Service pour gérer l'upload et la suppression de photos dans Firebase Storage
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from 'firebase/storage';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { storage, db } from '@/core/config/firebase';
import type { Photo } from '@/shared/types/common.types';

/**
 * Taille maximale des photos (5 MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Types MIME autorisés
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Valider un fichier photo
 */
const validatePhoto = (file: File): void => {
  // Vérifier le type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Format de fichier non supporté. Utilisez JPG, PNG ou WebP.');
  }
  
  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Le fichier est trop volumineux. Maximum 5 MB.');
  }
};

/**
 * Générer un nom de fichier unique
 */
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
};

/**
 * Uploader une photo
 */
export const uploadPhoto = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  file: File
): Promise<Photo> => {
  try {
    // Valider le fichier
    validatePhoto(file);
    
    // Générer le chemin de stockage
    const fileName = generateFileName(file.name);
    const storagePath = `establishments/${establishmentId}/interventions/${interventionId}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload du fichier
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
        interventionId: interventionId,
      },
    });
    
    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Créer l'objet Photo
    const photo: Photo = {
      id: fileName,
      name: file.name,
      url: downloadURL,
      path: storagePath,
      size: file.size,
      mimeType: file.type,
      uploadedAt: Timestamp.now(),
      uploadedBy: userId,
    };
    
    // Mettre à jour le document intervention dans Firestore
    const interventionRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId
    );
    
    await updateDoc(interventionRef, {
      photos: arrayUnion(photo),
      photosCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    return photo;
  } catch (error: any) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    throw new Error(error.message || 'Impossible d\'uploader la photo');
  }
};

/**
 * Uploader plusieurs photos
 */
export const uploadPhotos = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  files: File[]
): Promise<Photo[]> => {
  try {
    const uploadPromises = files.map(file =>
      uploadPhoto(establishmentId, interventionId, userId, file)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Erreur lors de l\'upload des photos:', error);
    throw new Error('Impossible d\'uploader toutes les photos');
  }
};

/**
 * Supprimer une photo
 */
export const deletePhoto = async (
  establishmentId: string,
  interventionId: string,
  photo: Photo
): Promise<void> => {
  try {
    // Supprimer du Storage
    const storageRef = ref(storage, photo.path);
    await deleteObject(storageRef);
    
    // Mettre à jour le document intervention dans Firestore
    const interventionRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId
    );
    
    await updateDoc(interventionRef, {
      photos: arrayRemove(photo),
      photosCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    throw new Error('Impossible de supprimer la photo');
  }
};

/**
 * Supprimer toutes les photos d'une intervention
 */
export const deleteAllPhotos = async (
  establishmentId: string,
  interventionId: string,
  photos: Photo[]
): Promise<void> => {
  try {
    const deletePromises = photos.map(photo =>
      deletePhoto(establishmentId, interventionId, photo)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Erreur lors de la suppression des photos:', error);
    throw new Error('Impossible de supprimer toutes les photos');
  }
};

/**
 * Obtenir les métadonnées d'une photo
 */
export const getPhotoMetadata = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    return await getMetadata(storageRef);
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error);
    throw new Error('Impossible de récupérer les métadonnées de la photo');
  }
};

/**
 * Compresser une image (optionnel, pour optimisation future)
 */
export const compressImage = async (file: File, maxWidth: number = 1920): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionner si nécessaire
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Impossible de compresser l\'image'));
            }
          },
          file.type,
          0.85 // Qualité de compression
        );
      };
      
      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    };
    
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
  });
};

export default {
  uploadPhoto,
  uploadPhotos,
  deletePhoto,
  deleteAllPhotos,
  getPhotoMetadata,
  compressImage,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
};
