/**
 * ListSelect Component
 *
 * Composant Select alimenté par les listes de référence dynamiques
 * Remplace les selects codés en dur par des listes configurables par établissement
 */

import { useMemo } from 'react';
import { useReferenceList } from '@/shared/hooks/useReferenceLists';
import * as LucideIcons from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Skeleton } from '@/shared/components/ui/skeleton';
// TODO: Loader2 imported but unused
import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { ListKey } from '@/shared/types/reference-lists.types';

interface ListSelectProps {
  listKey: ListKey;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showIcons?: boolean; // Afficher les icônes des items
  showColors?: boolean; // Afficher les couleurs des items
  allowEmpty?: boolean; // Permettre la valeur vide
  emptyLabel?: string; // Label pour la valeur vide
}

/**
 * Select basé sur les listes de référence
 *
 * @example
 * <ListSelect
 *   listKey="interventionTypes"
 *   value={type}
 *   onValueChange={setType}
 *   placeholder="Sélectionner un type"
 *   showIcons
 * />
 */
export const ListSelect = ({
  listKey,
  value,
  onValueChange,
  placeholder,
  label,
  disabled = false,
  required = false,
  className,
  showIcons = false,
  showColors = true,
  allowEmpty = false,
  emptyLabel = 'Aucun',
}: ListSelectProps) => {
  const { activeItems, isLoading, error, listConfig, getLabelByValue } = useReferenceList(listKey);

  // Préparer les options
  const options = useMemo(() => {
    const items = activeItems.map(item => ({
      value: item.value,
      label: item.label,
      color: item.color,
      icon: item.icon,
    }));

    // Ajouter l'option vide si autorisé
    if (allowEmpty) {
      return [{ value: '', label: emptyLabel, color: undefined, icon: undefined }, ...items];
    }

    return items;
  }, [activeItems, allowEmpty, emptyLabel]);

  /**
   * Obtenir le composant icône
   */
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon size={16} className="mr-2" /> : null;
  };

  /**
   * Obtenir la classe de couleur Tailwind
   */
  const getColorClass = (color?: string) => {
    if (!color || !showColors) return '';

    const colorMap: Record<string, string> = {
      gray: 'text-gray-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      amber: 'text-amber-600',
      yellow: 'text-yellow-600',
      lime: 'text-lime-600',
      green: 'text-green-600',
      emerald: 'text-emerald-600',
      teal: 'text-teal-600',
      cyan: 'text-cyan-600',
      sky: 'text-sky-600',
      blue: 'text-blue-600',
      indigo: 'text-indigo-600',
      violet: 'text-violet-600',
      purple: 'text-purple-600',
      fuchsia: 'text-fuchsia-600',
      pink: 'text-pink-600',
      rose: 'text-rose-600',
    };

    return colorMap[color] || '';
  };

  /**
   * Rendu du badge coloré
   */
  const renderColorBadge = (color?: string) => {
    if (!color || !showColors) return null;

    const colorVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      red: 'destructive',
      orange: 'destructive',
      yellow: 'default',
      green: 'default',
      blue: 'default',
    };

    return (
      <Badge
        variant={colorVariants[color] || 'secondary'}
        className="ml-auto h-5 w-5 rounded-full p-0"
        style={{
          backgroundColor: `var(--${color}-500)`,
        }}
      />
    );
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Skeleton className="h-4 w-24" />}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erreur de chargement de la liste: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Pas de données
  if (options.length === 0) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune valeur disponible pour cette liste.
            {listConfig?.allowCustom && ' Vous pouvez en ajouter dans les paramètres.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder || `Sélectionner ${listConfig?.name || ''}`}>
            {value && (
              <div className="flex items-center">
                {showIcons && getIcon(activeItems.find(i => i.value === value)?.icon)}
                <span className={getColorClass(activeItems.find(i => i.value === value)?.color)}>
                  {getLabelByValue(value)}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {listConfig?.name && <SelectLabel>{listConfig.name}</SelectLabel>}
          <SelectGroup>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {showIcons && getIcon(option.icon)}
                    <span className={getColorClass(option.color)}>{option.label}</span>
                  </div>
                  {renderColorBadge(option.color)}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Helper text */}
      {listConfig?.description && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{listConfig.description}</p>
      )}
    </div>
  );
};

/**
 * ListSelect pour les formulaires React Hook Form
 *
 * @example
 * <Controller
 *   name="type"
 *   control={control}
 *   render={({ field }) => (
 *     <ListSelectField
 *       listKey="interventionTypes"
 *       {...field}
 *     />
 *   )}
 * />
 */
export const ListSelectField = ({
  listKey,
  value,
  onChange,
  ...props
}: Omit<ListSelectProps, 'onValueChange'> & {
  onChange?: (value: string) => void;
}) => {
  return (
    <ListSelect listKey={listKey} value={value} onValueChange={onChange || (() => {})} {...props} />
  );
};

/**
 * Multi-select pour les listes (avec checkboxes)
 * TODO: À implémenter si nécessaire
 */
export const ListMultiSelect = () => {
  return <div>Multi-select à implémenter</div>;
};
