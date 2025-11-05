/**
 * InterventionFilters Component
 * 
 * Barre de filtres pour les interventions
 */

import { useState } from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import {
  InterventionStatus,
  InterventionPriority,
  InterventionType,
  STATUS_LABELS,
  PRIORITY_LABELS,
  INTERVENTION_TYPE_LABELS,
} from '@/shared/types/status.types';
import type { InterventionFilters as Filters } from '../../types/intervention.types';

interface InterventionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
}

export const InterventionFilters = ({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  totalCount,
  filteredCount,
}: InterventionFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  // Gérer la recherche
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    onFiltersChange({ search: searchQuery || undefined });
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    onFiltersChange({ search: undefined });
  };

  // Gérer les statuts (multi-select)
  const handleStatusToggle = (status: InterventionStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  // Gérer les priorités (multi-select)
  const handlePriorityToggle = (priority: InterventionPriority) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority];
    
    onFiltersChange({
      priority: newPriorities.length > 0 ? newPriorities : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et actions */}
      <div className="flex items-center gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Rechercher par titre, description, chambre..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Bouton filtres avancés */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Filtres
              {hasActiveFilters && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtres avancés</SheetTitle>
              <SheetDescription>
                Affinez votre recherche d'interventions
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Statuts */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Statuts</Label>
                <div className="space-y-2">
                  {Object.values(InterventionStatus).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status?.includes(status)}
                        onCheckedChange={() => handleStatusToggle(status)}
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="text-sm font-normal leading-none cursor-pointer"
                      >
                        {STATUS_LABELS[status]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priorités */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Priorités</Label>
                <div className="space-y-2">
                  {Object.values(InterventionPriority).map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={filters.priority?.includes(priority)}
                        onCheckedChange={() => handlePriorityToggle(priority)}
                      />
                      <label
                        htmlFor={`priority-${priority}`}
                        className="text-sm font-normal leading-none cursor-pointer"
                      >
                        {PRIORITY_LABELS[priority]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Type</Label>
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      type: value === 'all' ? undefined : (value as InterventionType),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.values(InterventionType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {INTERVENTION_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Options booléennes */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={filters.isUrgent === true}
                      onCheckedChange={(checked) =>
                        onFiltersChange({
                          isUrgent: checked ? true : undefined,
                        })
                      }
                    />
                    <label
                      htmlFor="urgent"
                      className="text-sm font-normal leading-none cursor-pointer"
                    >
                      Urgentes uniquement
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="blocking"
                      checked={filters.isBlocking === true}
                      onCheckedChange={(checked) =>
                        onFiltersChange({
                          isBlocking: checked ? true : undefined,
                        })
                      }
                    />
                    <label
                      htmlFor="blocking"
                      className="text-sm font-normal leading-none cursor-pointer"
                    >
                      Bloquantes uniquement
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onReset}
                  disabled={!hasActiveFilters}
                >
                  <RotateCcw size={18} className="mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Bouton reset visible */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={onReset}>
            <RotateCcw size={18} />
          </Button>
        )}
      </div>

      {/* Compteur de résultats */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredCount} intervention{filteredCount > 1 ? 's' : ''}
          {hasActiveFilters && ` sur ${totalCount}`}
        </span>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  );
};
