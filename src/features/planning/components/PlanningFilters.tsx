/**
 * Composant de filtres avancés pour le planning
 */

import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Checkbox } from '@/shared/components/ui/checkbox';

interface PlanningFiltersProps {
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  selectedPriorities: string[];
  onPriorityChange: (priorities: string[]) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'assigned', label: 'Assignée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'on_hold', label: 'En pause' },
  { value: 'completed', label: 'Terminée' },
  { value: 'validated', label: 'Validée' },
  { value: 'cancelled', label: 'Annulée' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse' },
  { value: 'normal', label: 'Normale' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'critical', label: 'Critique' },
];

export const PlanningFilters = ({
  searchKeyword,
  onSearchChange,
  selectedStatuses,
  onStatusChange,
  selectedPriorities,
  onPriorityChange,
  onReset,
}: PlanningFiltersProps) => {
  const hasActiveFilters =
    searchKeyword || selectedStatuses.length > 0 || selectedPriorities.length > 0;

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const togglePriority = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter(p => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      {/* Recherche par mot-clé */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher..."
          value={searchKeyword}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10 text-sm"
        />
        {searchKeyword && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {/* Filtre par statut */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
            <Filter size={14} />
            <span className="hidden xs:inline">Statut</span>
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Filtrer par statut</h4>
            <div className="space-y-2">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${value}`}
                    checked={selectedStatuses.includes(value)}
                    onCheckedChange={() => toggleStatus(value)}
                  />
                  <label
                    htmlFor={`status-${value}`}
                    className="text-sm cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
            {selectedStatuses.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onStatusChange([])}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Filtre par priorité */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
            <Filter size={14} />
            <span className="hidden xs:inline">Priorité</span>
            {selectedPriorities.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {selectedPriorities.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Filtrer par priorité</h4>
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${value}`}
                    checked={selectedPriorities.includes(value)}
                    onCheckedChange={() => togglePriority(value)}
                  />
                  <label
                    htmlFor={`priority-${value}`}
                    className="text-sm cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
            {selectedPriorities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onPriorityChange([])}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Bouton effacer tous les filtres */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={14} className="mr-1" />
          Effacer tous les filtres
        </Button>
      )}
    </div>
  );
};
