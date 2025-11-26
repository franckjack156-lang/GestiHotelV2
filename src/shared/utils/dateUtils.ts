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
export const isTimestamp = (value: unknown): value is Timestamp => {
  return Boolean(
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
  );
};

/**
 * Formate une date au format local (ex: "15/01/2024")
 */
export const formatDate = (date: Date | Timestamp | undefined | null): string => {
  const d = toDate(date);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

/**
 * Formate une heure au format local (ex: "10:30")
 */
export const formatTime = (date: Date | Timestamp | undefined | null): string => {
  const d = toDate(date);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};
