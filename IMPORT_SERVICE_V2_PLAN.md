# Plan de modification du service d'import V2.0

## Modifications déjà effectuées ✅

1. **Types mis à jour**
   - Ajout de `ImportWarning` pour les avertissements
   - Ajout de `MissingListValues` pour tracker les valeurs manquantes
   - `ImportResult` inclut maintenant `warnings` et `missingValues`

2. **Schéma de validation mis à jour**
   - 3 champs obligatoires: titre, description, statut
   - TYPE et PRIORITE maintenant optionnels ✅
   - Tous les 21 champs du template V2.0 supportés

3. **Mapping des colonnes mis à jour**
   - Support des 21 colonnes du template
   - Nouveaux champs: statut, technicien, createur, datecreation, notesresolution, tags

## Modifications à faire 🔧

### 1. Fonction de détection des valeurs manquantes

Créer une fonction qui vérifie si les valeurs existent dans les listes:

```typescript
const detectMissingValues = (
  data: InterventionImportRow[],
  existingLists: {
    types: string[];
    categories: string[];
    priorities: string[];
    locations: string[];
    statuses: string[];
  }
): MissingListValues => {
  const missing: MissingListValues = {
    types: new Set(),
    categories: new Set(),
    priorities: new Set(),
    locations: new Set(),
    statuses: new Set(),
  };

  data.forEach(row => {
    // Vérifier TYPE
    if (row.type && !existingLists.types.includes(row.type.toLowerCase())) {
      missing.types.add(row.type);
    }

    // Vérifier CATEGORIE
    if (row.categorie && !existingLists.categories.includes(row.categorie.toLowerCase())) {
      missing.categories.add(row.categorie);
    }

    // Vérifier PRIORITE
    if (row.priorite && !existingLists.priorities.includes(row.priorite.toLowerCase())) {
      missing.priorities.add(row.priorite);
    }

    // Vérifier LOCALISATION
    if (row.localisation && !existingLists.locations.includes(row.localisation.toLowerCase())) {
      missing.locations.add(row.localisation);
    }

    // Vérifier STATUT
    if (row.statut && !existingLists.statuses.includes(row.statut.toLowerCase())) {
      missing.statuses.add(row.statut);
    }
  });

  return missing;
};
```

### 2. Modifier la fonction importInterventions

Ajouter un paramètre `existingLists` optionnel:

```typescript
export const importInterventions = async (
  file: File,
  options: ImportOptions = {},
  existingLists?: {
    types: string[];
    categories: string[];
    priorities: string[];
    locations: string[];
    statuses: string[];
  }
): Promise<ImportResult<InterventionImportRow>> => {
  // ... parsing existant ...

  // Après validation, détecter les valeurs manquantes
  const missingValues = existingLists
    ? detectMissingValues(validData, existingLists)
    : {
        types: new Set(),
        categories: new Set(),
        priorities: new Set(),
        locations: new Set(),
        statuses: new Set(),
      };

  // Générer des warnings pour les valeurs manquantes
  const warnings: ImportWarning[] = [];

  missingValues.types.forEach(value => {
    warnings.push({
      row: 0, // Général
      field: 'type',
      message: `La valeur "${value}" n'existe pas dans la liste des types`,
      value,
      suggestion: `Voulez-vous créer cette valeur dans la liste ?`,
    });
  });

  // ... idem pour les autres listes ...

  return {
    success: errors.length === 0,
    data: validData,
    errors,
    warnings,
    missingValues,
    stats: { ... }
  };
};
```

### 3. Mise à jour de convertToInterventions

Adapter pour gérer les nouveaux champs:

```typescript
export const convertToInterventions = (
  data: InterventionImportRow[],
  establishmentId: string,
  createdBy: string,
  createdByName: string
): Partial<Intervention>[] => {
  return data.map(row => {
    // Parser les dates
    const createdAt = row.datecreation ? parseDate(row.datecreation) : new Date();
    const scheduledAt = row.dateplanifiee && row.heureplanifiee
      ? parseDateTime(row.dateplanifiee, row.heureplanifiee)
      : undefined;

    // Parser les tags
    const tags = row.tags
      ? row.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const intervention: Partial<Intervention> = {
      title: row.titre,
      description: row.description,
      status: row.statut,

      // Optionnels
      type: row.type || undefined,
      category: row.categorie || undefined,
      priority: row.priorite || 'normal',
      location: row.localisation || '',

      roomNumber: row.numerochambre || undefined,
      floor: row.etage ? parseInt(row.etage) : undefined,
      building: row.batiment || undefined,

      // Dates
      createdAt: Timestamp.fromDate(createdAt),
      scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : undefined,

      estimatedDuration: row.dureeestimee ? parseInt(row.dureeestimee) : undefined,

      // Notes
      internalNotes: row.notesinternes || undefined,
      resolutionNotes: row.notesresolution || undefined,

      // Métadonnées
      tags: tags.length > 0 ? tags : undefined,
      externalReference: row.referenceexterne || undefined,

      // Système
      establishmentId,
      createdBy,
      createdByName,

      photos: [],
      photosCount: 0,
      viewsCount: 0,
      isDeleted: false,
    };

    return intervention;
  });
};
```

### 4. Fonctions utilitaires à ajouter

```typescript
// Parser une date au format JJ/MM/AAAA
const parseDate = (dateStr: string): Date | null => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // 0-indexed
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return new Date(year, month, day);
};

// Parser une date + heure
const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
  const date = parseDate(dateStr);
  if (!date) return null;

  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) return date;

  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);

  if (isNaN(hours) || isNaN(minutes)) return date;

  date.setHours(hours, minutes, 0, 0);
  return date;
};
```

## Utilisation côté UI

Dans le composant d'import:

```typescript
const handleImport = async (file: File) => {
  // 1. Récupérer les listes existantes
  const lists = await getReferenceLists(establishmentId);

  // 2. Lancer l'import avec détection
  const result = await importInterventions(file, {}, {
    types: lists.types.map(t => t.value),
    categories: lists.categories.map(c => c.value),
    priorities: lists.priorities.map(p => p.value),
    locations: lists.locations.map(l => l.value),
    statuses: lists.statuses.map(s => s.value),
  });

  // 3. Si valeurs manquantes, proposer de les créer
  if (result.missingValues.types.size > 0) {
    const shouldCreate = await showConfirmDialog(
      `${result.missingValues.types.size} types introuvables. Voulez-vous les créer ?`,
      Array.from(result.missingValues.types)
    );

    if (shouldCreate) {
      // Créer les nouvelles valeurs
      await createMissingListValues(establishmentId, result.missingValues);
    }
  }

  // 4. Créer les interventions
  await createInterventions(result.data);
};
```

## Résumé

- ✅ TYPE et PRIORITE sont maintenant **optionnels**
- ✅ Détection automatique des valeurs manquantes
- ✅ Génération de warnings pour informer l'utilisateur
- ✅ Possibilité de créer les valeurs manquantes automatiquement
- ✅ Support complet du template V2.0 (21 colonnes)
