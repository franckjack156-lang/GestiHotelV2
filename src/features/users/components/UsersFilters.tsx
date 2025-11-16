/**
 * ============================================================================
 * USERS FILTERS COMPONENT
 * ============================================================================
 */

import React, { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { UserRole, ROLE_LABELS } from '../types/role.types';
import { UserStatus } from '../types/user.types';
import type { UserFilters } from '../types/user.types';
import { Search, Filter, X } from 'lucide-react';

interface UsersFiltersProps {
  /** Filtres actifs */
  filters: UserFilters;
  /** Callback changement filtres */
  onFiltersChange: (filters: Partial<UserFilters>) => void;
  /** Callback réinitialisation */
  onReset: () => void;
  /** Afficher le badge de filtres actifs */
  showActiveCount?: boolean;
}

export const UsersFilters: React.FC<UsersFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  showActiveCount = true,
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  /**
   * Compter les filtres actifs
   */
  const activeFiltersCount = Object.values(filters).filter(
    value => value !== undefined && value !== '' && value !== false
  ).length;

  /**
   * Gérer la recherche
   */
  const handleSearch = (value: string) => {
    setSearchValue(value);
    onFiltersChange({ search: value || undefined });
  };

  /**
   * Réinitialiser
   */
  const handleReset = () => {
    setSearchValue('');
    onReset();
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
          {searchValue && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtres avancés */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
              {showActiveCount && activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filtres avancés</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-auto p-1 text-xs"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Rôle */}
              <div>
                <Label>Rôle</Label>
                <Select
                  value={Array.isArray(filters.role) ? undefined : filters.role || 'all'}
                  onValueChange={value =>
                    onFiltersChange({
                      role: value === 'all' ? undefined : (value as UserRole),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {Object.values(UserRole).map(role => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statut */}
              <div>
                <Label>Statut</Label>
                <Select
                  value={Array.isArray(filters.status) ? undefined : filters.status || 'all'}
                  onValueChange={value =>
                    onFiltersChange({
                      status: value === 'all' ? undefined : (value as UserStatus),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value={UserStatus.ACTIVE}>Actif</SelectItem>
                    <SelectItem value={UserStatus.INACTIVE}>Inactif</SelectItem>
                    <SelectItem value={UserStatus.PENDING}>En attente</SelectItem>
                    <SelectItem value={UserStatus.SUSPENDED}>Suspendu</SelectItem>
                    <SelectItem value={UserStatus.BANNED}>Banni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Département */}
              <div>
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  placeholder="Ex: Maintenance"
                  value={filters.department || ''}
                  onChange={e => onFiltersChange({ department: e.target.value || undefined })}
                />
              </div>

              {/* Actifs uniquement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activeOnly"
                  checked={filters.activeOnly}
                  onCheckedChange={checked => onFiltersChange({ activeOnly: checked as boolean })}
                />
                <Label htmlFor="activeOnly" className="cursor-pointer">
                  Actifs uniquement
                </Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Bouton reset (si filtres actifs) */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Tags des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <div className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded">
              <span>Recherche: {filters.search}</span>
              <button
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ search: undefined });
                }}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {filters.role && !Array.isArray(filters.role) && (
            <div className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded">
              <span>Rôle: {ROLE_LABELS[filters.role]}</span>
              <button
                onClick={() => onFiltersChange({ role: undefined })}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {filters.status && !Array.isArray(filters.status) && (
            <div className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded">
              <span>Statut: {filters.status}</span>
              <button
                onClick={() => onFiltersChange({ status: undefined })}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {filters.department && (
            <div className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded">
              <span>Département: {filters.department}</span>
              <button
                onClick={() => onFiltersChange({ department: undefined })}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {filters.activeOnly && (
            <div className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded">
              <span>Actifs uniquement</span>
              <button
                onClick={() => onFiltersChange({ activeOnly: false })}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
