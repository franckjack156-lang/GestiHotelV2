/**
 * Date utilities
 * Helpers pour gérer les dates et timestamps
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Convertit un Timestamp ou Date en Date
 */
export const toDate = (timestamp: Timestamp | Date | undefined | null): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date();
};

/**
 * Vérifie si une valeur est un Timestamp Firestore
 */
export const isTimestamp = (value: any): value is Timestamp => {
  return (
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
  );
};
