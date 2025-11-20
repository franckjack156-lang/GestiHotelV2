/**
 * ============================================================================
 * USE REFERENCE LABEL HOOK
 * ============================================================================
 *
 * Hook pour récupérer le label d'une valeur depuis une liste de référence
 * Permet l'affichage dynamique : modifier le label dans la liste met à jour
 * l'affichage partout automatiquement
 */

import { useMemo } from 'react';
import { useAllReferenceLists } from './useReferenceLists';
import type { ListKey } from '../types/reference-lists.types';

/**
 * Hook pour récupérer le label d'une valeur depuis une liste de référence
 *
 * @param listKey - Clé de la liste de référence
 * @param value - Valeur technique à rechercher
 * @returns Le label correspondant ou la valeur si non trouvée
 *
 * @example
 * const buildingLabel = useReferenceLabel('buildings', 'sud');
 * // Si "sud" a pour label "Tour Sud", retourne "Tour Sud"
 * // Sinon retourne "sud"
 */
export const useReferenceLabel = (
  listKey: ListKey | undefined,
  value: string | undefined
): string => {
  const { data } = useAllReferenceLists({ autoLoad: true });

  return useMemo(() => {
    // Si pas de valeur ou pas de liste, retourner la valeur brute
    if (!value || !listKey || !data?.lists?.[listKey]) {
      return value || '';
    }

    const list = data.lists[listKey];
    if (!list?.items) {
      return value;
    }

    // Chercher l'item correspondant à la valeur
    const item = list.items.find(item => item.value === value && item.isActive);

    // Retourner le label si trouvé, sinon la valeur brute
    return item?.label || value;
  }, [listKey, value, data]);
};

/**
 * Hook pour récupérer plusieurs labels en une fois
 *
 * @param listKey - Clé de la liste de référence
 * @param values - Tableau de valeurs à rechercher
 * @returns Map de value → label
 */
export const useReferenceLabels = (
  listKey: ListKey | undefined,
  values: string[]
): Map<string, string> => {
  const { data } = useAllReferenceLists({ autoLoad: true });

  return useMemo(() => {
    const result = new Map<string, string>();

    if (!listKey || !data?.lists?.[listKey]) {
      // Pas de liste : retourner les valeurs brutes
      values.forEach(value => result.set(value, value));
      return result;
    }

    const list = data.lists[listKey];
    if (!list?.items) {
      values.forEach(value => result.set(value, value));
      return result;
    }

    // Créer un index pour un accès rapide
    const itemsByValue = new Map(
      list.items.filter(item => item.isActive).map(item => [item.value, item.label])
    );

    // Mapper chaque valeur à son label
    values.forEach(value => {
      result.set(value, itemsByValue.get(value) || value);
    });

    return result;
  }, [listKey, values, data]);
};
