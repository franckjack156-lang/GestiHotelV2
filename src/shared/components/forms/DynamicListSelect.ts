/**
 * ============================================================================
 * DYNAMIC LIST SELECT
 * ============================================================================
 *
 * Composant Select réutilisable qui charge dynamiquement les items
 * depuis les listes de référence
 *
 * Utilisation:
 * ```tsx
 * <DynamicListSelect
 *   listKey="interventionTypes"
 *   value={formData.type}
 *   onChange={(value) => setFormData({ ...formData, type: value })}
 *   placeholder="Sélectionnez un type"
 * />
 * ```
 *
 * Destination: src/shared/components/forms/DynamicListSelect.tsx
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useReferenceList } from '@/shared/hooks/useReferenceLists';
import type { ListKey } from '@/shared/types/reference-lists.types';
import { cn } from '@/shared/utils/cn';

// ============================================================================
// TYPES
// ============================================================================

export interface DynamicListSelectProps {
  /** Clé de la liste de référence */
  listKey: ListKey;

  /** Valeur sélectionnée */
  value?: string;

  /** Callback au changement */
  onChange: (value: string) => void;

  /** Placeholder */
  placeholder?: string;

  /** Désactivé */
  disabled?: boolean;

  /** Afficher les icônes */
  showIcons?: boolean;

  /** Afficher les couleurs */
  showColors?: boolean;

  /** Afficher les descriptions en tooltip (à implémenter) */
  showDescriptions?: boolean;

  /** Inclure les items inactifs */
  includeInactive?: boolean;

  /** Permettre la valeur vide */
  allowEmpty?: boolean;

  /** Message d'erreur */
  error?: string;

  /** Classe CSS additionnelle */
  className?: string;

  /** Callback au focus */
  onFocus?: () => void;

  /** Callback au blur */
  onBlur?: () => void;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export const DynamicListSelect: React.FC<DynamicListSelectProps> = ({
  listKey,
  value,
  onChange,
  placeholder = 'Sélectionnez une option',
  disabled = false,
  showIcons = true,
  showColors = true,
  showDescriptions = false,
  includeInactive = false,
  allowEmpty = false,
  error,
  className,
  onFocus,
  onBlur,
}) => {
  // Charger les items de la liste
  const { activeItems, listConfig, isLoading, error: loadError } = useReferenceList(listKey);

  // Déterminer les items à afficher
  const items = includeInactive && listConfig ? listConfig.items : activeItems;

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getIcon = (iconName?: string) => {
    if (!iconName || !showIcons) return null;

    // @ts-ignore
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
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

  return (
    <div className="space-y-2">
      <Select
        value={value || (allowEmpty ? undefined : '')}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder}>
            {value && items.find(item => item.value === value) ? (
              <div className="flex items-center gap-2">
                {showIcons && getIcon(items.find(item => item.value === value)?.icon)}
                <span className={getColorClass(items.find(item => item.value === value)?.color)}>
                  {items.find(item => item.value === value)?.label}
                </span>
              </div>
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {allowEmpty && (
            <SelectItem value="">
              <span className="text-muted-foreground italic">Aucun</span>
            </SelectItem>
          )}

          {items.map(item => (
            <SelectItem
              key={item.id}
              value={item.value}
              disabled={!item.isActive}
            >
              <div className="flex items-center gap-2">
                {showIcons && (
                  <span className={getColorClass(item.color)}>
                    {getIcon(item.icon)}
                  </span>
                )}
                <span className={cn(
                  getColorClass(item.color),
                  !item.isActive && 'opacity-50'
                )}>
                  {item.label}
                </span>
                {!item.isActive && (
                  <Badge variant="outline" className="text-xs">
                    Inactif
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Message d'erreur */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Information sur la liste */}
      {listConfig && listConfig.description && !error && (
        <p className="text-xs text-muted-foreground">
          {listConfig.description}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// VARIANTES PRÉDÉFINIES
// ============================================================================

/**
 * Select pour les types d'intervention
 */
export const InterventionTypeSelect: React.FC<
  Omit<DynamicListSelectProps, 'listKey'>
> = props => (
  <DynamicListSelect listKey="interventionTypes" {...props} />
);

/**
 * Select pour les catégories
 */
export const CategorySelect: React.FC<
  Omit<DynamicListSelectProps, 'listKey'>
> = props => (
  <DynamicListSelect listKey="categories" {...props} />
);

/**
 * Select pour les priorités
 */
export const PrioritySelect: React.FC<
  Omit<DynamicListSelectProps, 'listKey'>
> = props => (
  <DynamicListSelect listKey="priorities" {...props} />
);

/**
 * Select pour les statuts
 */
export const StatusSelect: React.FC<
  Omit<DynamicListSelectProps, 'listKey'>
> = props => (
  <DynamicListSelect listKey="statuses" {...props} />
);

/**
 * Select pour les types de chambre
 */
export const RoomTypeSelect: React.FC<
  Omit<DynamicListSelectProps, 'listKey'>
> = props => (
  <DynamicListSelect listKey="roomTypes" {...props} />
);

/**
 * Select pour les zones communes
 */
export const CommonAreaSelect: React.FC<
  Omit<DynamicListSelectProps, 'listKey'>
> = props => (
  <DynamicListSelect listKey="commonAreas" {...props} />
);

// ============================================================================
// EXPORTS
// ============================================================================

export default DynamicListSelect;

// Export des variantes
export {
  InterventionTypeSelect,
  CategorySelect,
  PrioritySelect,
  StatusSelect,
  RoomTypeSelect,
  CommonAreaSelect,
};