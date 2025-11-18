/**
 * ============================================================================
 * FIRESTORE UTILITIES
 * ============================================================================
 *
 * Utilitaires pour gérer les contraintes de Firestore
 */

/**
 * Nettoyer un objet en supprimant toutes les clés avec valeur undefined
 * (Firestore n'accepte pas undefined)
 *
 * @param obj - L'objet à nettoyer
 * @returns L'objet nettoyé sans valeurs undefined
 */
export const removeUndefinedFields = <T>(obj: T): T => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)).filter(item => item !== undefined) as T;
  }

  if (obj instanceof Date) {
    return obj;
  }

  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedFields(value);
    }
  }

  return cleaned as T;
};
