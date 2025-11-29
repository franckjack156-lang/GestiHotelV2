/**
 * ============================================================================
 * INVENTORY ITEMS LIST
 * ============================================================================
 *
 * Liste des articles d'inventaire
 */

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { InventoryItemCard } from './InventoryItemCard';
import type { InventoryItem, InventoryFilters } from '../types/inventory.types';
import { INVENTORY_CATEGORY_LABELS, INVENTORY_STATUS_LABELS } from '../types/inventory.types';

interface InventoryItemsListProps {
  items: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  onStockMovement?: (item: InventoryItem) => void;
  onItemClick?: (item: InventoryItem) => void;
  onFiltersChange?: (filters: InventoryFilters) => void;
}

export const InventoryItemsList = ({
  items,
  onEdit,
  onDelete,
  onStockMovement,
  onItemClick,
  onFiltersChange,
}: InventoryItemsListProps) => {
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof InventoryFilters, value: string | number | boolean) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined,
    };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article..."
            value={filters.search || ''}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Catégorie</label>
            <Select
              value={filters.category || 'all'}
              onValueChange={value =>
                handleFilterChange('category', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Object.entries(INVENTORY_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Statut</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={value =>
                handleFilterChange('status', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(INVENTORY_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Localisation</label>
            <Input
              placeholder="Filtrer par localisation..."
              value={filters.location || ''}
              onChange={e => handleFilterChange('location', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Liste des articles */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun article trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onStockMovement={onStockMovement}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
