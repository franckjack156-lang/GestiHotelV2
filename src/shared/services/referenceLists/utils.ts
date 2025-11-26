/**
 * ============================================================================
 * REFERENCE LISTS - UTILS
 * ============================================================================
 *
 * Fonctions utilitaires pour les listes de référence
 */

/**
 * Nettoyer un objet de toutes ses propriétés undefined
 * Firestore n'accepte pas les valeurs undefined
 */
export const removeUndefined = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined) as T;
  if (typeof obj !== 'object') return obj;

  const cleaned: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = removeUndefined(obj[key]);
    }
  }
  return cleaned as T;
};
