/**
 * InterventionsPage
 *
 * Page principale de gestion des interventions
 * - Liste avec temps réel
 * - Filtres avancés
 * - Recherche
 * - Actions rapides
 *
 * Destination: src/pages/interventions/InterventionsPage.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Card } from '@/shared/components/ui/card';
import { useInterventions } from '@/features/interventions/hooks/useInterventions';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { usePermissions } from '@/shared/hooks/usePermissions';

import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import { TypeBadge } from '@/features/interventions/components/badges/TypeBadge';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  INTERVENTION_TYPE_LABELS,
  type InterventionStatus,
  type InterventionPriority,
  type InterventionType,
} from '@/shared/types/status.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const InterventionsPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { canCreateInterventions } = usePermissions();

  const { interventions, isLoading, error, filters, setFilters, resetFilters, stats } =
    useInterventions(establishmentId || '');

  const [searchQuery, setSearchQuery] = useState('');

  // Gérer la recherche
  const handleSearch = () => {
    setFilters({ search: searchQuery || undefined });
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setFilters({ search: undefined });
  };

  // Gérer les filtres
  const handleStatusFilter = (value: string) => {
    if (value === 'all') {
      setFilters({ status: undefined });
    } else {
      setFilters({ status: [value as InterventionStatus] });
    }
  };

  const handlePriorityFilter = (value: string) => {
    if (value === 'all') {
      setFilters({ priority: undefined });
    } else {
      setFilters({ priority: [value as InterventionPriority] });
    }
  };

  const handleTypeFilter = (value: string) => {
    if (value === 'all') {
      setFilters({ type: undefined });
    } else {
      setFilters({ type: value as InterventionType });
    }
  };

  // Actions
  const handleCreateIntervention = () => {
    navigate('/app/interventions/create');
  };

  const handleInterventionClick = (id: string) => {
    navigate(`/app/interventions/${id}`);
  };

  const handleRefresh = () => {
    // Le hook recharge automatiquement grâce au temps réel
    window.location.reload();
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filters.status || filters.priority || filters.type || filters.search;

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Aucun établissement sélectionné</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interventions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gérez toutes les interventions de maintenance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {canCreateInterventions && (
            <Button onClick={handleCreateIntervention}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle intervention
            </Button>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">En attente</div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">En cours</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Terminées</div>
            <div className="mt-2 text-2xl font-bold text-green-600">{stats.completed}</div>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher une intervention..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            {/* Filtre statut */}
            <Select value={filters.status?.[0] || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre priorité */}
            <Select value={filters.priority?.[0] || 'all'} onValueChange={handlePriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre type */}
            <Select value={filters.type || 'all'} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(INTERVENTION_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bouton réinitialiser */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Liste des interventions */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </Card>
      )}

      {isLoading && interventions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : interventions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {hasActiveFilters
              ? 'Aucune intervention ne correspond aux filtres'
              : 'Aucune intervention pour le moment'}
          </p>
          {canCreateInterventions && !hasActiveFilters && (
            <Button className="mt-4" onClick={handleCreateIntervention}>
              <Plus className="h-4 w-4 mr-2" />
              Créer la première intervention
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {interventions.map(intervention => (
            <Card
              key={intervention.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleInterventionClick(intervention.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {intervention.title}
                    </h3>
                    {intervention.isUrgent && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded dark:bg-red-900/20 dark:text-red-400">
                        URGENT
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {intervention.description}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge status={intervention.status} size="sm" />
                    <PriorityBadge priority={intervention.priority} size="sm" />
                    <TypeBadge type={intervention.type} size="sm" />
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>📍 {intervention.location}</span>
                    {intervention.roomNumber && <span>🚪 Chambre {intervention.roomNumber}</span>}
                    <span>
                      📅{' '}
                      {format(intervention.createdAt.toDate(), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                    {intervention.photosCount > 0 && (
                      <span>📷 {intervention.photosCount} photo(s)</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination (à implémenter plus tard si nécessaire) */}
      {interventions.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {interventions.length} intervention(s) affichée(s)
          </p>
        </div>
      )}
    </div>
  );
};
