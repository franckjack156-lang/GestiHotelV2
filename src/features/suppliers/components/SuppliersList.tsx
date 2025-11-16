/**
 * ============================================================================
 * SUPPLIERS LIST
 * ============================================================================
 *
 * Liste des fournisseurs avec filtres
 */

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { SupplierCard } from './SupplierCard';
import type {
  Supplier,
  SupplierFilters,
  SupplierCategory,
  SupplierStatus,
} from '../types/supplier.types';
import { SUPPLIER_CATEGORY_LABELS, SUPPLIER_STATUS_LABELS } from '../types/supplier.types';

interface SuppliersListProps {
  suppliers: Supplier[];
  isLoading?: boolean;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  onArchive?: (supplier: Supplier) => void;
  onRestore?: (supplier: Supplier) => void;
  onClick?: (supplier: Supplier) => void;
  onFiltersChange?: (filters: SupplierFilters) => void;
}

export const SuppliersList = ({
  suppliers,
  isLoading,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onClick,
  onFiltersChange,
}: SuppliersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SupplierCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrer localement
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      !searchTerm ||
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Appliquer les filtres via le callback
  const applyFilters = () => {
    if (onFiltersChange) {
      const filters: SupplierFilters = {};

      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter !== 'all') filters.category = categoryFilter as SupplierCategory;
      if (statusFilter !== 'all') filters.status = statusFilter as SupplierStatus;

      onFiltersChange(filters);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-accent' : ''}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
            <Select
              value={categoryFilter}
              onValueChange={value => setCategoryFilter(value as SupplierCategory | 'all')}
            >
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {Object.entries(SUPPLIER_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={value => setStatusFilter(value as SupplierStatus | 'all')}
            >
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {onFiltersChange && (
              <Button variant="outline" onClick={applyFilters}>
                Appliquer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Résultats */}
      <div className="text-sm text-muted-foreground">
        {filteredSuppliers.length} fournisseur{filteredSuppliers.length > 1 ? 's' : ''}
        {searchTerm && ` pour "${searchTerm}"`}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Aucun fournisseur trouvé avec ces critères'
              : 'Aucun fournisseur enregistré'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              onRestore={onRestore}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
