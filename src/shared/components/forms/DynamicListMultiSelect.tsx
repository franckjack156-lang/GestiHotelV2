/**
 * ============================================================================
 * DYNAMIC LIST MULTI-SELECT
 * ============================================================================
 *
 * Composant Multi-Select réutilisable qui charge dynamiquement les items
 * depuis les listes de référence
 *
 * Utilisation:
 * ```tsx
 * <DynamicListMultiSelect
 *   listKey="staffSkills"
 *   value={formData.skills}
 *   onChange={(values) => setFormData({ ...formData, skills: values })}
 *   placeholder="Sélectionnez des compétences"
 * />
 * ```
 */

import React, { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Loader2, AlertCircle, Check, ChevronsUpDown, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useReferenceList } from '@/shared/hooks/useReferenceLists';
import type { ListKey } from '@/shared/types/reference-lists.types';
import { cn } from '@/shared/utils/cn';

// ============================================================================
// TYPES
// ============================================================================

export interface DynamicListMultiSelectProps {
  /** Clé de la liste de référence */
  listKey: ListKey;

  /** Valeurs sélectionnées (tableau de values) */
  value?: string[];

  /** Callback au changement */
  onChange: (values: string[]) => void;

  /** Placeholder */
  placeholder?: string;

  /** Désactivé */
  disabled?: boolean;

  /** Afficher les icônes */
  showIcons?: boolean;

  /** Afficher les couleurs */
  showColors?: boolean;

  /** Inclure les items inactifs */
  includeInactive?: boolean;

  /** Permettre la création d'items custom */
  allowCustom?: boolean;

  /** Message d'erreur */
  error?: string;

  /** Classe CSS additionnelle */
  className?: string;

  /** Nombre maximum de sélections */
  maxSelections?: number;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export const DynamicListMultiSelect: React.FC<DynamicListMultiSelectProps> = ({
  listKey,
  value = [],
  onChange,
  placeholder = 'Sélectionnez des options',
  disabled = false,
  showIcons = true,
  showColors = true,
  includeInactive = false,
  allowCustom = false,
  error,
  className,
  maxSelections,
}) => {
  const [open, setOpen] = useState(false);

  // Charger les items de la liste
  const { activeItems, listConfig, isLoading, error: loadError } = useReferenceList(listKey);

  // Déterminer les items à afficher
  const items = includeInactive && listConfig ? listConfig.items : activeItems;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelect = (itemValue: string) => {
    const isSelected = value.includes(itemValue);

    if (isSelected) {
      // Désélectionner
      onChange(value.filter((v) => v !== itemValue));
    } else {
      // Sélectionner si pas de limite ou limite non atteinte
      if (!maxSelections || value.length < maxSelections) {
        onChange([...value, itemValue]);
      }
    }
  };

  const handleRemove = (itemValue: string) => {
    onChange(value.filter((v) => v !== itemValue));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getIcon = (iconName?: string) => {
    if (!iconName || !showIcons) return null;

    // @ts-ignore
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon className="h-3 w-3" /> : null;
  };

  const getColorClass = (color?: string) => {
    if (!color || !showColors) return '';

    // Mapping des couleurs Tailwind
    const colorMap: Record<string, string> = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      green: 'text-green-600',
      blue: 'text-blue-600',
      indigo: 'text-indigo-600',
      purple: 'text-purple-600',
      pink: 'text-pink-600',
      gray: 'text-gray-600',
      slate: 'text-slate-600',
      cyan: 'text-cyan-600',
    };

    return colorMap[color] || '';
  };

  const getBadgeColorClass = (color?: string) => {
    if (!color || !showColors) return '';

    // Mapping des couleurs de badge
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 text-red-800 hover:bg-red-200',
      orange: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      green: 'bg-green-100 text-green-800 hover:bg-green-200',
      blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      indigo: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      pink: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      gray: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      slate: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
      cyan: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
    };

    return colorMap[color] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const getSelectedLabels = () => {
    if (!items) return [];
    return value
      .map((v) => items.find((item) => item.value === v))
      .filter(Boolean);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // État de chargement
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 p-2 border rounded-md', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  // Erreur de chargement
  if (loadError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  // Aucun item disponible
  if (!items || items.length === 0) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucun élément disponible dans cette liste.
          {listConfig?.allowCustom && (
            <span className="block mt-1 text-xs">
              Vous pouvez ajouter des éléments dans les paramètres.
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const selectedLabels = getSelectedLabels();

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              error && 'border-red-500',
              className
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-1 flex-wrap flex-1 overflow-hidden">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span className="text-sm">
                  {value.length} {value.length === 1 ? 'sélectionné' : 'sélectionnés'}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <CommandEmpty>Aucun élément trouvé.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {items.map((item) => {
                const isSelected = value.includes(item.value);
                const isDisabled =
                  !item.isActive ||
                  (!isSelected && maxSelections && value.length >= maxSelections);

                return (
                  <CommandItem
                    key={item.id}
                    value={item.value}
                    onSelect={() => !isDisabled && handleSelect(item.value)}
                    disabled={isDisabled}
                    className={cn(
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2">
                      {showIcons && (
                        <span className={getColorClass(item.color)}>
                          {getIcon(item.icon)}
                        </span>
                      )}
                      <span className={getColorClass(item.color)}>
                        {item.label}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Badges des sélections */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((item) => (
            <Badge
              key={item!.id}
              variant="secondary"
              className={cn(
                'gap-1 pr-1',
                getBadgeColorClass(item!.color)
              )}
            >
              {showIcons && getIcon(item!.icon)}
              <span className="text-xs">{item!.label}</span>
              <button
                type="button"
                onClick={() => handleRemove(item!.value)}
                className="ml-1 rounded-full hover:bg-black/10 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedLabels.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs"
              disabled={disabled}
            >
              Tout effacer
            </Button>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Information sur la limite */}
      {maxSelections && !error && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxSelections} {maxSelections === 1 ? 'sélection' : 'sélections'}
          {value.length > 0 && ` (${value.length}/${maxSelections})`}
        </p>
      )}

      {/* Information sur la liste */}
      {listConfig && listConfig.description && !error && !maxSelections && (
        <p className="text-xs text-muted-foreground">
          {listConfig.description}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default DynamicListMultiSelect;
