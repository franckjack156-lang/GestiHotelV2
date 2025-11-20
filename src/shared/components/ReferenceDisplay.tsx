/**
 * ============================================================================
 * REFERENCE DISPLAY COMPONENT
 * ============================================================================
 *
 * Composant pour afficher une valeur de référence avec son label depuis la liste
 * Met à jour automatiquement l'affichage quand le label change dans la liste
 */

import React from 'react';
import { useReferenceLabel } from '../hooks/useReferenceLabel';
import type { ListKey } from '../types/reference-lists.types';

interface ReferenceDisplayProps {
  /** Clé de la liste de référence */
  listKey: ListKey;
  /** Valeur technique stockée */
  value: string | undefined;
  /** Texte à afficher si pas de valeur */
  fallback?: string;
  /** Classe CSS optionnelle */
  className?: string;
}

/**
 * Affiche le label d'une valeur de référence
 *
 * @example
 * <ReferenceDisplay listKey="buildings" value="sud" />
 * // Affiche "Tour Sud" si c'est le label de "sud"
 *
 * <ReferenceDisplay listKey="buildings" value="sud" fallback="-" />
 * // Affiche "-" si value est undefined
 */
export const ReferenceDisplay: React.FC<ReferenceDisplayProps> = ({
  listKey,
  value,
  fallback = '-',
  className,
}) => {
  const label = useReferenceLabel(listKey, value);

  if (!value) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{label}</span>;
};
