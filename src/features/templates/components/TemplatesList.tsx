/**
 * ============================================================================
 * TEMPLATES LIST COMPONENT
 * ============================================================================
 *
 * Liste des modèles d'interventions avec filtres et recherche
 */

import { useState, useMemo } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { TemplateCard } from './TemplateCard';
import { TEMPLATE_CATEGORIES } from '../types/template.types';
import type { InterventionTemplate } from '../types/template.types';

interface TemplatesListProps {
  templates: InterventionTemplate[];
  onUse: (template: InterventionTemplate) => void;
  onEdit?: (template: InterventionTemplate) => void;
  onDuplicate?: (template: InterventionTemplate) => void;
  onDelete?: (template: InterventionTemplate) => void;
  onCreate?: () => void;
  isLoading?: boolean;
}

export const TemplatesList = ({
  templates,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
  onCreate,
  isLoading,
}: TemplatesListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  /**
   * Filtrer et rechercher
   */
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filtre par catégorie
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.templateData.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher un modèle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtre catégorie */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {TEMPLATE_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bouton créer */}
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau modèle
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredTemplates.length} modèle{filteredTemplates.length > 1 ? 's' : ''} trouvé
          {filteredTemplates.length > 1 ? 's' : ''}
        </span>
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
            Effacer la recherche
          </Button>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-lg bg-gray-100 animate-pulse dark:bg-gray-800" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || categoryFilter !== 'all'
              ? 'Aucun modèle ne correspond à vos critères'
              : 'Aucun modèle disponible'}
          </p>
          {onCreate && !searchQuery && categoryFilter === 'all' && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Créer votre premier modèle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={onUse}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
