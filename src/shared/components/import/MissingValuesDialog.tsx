/**
 * ============================================================================
 * MISSING VALUES DIALOG COMPONENT
 * ============================================================================
 *
 * Dialog pour sélectionner les valeurs manquantes à créer dans les listes de référence
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { CheckCircle2, X, AlertCircle, Sparkles, UserCheck, Lightbulb } from 'lucide-react';
import type { MissingListValues, ImportMatchSuggestions } from '@/shared/services/importService';

// ============================================================================
// TYPES
// ============================================================================

export interface MissingValuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingValues: MissingListValues;
  matchSuggestions?: ImportMatchSuggestions; // Suggestions de correspondance
  onConfirm: (selectedValues: MissingListValues, userMappings?: Map<string, string>) => Promise<void>;
  isCreating?: boolean;
}

interface CategoryConfig {
  key: keyof MissingListValues;
  label: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow' | 'gray';
  icon?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MissingValuesDialog: React.FC<MissingValuesDialogProps> = ({
  open,
  onOpenChange,
  missingValues,
  matchSuggestions,
  onConfirm,
  isCreating = false,
}) => {
  // État pour tracker les valeurs sélectionnées
  const [selectedValues, setSelectedValues] = useState<MissingListValues>({
    types: new Set(missingValues.types),
    categories: new Set(missingValues.categories),
    priorities: new Set(missingValues.priorities),
    locations: new Set(missingValues.locations),
    statuses: new Set(missingValues.statuses),
    rooms: new Set(missingValues.rooms),
    floors: new Set(missingValues.floors),
    buildings: new Set(missingValues.buildings),
    technicians: new Set(missingValues.technicians),
    creators: new Set(missingValues.creators),
  });

  // État pour tracker les mappings utilisateur (excelName -> userId)
  // Quand un mapping existe, on n'ajoute PAS la valeur à la liste de référence
  const [userMappings, setUserMappings] = useState<Map<string, string>>(new Map());

  // Configuration des catégories
  const categories: CategoryConfig[] = [
    { key: 'types', label: 'Types', color: 'blue' },
    { key: 'categories', label: 'Catégories', color: 'green' },
    { key: 'priorities', label: 'Priorités', color: 'orange' },
    { key: 'locations', label: 'Localisations', color: 'purple' },
    { key: 'statuses', label: 'Statuts', color: 'red' },
    { key: 'rooms', label: 'Chambres', color: 'yellow' },
    { key: 'floors', label: 'Étages', color: 'gray' },
    { key: 'buildings', label: 'Bâtiments', color: 'gray' },
    { key: 'technicians', label: 'Techniciens', color: 'blue' },
    { key: 'creators', label: 'Créateurs', color: 'blue' },
  ];

  // Filtrer les catégories qui ont des valeurs manquantes
  const categoriesWithValues = useMemo(() => {
    return categories.filter(cat => missingValues[cat.key].size > 0);
  }, [missingValues]);

  // Calculer le nombre total de valeurs sélectionnées (références à créer + mappings utilisateurs)
  const totalSelected = useMemo(() => {
    const referencesToCreate = Object.values(selectedValues).reduce((sum, set) => sum + set.size, 0);
    const userMappingsCount = userMappings.size;
    return referencesToCreate + userMappingsCount;
  }, [selectedValues, userMappings]);

  // Calculer le nombre total de valeurs manquantes
  const totalMissing = useMemo(() => {
    return Object.values(missingValues).reduce((sum, set) => sum + set.size, 0);
  }, [missingValues]);

  // Toggle une valeur spécifique
  const toggleValue = (category: keyof MissingListValues, value: string) => {
    setSelectedValues(prev => {
      const newSet = new Set(prev[category]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [category]: newSet };
    });
  };

  // Toggle toute une catégorie
  const toggleCategory = (category: keyof MissingListValues) => {
    setSelectedValues(prev => {
      const allSelected = Array.from(missingValues[category]).every(v => prev[category].has(v));
      return {
        ...prev,
        [category]: allSelected ? new Set() : new Set(missingValues[category]),
      };
    });
  };

  // Sélectionner tout
  const selectAll = () => {
    setSelectedValues({
      types: new Set(missingValues.types),
      categories: new Set(missingValues.categories),
      priorities: new Set(missingValues.priorities),
      locations: new Set(missingValues.locations),
      statuses: new Set(missingValues.statuses),
      rooms: new Set(missingValues.rooms),
      floors: new Set(missingValues.floors),
      buildings: new Set(missingValues.buildings),
      technicians: new Set(missingValues.technicians),
      creators: new Set(missingValues.creators),
    });
  };

  // Tout désélectionner
  const deselectAll = () => {
    setSelectedValues({
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
    });
  };

  // Sélectionner une suggestion (mapper vers un utilisateur existant)
  const selectSuggestion = (excelName: string, userId: string, category: 'technicians' | 'creators') => {
    // Ajouter le mapping
    setUserMappings(prev => new Map(prev).set(excelName, userId));

    // Retirer de la sélection (on ne crée plus cette valeur)
    setSelectedValues(prev => {
      const newSet = new Set(prev[category]);
      newSet.delete(excelName);
      return { ...prev, [category]: newSet };
    });
  };

  // Annuler une suggestion (revenir à créer une référence)
  const unselectSuggestion = (excelName: string, category: 'technicians' | 'creators') => {
    // Retirer le mapping
    setUserMappings(prev => {
      const newMap = new Map(prev);
      newMap.delete(excelName);
      return newMap;
    });

    // Ré-ajouter à la sélection pour créer la valeur
    setSelectedValues(prev => {
      const newSet = new Set(prev[category]);
      newSet.add(excelName);
      return { ...prev, [category]: newSet };
    });
  };

  // Confirmer la création
  const handleConfirm = async () => {
    await onConfirm(selectedValues, userMappings);
  };

  // Vérifier si une catégorie est entièrement sélectionnée
  const isCategoryFullySelected = (category: keyof MissingListValues) => {
    return Array.from(missingValues[category]).every(v => selectedValues[category].has(v));
  };

  // Vérifier si une catégorie est partiellement sélectionnée
  const isCategoryPartiallySelected = (category: keyof MissingListValues) => {
    const selected = Array.from(missingValues[category]).filter(v =>
      selectedValues[category].has(v)
    ).length;
    return selected > 0 && selected < missingValues[category].size;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Créer les valeurs manquantes
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les valeurs que vous souhaitez ajouter aux listes de référence. Les valeurs
            non sélectionnées seront ignorées lors de l'import.
          </DialogDescription>
        </DialogHeader>

        {/* Actions rapides */}
        <div className="flex items-center justify-between gap-2 py-2 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} disabled={isCreating}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Tout sélectionner
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll} disabled={isCreating}>
              <X className="h-4 w-4 mr-1" />
              Tout désélectionner
            </Button>
          </div>
          <Badge variant="secondary" className="text-sm">
            {totalSelected} / {totalMissing} sélectionnées
          </Badge>
        </div>

        {/* Liste des catégories et valeurs */}
        <ScrollArea className="flex-1 pr-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 py-4">
            {categoriesWithValues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune valeur manquante détectée</p>
              </div>
            ) : (
              categoriesWithValues.map(category => (
                <div key={category.key} className="space-y-3">
                  {/* En-tête de catégorie */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${category.key}`}
                      checked={isCategoryFullySelected(category.key)}
                      onCheckedChange={() => toggleCategory(category.key)}
                      disabled={isCreating}
                      className={
                        isCategoryPartiallySelected(category.key)
                          ? 'data-[state=checked]:bg-gray-400'
                          : ''
                      }
                    />
                    <label
                      htmlFor={`category-${category.key}`}
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span>{category.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedValues[category.key].size} / {missingValues[category.key].size}
                      </Badge>
                    </label>
                  </div>

                  {/* Liste des valeurs */}
                  <div className="ml-6 space-y-2">
                    {Array.from(missingValues[category.key]).map(value => {
                      const hasSuggestions = (category.key === 'technicians' || category.key === 'creators') &&
                        matchSuggestions &&
                        matchSuggestions[category.key].has(value);
                      const suggestions = hasSuggestions ? matchSuggestions![category.key as 'technicians' | 'creators'].get(value) || [] : [];
                      const selectedMapping = userMappings.get(value);

                      return (
                        <div key={value} className="space-y-2">
                          {/* Ligne principale avec checkbox */}
                          <div className="flex items-start gap-2">
                            <Checkbox
                              id={`${category.key}-${value}`}
                              checked={selectedValues[category.key].has(value)}
                              onCheckedChange={() => toggleValue(category.key, value)}
                              disabled={isCreating || !!selectedMapping}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <label
                                htmlFor={`${category.key}-${value}`}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                <Badge
                                  variant="secondary"
                                  className={`bg-${category.color}-100 text-${category.color}-700 dark:bg-${category.color}-900/30 dark:text-${category.color}-300 border-${category.color}-300`}
                                >
                                  {value}
                                </Badge>
                                {hasSuggestions && !selectedMapping && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                                    <Lightbulb className="h-3 w-3 mr-1" />
                                    {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </label>

                              {/* Afficher la suggestion sélectionnée */}
                              {selectedMapping && (
                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-700 dark:text-green-300 flex-1">
                                    Sera lié à : <strong>{suggestions.find(s => s.userId === selectedMapping)?.userName}</strong>
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => unselectSuggestion(value, category.key as 'technicians' | 'creators')}
                                    disabled={isCreating}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}

                              {/* Afficher les suggestions disponibles */}
                              {hasSuggestions && !selectedMapping && suggestions.length > 0 && (
                                <div className="space-y-1 pl-4 border-l-2 border-blue-200">
                                  <p className="text-xs text-muted-foreground mb-1">Utilisateurs correspondants :</p>
                                  {suggestions.slice(0, 3).map((suggestion) => {
                                    const score = Math.round(suggestion.matchScore * 100);
                                    const isHighScore = score >= 75;
                                    return (
                                      <button
                                        key={suggestion.userId}
                                        onClick={() => selectSuggestion(value, suggestion.userId, category.key as 'technicians' | 'creators')}
                                        disabled={isCreating}
                                        className="flex items-center gap-2 p-2 w-full text-left rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isHighScore ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                          <span className="text-xs font-bold">{score}%</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{suggestion.userName}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {suggestion.matchType === 'exact' && '✅ Correspondance exacte'}
                                            {suggestion.matchType === 'partial' && '⚡ Correspondance partielle'}
                                            {suggestion.matchType === 'fuzzy' && '💡 Correspondance approximative'}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={totalSelected === 0 || isCreating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isCreating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {userMappings.size > 0 ? (
                  <>
                    Valider ({Object.values(selectedValues).reduce((sum, set) => sum + set.size, 0)} à créer, {userMappings.size} mappé{userMappings.size > 1 ? 's' : ''})
                  </>
                ) : (
                  <>
                    Créer {totalSelected} valeur{totalSelected > 1 ? 's' : ''}
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
