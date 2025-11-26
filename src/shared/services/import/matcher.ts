/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * ============================================================================
 * IMPORT SERVICE - MATCHER
 * ============================================================================
 *
 * Algorithmes de matching pour utilisateurs et listes de référence
 */

import type {
  UserMatchSuggestion,
  ReferenceMatchSuggestion,
  UserInfo,
  ReferenceItem,
} from './types';

/**
 * Vérifie si une valeur existe dans une liste (insensible à la casse)
 */
export const existsInList = (value: string, list: string[]): boolean => {
  const normalizedValue = value.trim().toLowerCase();
  return list.some(item => item.toLowerCase() === normalizedValue);
};

/**
 * Trouve les correspondances partielles pour un nom dans la liste d'utilisateurs
 */
export const findUserMatches = (
  excelName: string,
  users: UserInfo[],
  filterTechnician: boolean = false
): UserMatchSuggestion[] => {
  const searchName = excelName.trim().toLowerCase();
  const suggestions: UserMatchSuggestion[] = [];

  const filteredUsers = filterTechnician ? users.filter(u => u.isTechnician === true) : users;

  for (const user of filteredUsers) {
    const fullName = user.displayName.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();

    let matchScore = 0;
    let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

    // 1. Correspondance exacte (100%)
    if (fullName === searchName) {
      matchScore = 1.0;
      matchType = 'exact';
    }
    // 2. Correspondance exacte prénom ou nom (90%)
    else if (firstName === searchName || lastName === searchName) {
      matchScore = 0.9;
      matchType = 'partial';
    }
    // 3. Nom complet commence par le texte recherché (80%)
    else if (fullName.startsWith(searchName)) {
      matchScore = 0.8;
      matchType = 'partial';
    }
    // 4. Prénom commence par le texte recherché (75%)
    else if (firstName.startsWith(searchName)) {
      matchScore = 0.75;
      matchType = 'partial';
    }
    // 5. Nom commence par le texte recherché (70%)
    else if (lastName.startsWith(searchName)) {
      matchScore = 0.7;
      matchType = 'partial';
    }
    // 6. Nom complet contient le texte recherché (60%)
    else if (fullName.includes(searchName)) {
      matchScore = 0.6;
      matchType = 'fuzzy';
    }
    // 7. Similarité par mots (50-40%)
    else {
      const searchWords = searchName.split(/\s+/);
      const nameWords = fullName.split(/\s+/);

      let matchingWords = 0;
      for (const searchWord of searchWords) {
        if (
          nameWords.some(nameWord => nameWord.includes(searchWord) || searchWord.includes(nameWord))
        ) {
          matchingWords++;
        }
      }

      if (matchingWords > 0) {
        matchScore = 0.4 + (matchingWords / searchWords.length) * 0.1;
        matchType = 'fuzzy';
      }
    }

    // Ajouter seulement si score >= 70%
    if (matchScore >= 0.7) {
      suggestions.push({
        excelName,
        userId: user.id,
        userName: user.displayName,
        matchScore,
        matchType,
      });
    }
  }

  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Trouve les correspondances partielles pour une valeur dans une liste de référence
 */
export const findReferenceMatches = (
  excelValue: string,
  referenceList: ReferenceItem[]
): ReferenceMatchSuggestion[] => {
  const searchValue = excelValue.trim().toLowerCase();
  const suggestions: ReferenceMatchSuggestion[] = [];

  const activeItems = referenceList.filter(item => item.isActive);

  for (const item of activeItems) {
    const itemValue = item.value.toLowerCase();
    const itemLabel = item.label.toLowerCase();

    let matchScore = 0;
    let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

    // 1. Correspondance exacte sur le value (100%)
    if (itemValue === searchValue) {
      matchScore = 1.0;
      matchType = 'exact';
    }
    // 2. Correspondance exacte sur le label (100%)
    else if (itemLabel === searchValue) {
      matchScore = 1.0;
      matchType = 'exact';
    }
    // 3. Value commence par la valeur recherchée (85%)
    else if (itemValue.startsWith(searchValue)) {
      matchScore = 0.85;
      matchType = 'partial';
    }
    // 4. Label commence par la valeur recherchée (85%)
    else if (itemLabel.startsWith(searchValue)) {
      matchScore = 0.85;
      matchType = 'partial';
    }
    // 5. Value contient la valeur recherchée (75%)
    else if (itemValue.includes(searchValue)) {
      matchScore = 0.75;
      matchType = 'partial';
    }
    // 6. Label contient la valeur recherchée (75%)
    else if (itemLabel.includes(searchValue)) {
      matchScore = 0.75;
      matchType = 'partial';
    }
    // 7. Correspondance par mots (70-50%)
    else {
      const searchWords = searchValue.split(/\s+/);
      const labelWords = itemLabel.split(/\s+/);
      const valueWords = itemValue.split(/[_\s]+/);

      let matchingWords = 0;
      for (const searchWord of searchWords) {
        if (
          labelWords.some(w => w.includes(searchWord) || searchWord.includes(w)) ||
          valueWords.some(w => w.includes(searchWord) || searchWord.includes(w))
        ) {
          matchingWords++;
        }
      }

      if (matchingWords > 0) {
        matchScore = 0.5 + (matchingWords / searchWords.length) * 0.2;
        matchType = 'fuzzy';
      }
    }

    // Ajouter seulement si score >= 70%
    if (matchScore >= 0.7) {
      suggestions.push({
        excelValue,
        referenceValue: item.value,
        referenceLabel: item.label,
        matchScore,
        matchType,
      });
    }
  }

  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
};
