/**
 * ============================================================================
 * LIST SELECT COMPONENT - COMPLET
 * ============================================================================
 * 
 * Composant Select universel pour listes de référence
 * 
 * Variantes:
 * ✅ Select simple
 * ✅ Select avec badges
 * ✅ Multi-select
 * ✅ Badge dynamique (affichage seul)
 * ✅ Autocomplete
 * 
 * Destination: src/shared/components/form/ListSelect.tsx
 */

import React, { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useReferenceList } from '@/shared/hooks/useReferenceLists';
import type { ListKey } from '@/shared/types/reference-lists.types';
import { cn } from '@/shared/utils/cn';

// ============================================================================
// TYPES
// ============================================================================

interface BaseListSelectProps {
  listKey: ListKey;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
  showBadge?: boolean;
  required?: boolean;
  error?: string;
}

interface SingleSelectProps extends BaseListSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends BaseListSelectProps {
  values?: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
}

// ============================================================================
// ICÔNE HELPER
// ============================================================================

const ItemIcon: React.FC<{ iconName?: string; className?: string }> = ({
  iconName,
  className,
}) => {
  if (!iconName) return null;

  const Icon = (LucideIcons as any)[iconName];
  if (!Icon) return null;

  return <Icon className={className} />;
};

// ============================================================================
// SELECT SIMPLE
// ============================================================================

/**
 * Select simple pour une liste
 */
export const ListSelect: React.FC<SingleSelectProps> = ({
  listKey,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  disabled = false,
  showBadge = false,
  showIcon = true,
  className = '',
  required = false,
  error,
}) => {
  const { activeItems, isLoading, error: loadError, isEmpty, getItemByValue } = useReferenceList(listKey);

  const selectedItem = useMemo(() => {
    return value ? getItemByValue(value) : undefined;
  }, [value, getItemByValue]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  // Error
  if (loadError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-red-300 rounded-md bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-red-600">{loadError}</span>
      </div>
    );
  }

  // Empty
  if (isEmpty) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50">
        <AlertCircle className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Aucune option disponible</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
        <SelectTrigger className={cn(error && 'border-red-500', className)}>
          <SelectValue placeholder={placeholder}>
            {selectedItem && (
              <div className="flex items-center gap-2">
                {showIcon && selectedItem.icon && (
                  <ItemIcon iconName={selectedItem.icon} className="h-4 w-4 flex-shrink-0" />
                )}
                {showBadge && selectedItem.color ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-normal',
                      `bg-${selectedItem.color}-100 text-${selectedItem.color}-800 border-${selectedItem.color}-300`
                    )}
                  >
                    {selectedItem.label}
                  </Badge>
                ) : (
                  <span className="truncate">{selectedItem.label}</span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {activeItems.map((item) => (
            <SelectItem key={item.id} value={item.value}>
              <div className="flex items-center gap-2">
                {showIcon && item.icon && (
                  <ItemIcon iconName={item.icon} className="h-4 w-4 flex-shrink-0" />
                )}
                {showBadge && item.color ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-normal',
                      `bg-${item.color}-100 text-${item.color}-800 border-${item.color}-300`
                    )}
                  >
                    {item.label}
                  </Badge>
                ) : (
                  <span>{item.label}</span>
                )}
                {item.description && (
                  <span className="ml-2 text-xs text-gray-500 italic truncate">
                    {item.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

// ============================================================================
// MULTI-SELECT
// ============================================================================

/**
 * Multi-select avec checkboxes
 */
export const ListMultiSelect: React.FC<MultiSelectProps> = ({
  listKey,
  values = [],
  onChange,
  maxSelections,
  showIcon = true,
  disabled = false,
  className = '',
  error,
}) => {
  const { activeItems, isLoading, error: loadError } = useReferenceList(listKey);

  const handleToggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      if (maxSelections && values.length >= maxSelections) {
        return;
      }
      onChange([...values, value]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-red-300 rounded-md bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-red-600">{loadError}</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {activeItems.map((item) => {
        const isChecked = values.includes(item.value);
        const isDisabled =
          disabled ||
          (!isChecked && maxSelections !== undefined && values.length >= maxSelections);

        return (
          <label
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors',
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50',
              isChecked && 'bg-blue-50 border-blue-300'
            )}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => !isDisabled && handleToggle(item.value)}
              disabled={isDisabled}
            />
            {showIcon && item.icon && (
              <ItemIcon iconName={item.icon} className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="flex-1">{item.label}</span>
            {item.description && (
              <span className="text-xs text-gray-500 italic">{item.description}</span>
            )}
          </label>
        );
      })}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {maxSelections && (
        <p className="text-xs text-gray-500 mt-2">
          {values.length} / {maxSelections} sélectionné(s)
        </p>
      )}
    </div>
  );
};

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

/**
 * Select avec recherche (autocomplete)
 */
export const ListAutocomplete: React.FC<SingleSelectProps> = ({
  listKey,
  value,
  onChange,
  placeholder = 'Rechercher...',
  disabled = false,
  showIcon = true,
  className = '',
  error,
}) => {
  const { activeItems, isLoading, getItemByValue } = useReferenceList(listKey);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (!search) return activeItems;
    
    const lowerSearch = search.toLowerCase();
    return activeItems.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerSearch) ||
        item.value.toLowerCase().includes(lowerSearch) ||
        item.description?.toLowerCase().includes(lowerSearch)
    );
  }, [activeItems, search]);

  const selectedItem = value ? getItemByValue(value) : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={selectedItem ? selectedItem.label : search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('pl-10', error && 'border-red-500')}
        />
      </div>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Aucun résultat
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setSearch('');
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors',
                    value === item.value && 'bg-blue-50'
                  )}
                >
                  {showIcon && item.icon && (
                    <ItemIcon iconName={item.icon} className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-gray-500 italic truncate">
                      {item.description}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

// ============================================================================
// BADGE DYNAMIQUE (affichage seul)
// ============================================================================

/**
 * Badge dynamique pour afficher une valeur
 */
export const DynamicBadge: React.FC<{
  listKey: ListKey;
  value: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ listKey, value, showIcon = true, size = 'md', className }) => {
  const { getItemByValue } = useReferenceList(listKey);
  const item = getItemByValue(value);

  if (!item) {
    return <span className="text-sm text-gray-500">{value}</span>;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        item.color &&
          `bg-${item.color}-100 text-${item.color}-800 border-${item.color}-300`,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && item.icon && (
        <ItemIcon iconName={item.icon} className={iconSizes[size]} />
      )}
      {item.label}
    </Badge>
  );
};

// ============================================================================
// BADGE MULTIPLE (pour multi-select)
// ============================================================================

/**
 * Afficher plusieurs badges
 */
export const MultipleBadges: React.FC<{
  listKey: ListKey;
  values: string[];
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  max?: number;
  className?: string;
}> = ({ listKey, values, showIcon = true, size = 'md', max, className }) => {
  const visibleValues = max ? values.slice(0, max) : values;
  const hiddenCount = max && values.length > max ? values.length - max : 0;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleValues.map((value) => (
        <DynamicBadge
          key={value}
          listKey={listKey}
          value={value}
          showIcon={showIcon}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ListSelect;
