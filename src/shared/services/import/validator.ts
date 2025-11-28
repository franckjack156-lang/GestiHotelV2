/**
 * ============================================================================
 * IMPORT SERVICE - VALIDATOR
 * ============================================================================
 *
 * Détection des valeurs manquantes et génération de suggestions
 */

import type {
  MissingListValues,
  ImportMatchSuggestions,
  ExistingLists,
  ReferenceMatchSuggestion,
} from './types';
import type { InterventionImportRow } from './schemas';
import { existsInList, findUserMatches, findReferenceMatches } from './matcher';
import { normalizeStatus } from './parser';

/**
 * Détecte les valeurs qui n'existent pas dans les listes de référence
 * ET génère des suggestions de correspondance pour techniciens/créateurs
 */
export const detectMissingValues = (
  data: InterventionImportRow[],
  existingLists: ExistingLists
): { missing: MissingListValues; suggestions: ImportMatchSuggestions } => {
  const missing: MissingListValues = {
    types: new Set(),
    categories: new Set(),
    priorities: new Set(),
    locations: new Set(),
    statuses: new Set(),
    rooms: new Set(),
    floors: new Set(),
    buildings: new Set(),
    technicians: new Set(),
    creators: new Set(),
  };

  data.forEach(row => {
    // Vérifier TYPE
    if (row.type && row.type.trim() && !existsInList(row.type, existingLists.types)) {
      missing.types.add(row.type);
    }

    // Vérifier CATEGORIE
    if (
      row.categorie &&
      row.categorie.trim() &&
      !existsInList(row.categorie, existingLists.categories)
    ) {
      missing.categories.add(row.categorie);
    }

    // Vérifier PRIORITE
    if (
      row.priorite &&
      row.priorite.trim() &&
      !existsInList(row.priorite, existingLists.priorities)
    ) {
      missing.priorities.add(row.priorite);
    }

    // Vérifier LOCALISATION
    if (
      row.localisation &&
      row.localisation.trim() &&
      !existsInList(row.localisation, existingLists.locations)
    ) {
      missing.locations.add(row.localisation);
    }

    // Vérifier STATUT
    if (row.statut && row.statut.trim()) {
      const normalizedStatus = normalizeStatus(row.statut);
      if (!existsInList(normalizedStatus, existingLists.statuses)) {
        missing.statuses.add(row.statut);
      }
    }

    // Vérifier NUMERO DE CHAMBRE
    if (existingLists.rooms && row.numerochambre && row.numerochambre.trim()) {
      if (!existsInList(row.numerochambre, existingLists.rooms)) {
        missing.rooms.add(row.numerochambre);
      }
    }

    // Vérifier ETAGE
    if (existingLists.floors && row.etage && row.etage.trim()) {
      if (!existsInList(row.etage, existingLists.floors)) {
        missing.floors.add(row.etage);
      }
    }

    // Vérifier BATIMENT
    if (existingLists.buildings && row.batiment && row.batiment.trim()) {
      if (!existsInList(row.batiment, existingLists.buildings)) {
        missing.buildings.add(row.batiment);
      }
    }

    // Vérifier TECHNICIEN
    if (row.technicien && row.technicien.trim()) {
      const technicianName = row.technicien.trim().toLowerCase();

      const foundInUsers =
        existingLists.users?.some(user => user.displayName.toLowerCase() === technicianName) ||
        false;

      const foundInList = existingLists.technicians
        ? existsInList(row.technicien, existingLists.technicians)
        : false;

      if (!foundInUsers && !foundInList) {
        missing.technicians.add(row.technicien);
      }
    }

    // Vérifier CREATEUR
    if (row.createur && row.createur.trim()) {
      const creatorName = row.createur.trim().toLowerCase();

      const foundInUsers =
        existingLists.users?.some(user => user.displayName.toLowerCase() === creatorName) || false;

      const foundInList = existingLists.creators
        ? existsInList(row.createur, existingLists.creators)
        : false;

      if (!foundInUsers && !foundInList) {
        missing.creators.add(row.createur);
      }
    }
  });

  // Générer les suggestions de correspondance
  const suggestions: ImportMatchSuggestions = {
    technicians: new Map(),
    creators: new Map(),
    buildings: new Map(),
    locations: new Map(),
    floors: new Map(),
    types: new Map(),
    categories: new Map(),
    priorities: new Map(),
  };

  // Collecter tous les noms d'utilisateurs dans l'Excel
  const allTechniciansInExcel = new Set<string>();
  const allCreatorsInExcel = new Set<string>();

  data.forEach(row => {
    if (row.technicien && row.technicien.trim()) {
      allTechniciansInExcel.add(row.technicien.trim());
    }
    if (row.createur && row.createur.trim()) {
      allCreatorsInExcel.add(row.createur.trim());
    }
  });

  // Générer suggestions pour les techniciens
  if (existingLists.users && existingLists.users.length > 0) {
    allTechniciansInExcel.forEach(techName => {
      const matches = findUserMatches(techName, existingLists.users!, true);

      const hasExactMatch = matches.some(m => m.matchScore === 1.0);
      if (matches.length > 0 && !hasExactMatch) {
        suggestions.technicians.set(techName, matches);
        missing.technicians.add(techName);
      }
    });

    // Générer suggestions pour les créateurs
    allCreatorsInExcel.forEach(creatorName => {
      const matches = findUserMatches(creatorName, existingLists.users!, false);

      const hasExactMatch = matches.some(m => m.matchScore === 1.0);
      if (matches.length > 0 && !hasExactMatch) {
        suggestions.creators.set(creatorName, matches);
        missing.creators.add(creatorName);
      }
    });
  }

  // Collecter toutes les valeurs présentes dans l'Excel
  const allValuesInExcel = {
    buildings: new Set<string>(),
    locations: new Set<string>(),
    floors: new Set<string>(),
    types: new Set<string>(),
    categories: new Set<string>(),
    priorities: new Set<string>(),
  };

  data.forEach(row => {
    if (row.batiment && row.batiment.trim()) allValuesInExcel.buildings.add(row.batiment.trim());
    if (row.localisation && row.localisation.trim())
      allValuesInExcel.locations.add(row.localisation.trim());
    if (row.etage && row.etage.trim()) allValuesInExcel.floors.add(row.etage.trim());
    if (row.type && row.type.trim()) allValuesInExcel.types.add(row.type.trim());
    if (row.categorie && row.categorie.trim())
      allValuesInExcel.categories.add(row.categorie.trim());
    if (row.priorite && row.priorite.trim()) allValuesInExcel.priorities.add(row.priorite.trim());
  });

  // Générer les suggestions pour chaque liste de référence
  const generateReferenceSuggestions = (
    excelValues: Set<string>,
    referenceList: typeof existingLists.buildingsList,
    suggestionsMap: Map<string, ReferenceMatchSuggestion[]>
  ) => {
    if (!referenceList || referenceList.length === 0) return;

    excelValues.forEach(excelValue => {
      const matches = findReferenceMatches(excelValue, referenceList);

      const needsMapping = matches.some(m => m.referenceValue !== excelValue);

      if (matches.length > 0 && needsMapping) {
        suggestionsMap.set(excelValue, matches);
      }
    });
  };

  generateReferenceSuggestions(
    allValuesInExcel.buildings,
    existingLists.buildingsList,
    suggestions.buildings
  );
  generateReferenceSuggestions(
    allValuesInExcel.locations,
    existingLists.locationsList,
    suggestions.locations
  );
  generateReferenceSuggestions(
    allValuesInExcel.floors,
    existingLists.floorsList,
    suggestions.floors
  );
  generateReferenceSuggestions(allValuesInExcel.types, existingLists.typesList, suggestions.types);
  generateReferenceSuggestions(
    allValuesInExcel.categories,
    existingLists.categoriesList,
    suggestions.categories
  );
  generateReferenceSuggestions(
    allValuesInExcel.priorities,
    existingLists.prioritiesList,
    suggestions.priorities
  );

  return { missing, suggestions };
};
