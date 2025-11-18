/**
 * ============================================================================
 * INTERVENTIONS PAGE - MODERN REDESIGN WITH DRAG & DROP
 * ============================================================================
 *
 * Design moderne avec 2 vues:
 * - Kanban: Colonnes par statut avec drag & drop
 * - Table: Tableau compact et élégant avec couleurs de statut
 */

import { useState, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  Upload,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  X,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  MapPin,
  User,
} from 'lucide-react';
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
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useInterventions } from '@/features/interventions/hooks/useInterventions';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import { TypeBadge } from '@/features/interventions/components/badges/TypeBadge';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  INTERVENTION_TYPE_LABELS,
  type InterventionStatus,
} from '@/shared/types/status.types';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ImportDialog } from '@/shared/components/import/ImportDialog';
import { useImportInterventions } from '@/shared/hooks/useImport';
import { downloadInterventionsTemplate } from '@/shared/services/templateGeneratorService';
import { toast } from 'sonner';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { ConfirmDialog } from '@/shared/components/ui-extended';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import { cn } from '@/shared/lib/utils';
import { useUserPreferences } from '@/features/users/hooks/useUserPreferences';

const InterventionsPageComponent = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { canCreateInterventions } = usePermissions();
  const { user } = useAuth();

  const { allInterventions: interventions, isLoading, error, filters, stats } = useInterventions();
  const { displayPreferences } = useUserPreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Utiliser la vue par défaut depuis les préférences
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(() => {
    const defaultView = displayPreferences.defaultView;
    // Mapper les valeurs des préférences aux valeurs du viewMode
    if (defaultView === 'list' || defaultView === 'calendar') return 'table';
    return 'kanban'; // Pour 'grid' ou toute autre valeur
  });
  const [interventionToDelete, setInterventionToDelete] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeIntervention, setActiveIntervention] = useState<Intervention | null>(null);

  const { deleteIntervention, isDeleting, updateIntervention } = useInterventionActions();
  const importHook = useImportInterventions(
    establishmentId || '',
    user?.id || '',
    user?.displayName || user?.email || 'Utilisateur'
  );

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Gérer la recherche
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // TODO: Implémenter setFilters dans le hook useInterventions
  };

  // Gérer les filtres
  const handleStatusFilter = (_value: string) => {
    // TODO: Implémenter setFilters dans le hook useInterventions
  };

  const handlePriorityFilter = (_value: string) => {
    // TODO: Implémenter setFilters dans le hook useInterventions
  };

  const handleTypeFilter = (_value: string) => {
    // TODO: Implémenter setFilters dans le hook useInterventions
  };

  // Actions
  const handleCreateIntervention = () => navigate('/app/interventions/create');
  const handleInterventionClick = (id: string) => navigate(`/app/interventions/${id}`);
  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/interventions/${id}/edit`);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInterventionToDelete(id);
  };

  const handleDeleteConfirm = async () => {
    if (!interventionToDelete) return;
    try {
      await deleteIntervention(interventionToDelete);
      toast.success('Intervention supprimée');
      setInterventionToDelete(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteAllConfirm = async () => {
    try {
      const toastId = toast.loading(
        `Suppression de ${interventions.length} intervention(s) en cours...`
      );

      // Supprimer par lots de 10
      const batchSize = 10;
      for (let i = 0; i < interventions.length; i += batchSize) {
        const batch = interventions.slice(i, i + batchSize);
        await Promise.all(batch.map(intervention => deleteIntervention(intervention.id)));
      }

      toast.success(`${interventions.length} intervention(s) supprimée(s)`, { id: toastId });
      setShowDeleteAllDialog(false);
      handleRefresh();
    } catch (error) {
      toast.error('Erreur lors de la suppression massive');
    }
  };

  const handleRefresh = () => window.location.reload();

  const handleImportConfirm = async (data: any[]) => {
    try {
      await importHook.handleConfirm(data);
      toast.success('Import réussi', { description: `${data.length} intervention(s) importée(s)` });
      setImportDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'import");
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const intervention = interventions.find(i => i.id === event.active.id);
    setActiveIntervention(intervention || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIntervention(null);

    if (!over || active.id === over.id) return;

    const interventionId = active.id as string;
    const newStatus = over.id as InterventionStatus;

    try {
      await updateIntervention(interventionId, { status: newStatus });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const hasActiveFilters = filters.status || filters.priority || filters.type || filters.search;

  // Grouper par statut pour le Kanban
  const kanbanColumns = {
    draft: interventions.filter(i => i.status === 'draft'),
    pending: interventions.filter(i => i.status === 'pending'),
    assigned: interventions.filter(i => i.status === 'assigned'),
    in_progress: interventions.filter(i => i.status === 'in_progress'),
    on_hold: interventions.filter(i => i.status === 'on_hold'),
    completed: interventions.filter(i => i.status === 'completed'),
    validated: interventions.filter(i => i.status === 'validated'),
    cancelled: interventions.filter(i => i.status === 'cancelled'),
  };

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Aucun établissement sélectionné</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header moderne */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interventions</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez et suivez toutes vos interventions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Toggle view mode */}
          <div className="flex border rounded-lg bg-white dark:bg-gray-800">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Liste
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          {/* Bouton SuperAdmin pour supprimer toutes les interventions */}
          {user?.role === 'super_admin' && interventions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAllDialog(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer tout ({interventions.length})
            </Button>
          )}

          {canCreateInterventions && (
            <>
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <Button size="sm" onClick={handleCreateIntervention}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle intervention
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats modernes */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="p-4 border-l-4 border-l-gray-400 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-400 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  En attente
                </p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-400 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">En cours</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                  {stats.inProgress}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-400 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Terminées</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher une intervention..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              hasActiveFilters && 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700'
            )}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtres expandables */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={filters.status?.[0] || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[160px]">
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

              <Select value={filters.priority?.[0] || 'all'} onValueChange={handlePriorityFilter}>
                <SelectTrigger className="w-[160px]">
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

              <Select value={filters.type || 'all'} onValueChange={handleTypeFilter}>
                <SelectTrigger className="w-[160px]">
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

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Contenu principal */}
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
              : 'Aucune intervention'}
          </p>
          {canCreateInterventions && !hasActiveFilters && (
            <Button className="mt-4" onClick={handleCreateIntervention}>
              <Plus className="h-4 w-4 mr-2" />
              Créer la première intervention
            </Button>
          )}
        </Card>
      ) : viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <KanbanView
            columns={kanbanColumns}
            onInterventionClick={handleInterventionClick}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
          <DragOverlay>
            {activeIntervention ? (
              <KanbanCard
                intervention={activeIntervention}
                onClick={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableView
          interventions={interventions}
          onInterventionClick={handleInterventionClick}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          itemsPerPage={displayPreferences.itemsPerPage}
        />
      )}

      {/* Dialog d'import */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Importer des interventions"
        description="Importez plusieurs interventions depuis un fichier Excel"
        templateDownloadFn={downloadInterventionsTemplate}
        onImport={importHook.handleImport}
        onConfirm={handleImportConfirm}
        onCreateMissingValues={importHook.handleCreateMissingValues}
        renderPreview={data => (
          <div className="max-h-60 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left">Titre</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Priorité</th>
                  <th className="px-3 py-2 text-left">Localisation</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((row: any, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2">{row.titre}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.priorite}</td>
                    <td className="px-3 py-2">{row.localisation || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      />

      {/* Dialog de suppression */}
      <ConfirmDialog
        isOpen={!!interventionToDelete}
        onClose={() => setInterventionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'intervention"
        description="Êtes-vous sûr de vouloir supprimer cette intervention ?"
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Dialog de confirmation pour suppression totale (SuperAdmin uniquement) */}
      <ConfirmDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Supprimer TOUTES les interventions"
        description={`⚠️ ATTENTION: Cette action est IRRÉVERSIBLE et supprimera définitivement les ${interventions.length} intervention(s) de cet établissement. Êtes-vous absolument certain de vouloir continuer ?`}
        confirmLabel={`Oui, supprimer ${interventions.length} intervention(s)`}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

InterventionsPageComponent.displayName = 'InterventionsPage';

export const InterventionsPage = memo(InterventionsPageComponent);

// ============================================================================
// VUE KANBAN AVEC DRAG & DROP
// ============================================================================

interface KanbanViewProps {
  columns: Record<InterventionStatus, Intervention[]>;
  onInterventionClick: (id: string) => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const KanbanViewComponent = ({
  columns,
  onInterventionClick,
  onEdit,
  onDelete,
}: KanbanViewProps) => {
  const columnConfig = {
    pending: { label: 'En attente', icon: Clock, color: 'orange' },
    in_progress: { label: 'En cours', icon: AlertCircle, color: 'blue' },
    on_hold: { label: 'En pause', icon: Pause, color: 'gray' },
    completed: { label: 'Terminées', icon: CheckCircle2, color: 'green' },
    validated: { label: 'Validées', icon: CheckCircle2, color: 'purple' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {(Object.entries(columnConfig) as [InterventionStatus, typeof columnConfig.pending][]).map(
        ([status, config]) => {
          // TODO: Icon unused
          // const Icon = config.icon;
          const items = columns[status] || [];

          return (
            <DroppableColumn key={status} id={status} config={config} items={items}>
              {items.map(intervention => (
                <DraggableCard
                  key={intervention.id}
                  intervention={intervention}
                  onClick={() => onInterventionClick(intervention.id)}
                  onEdit={e => onEdit(intervention.id, e)}
                  onDelete={e => onDelete(intervention.id, e)}
                />
              ))}
            </DroppableColumn>
          );
        }
      )}
    </div>
  );
};

KanbanViewComponent.displayName = 'KanbanView';

const KanbanView = memo(KanbanViewComponent);

// ============================================================================
// DROPPABLE COLUMN
// ============================================================================

interface DroppableColumnProps {
  id: string;
  config: {
    label: string;
    icon: any;
    color: string;
  };
  items: Intervention[];
  children: React.ReactNode;
}

const DroppableColumnComponent = ({ id, config, items, children }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const Icon = config.icon;

  return (
    <div className="flex flex-col min-h-[400px]">
      {/* En-tête de colonne */}
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg mb-3',
          config.color === 'orange' && 'bg-orange-100 dark:bg-orange-900/30',
          config.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
          config.color === 'gray' && 'bg-gray-100 dark:bg-gray-800',
          config.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
          config.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30'
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{config.label}</span>
        </div>
        <Badge variant="secondary" className="font-semibold">
          {items.length}
        </Badge>
      </div>

      {/* Zone de drop */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors',
          isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' : 'border-transparent'
        )}
      >
        {children}
      </div>
    </div>
  );
};

DroppableColumnComponent.displayName = 'DroppableColumn';

const DroppableColumn = memo(DroppableColumnComponent);

// ============================================================================
// DRAGGABLE CARD
// ============================================================================

interface DraggableCardProps {
  intervention: Intervention;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const DraggableCardComponent = ({
  intervention,
  onClick,
  onEdit,
  onDelete,
}: DraggableCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: intervention.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCard
        intervention={intervention}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
};

DraggableCardComponent.displayName = 'DraggableCard';

const DraggableCard = memo(DraggableCardComponent);

// ============================================================================
// KANBAN CARD (Compacte)
// ============================================================================

interface KanbanCardProps {
  intervention: Intervention;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}

const KanbanCardComponent = ({
  intervention,
  onClick,
  onEdit,
  onDelete,
  isDragging = false,
}: KanbanCardProps) => {
  const { user } = useAuth();

  const canEdit = useMemo(
    () => user?.role === 'admin' || user?.id === intervention.createdBy,
    [user?.role, user?.id, intervention.createdBy]
  );

  const canDelete = useMemo(() => user?.role === 'admin', [user?.role]);

  const timeAgo = useMemo(
    () =>
      intervention.createdAt
        ? formatDistanceToNow(intervention.createdAt.toDate(), { locale: fr, addSuffix: true })
        : '',
    [intervention.createdAt]
  );

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all',
        'border-l-4',
        intervention.priority === 'urgent' && 'border-l-red-500',
        intervention.priority === 'high' && 'border-l-orange-500',
        intervention.priority === 'normal' && 'border-l-yellow-500',
        intervention.priority === 'low' && 'border-l-blue-500',
        isDragging && 'opacity-50 shadow-xl scale-105'
      )}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2 flex-1">{intervention.title}</h4>
          {(canEdit || canDelete) && !isDragging && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onClick}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap">
          <PriorityBadge priority={intervention.priority} size="sm" />
          <TypeBadge type={intervention.type} size="sm" />
        </div>

        {/* Infos */}
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          {intervention.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{intervention.location}</span>
            </div>
          )}
          {intervention.assignedToName && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate">{intervention.assignedToName}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

KanbanCardComponent.displayName = 'KanbanCard';

const KanbanCard = memo(KanbanCardComponent);

// ============================================================================
// VUE TABLEAU AVEC COULEURS DE STATUT
// ============================================================================

interface TableViewProps {
  interventions: Intervention[];
  onInterventionClick: (id: string) => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  itemsPerPage: number;
}

const TableViewComponent = ({
  interventions,
  onInterventionClick,
  onEdit,
  onDelete,
  itemsPerPage,
}: TableViewProps) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination
  const totalPages = Math.ceil(interventions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInterventions = interventions.slice(startIndex, endIndex);

  // Reset page when interventions change
  useState(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  });

  // Couleurs par statut - memoized
  const getStatusColor = useCallback((status: InterventionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-50 dark:bg-orange-950/20 border-l-orange-400';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-950/20 border-l-blue-400';
      case 'on_hold':
        return 'bg-gray-50 dark:bg-gray-800/50 border-l-gray-400';
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/20 border-l-green-400';
      case 'validated':
        return 'bg-purple-50 dark:bg-purple-950/20 border-l-purple-400';
      default:
        return '';
    }
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                Intervention
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                Priorité
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                Localisation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                Assigné à
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentInterventions.map(intervention => {
              const canEdit =
                user?.role === 'admin' ||
                user?.role === 'super_admin' ||
                user?.id === intervention.createdBy;
              const canDelete = user?.role === 'admin' || user?.role === 'super_admin';

              return (
                <tr
                  key={intervention.id}
                  onClick={() => onInterventionClick(intervention.id)}
                  className={cn(
                    'hover:shadow-md cursor-pointer transition-all border-l-4',
                    getStatusColor(intervention.status)
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {intervention.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {intervention.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={intervention.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={intervention.priority} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={intervention.type} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{intervention.location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate block max-w-[120px]">
                      {intervention.assignedToName || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {intervention.createdAt
                        ? format(intervention.createdAt.toDate(), 'dd/MM/yy', { locale: fr })
                        : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          onClick={e => {
                            e.stopPropagation();
                            onEdit(intervention.id, e);
                          }}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={e => {
                            e.stopPropagation();
                            onDelete(intervention.id, e);
                          }}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {startIndex + 1} à {Math.min(endIndex, interventions.length)} sur{' '}
            {interventions.length} intervention(s)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Afficher seulement quelques pages autour de la page courante
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

TableViewComponent.displayName = 'TableView';

const TableView = memo(TableViewComponent);
