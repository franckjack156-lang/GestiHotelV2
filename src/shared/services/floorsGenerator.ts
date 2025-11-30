/**
 * ============================================================================
 * FLOORS GENERATOR SERVICE
 * ============================================================================
 *
 * Service pour générer automatiquement les étages d'un établissement
 */

import type { ReferenceItem } from '@/shared/types/reference-lists.types';

export interface FloorGenerationOptions {
  /** Nombre d'étages (sans compter le RDC) */
  totalFloors: number;

  /** Inclure les sous-sols */
  includeBasements?: boolean;

  /** Nombre de sous-sols */
  basementCount?: number;

  /** Inclure le rez-de-chaussée */
  includeGroundFloor?: boolean;

  /** Label du rez-de-chaussée */
  groundFloorLabel?: string;

  /** Préfixe pour les étages (ex: "Étage", vide pour juste le numéro) */
  prefix?: string;

  /** Format de numérotation */
  format?: 'numeric' | 'ordinal'; // "1" ou "1er"
}

/**
 * Génère les items pour la liste des étages
 */
export const generateFloors = (options: FloorGenerationOptions): ReferenceItem[] => {
  const {
    totalFloors,
    includeBasements = false,
    basementCount = 0,
    includeGroundFloor = true,
    groundFloorLabel = 'Rez-de-chaussée',
    prefix = '',
    format = 'numeric',
  } = options;

  const floors: ReferenceItem[] = [];
  let order = 0;

  // Sous-sols (de -N à -1)
  if (includeBasements && basementCount > 0) {
    for (let i = -basementCount; i < 0; i++) {
      const absValue = Math.abs(i);
      floors.push({
        id: `floor_${i}_${Date.now()}`,
        value: i.toString(),
        label: prefix
          ? `${prefix} -${absValue}`
          : `Sous-sol ${absValue > 1 ? absValue : ''}`.trim(),
        order: order++,
        isActive: true,
        color: 'gray',
        icon: 'ArrowDown',
        createdAt: new Date(),
        usageCount: 0,
      });
    }
  }

  // Rez-de-chaussée (0)
  if (includeGroundFloor) {
    floors.push({
      id: `floor_0_${Date.now()}`,
      value: '0',
      label: groundFloorLabel,
      order: order++,
      isActive: true,
      color: 'blue',
      icon: 'Home',
      createdAt: new Date(),
      usageCount: 0,
    });
  }

  // Étages (de 1 à N)
  for (let i = 1; i <= totalFloors; i++) {
    const label =
      format === 'ordinal' && i === 1
        ? `${prefix ? `${prefix} ` : ''}1er`.trim()
        : prefix
          ? `${prefix} ${i}`
          : i.toString();

    floors.push({
      id: `floor_${i}_${Date.now()}`,
      value: i.toString(),
      label,
      order: order++,
      isActive: true,
      color: 'indigo',
      icon: 'Building',
      createdAt: new Date(),
      usageCount: 0,
    });
  }

  return floors;
};

/**
 * Génère des suggestions de configuration basées sur le type d'établissement
 */
export const getFloorSuggestions = (_establishmentType: string, totalFloors?: number) => {
  const suggestions: FloorGenerationOptions[] = [];

  // Hôtel classique
  if (totalFloors && totalFloors > 0) {
    suggestions.push({
      totalFloors,
      includeBasements: false,
      includeGroundFloor: true,
      groundFloorLabel: 'Rez-de-chaussée',
      prefix: '',
      format: 'numeric',
    });

    // Avec sous-sol(s)
    if (totalFloors >= 3) {
      suggestions.push({
        totalFloors,
        includeBasements: true,
        basementCount: 1,
        includeGroundFloor: true,
        groundFloorLabel: 'Rez-de-chaussée',
        prefix: '',
        format: 'numeric',
      });
    }
  }

  return suggestions;
};
