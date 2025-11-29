/**
 * ============================================================================
 * INTERVENTIONS PAGE - MODERN REDESIGN WITH DRAG & DROP
 * ============================================================================
 *
 * Design moderne avec 2 vues:
 * - Kanban: Colonnes par statut avec drag & drop
 * - Table: Tableau compact et élégant avec couleurs de statut
 */

import { useState, memo, useCallback, useMemo, useEffect } from 'react';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  FileDown,
} from 'lucide-react';
import { ReferenceDisplay } from '@/shared/components/ReferenceDisplay';
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
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
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
  InterventionPriority,
  InterventionType,
} from '@/shared/types/status.types';
import { format, formatDistanceToNow } from 'date-fns';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
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
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import { generateInterventionsPDF, downloadPDF } from '@/shared/services/pdfService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

const InterventionsPageComponent = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { canCreateInterventions } = usePermissions();
  const { user } = useAuth();

  const {
    allInterventions: interventions,
    isLoading,
    error,
    filters,
    stats,
    applyFilters,
    clearFilters,
  } = useInterventions();
  const { displayPreferences } = useUserPreferences();
  const { data: referenceListsData } = useAllReferenceLists({ autoLoad: true });

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
  const [showCompletedInKanban, setShowCompletedInKanban] = useState(false);
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const [deletedInterventions, setDeletedInterventions] = useState<Intervention[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [trashActionLoading, setTrashActionLoading] = useState<string | null>(null);

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
  };

  // Gérer les filtres
  const handleStatusFilter = (value: string) => {
    if (value === 'all') {
      applyFilters({ status: undefined });
    } else {
      applyFilters({ status: [value as InterventionStatus] });
    }
  };

  const handlePriorityFilter = (value: string) => {
    if (value === 'all') {
      applyFilters({ priority: undefined });
    } else {
      applyFilters({ priority: [value as InterventionPriority] });
    }
  };

  const handleTypeFilter = (value: string) => {
    if (value === 'all') {
      applyFilters({ type: undefined });
    } else {
      applyFilters({ type: value as InterventionType });
    }
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
    } catch {
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
    } catch {
      toast.error('Erreur lors de la suppression massive');
    }
  };

  const handleRefresh = () => window.location.reload();

  // === FONCTIONS CORBEILLE ===
  const loadDeletedInterventions = useCallback(async () => {
    if (!establishmentId) return;
    setLoadingTrash(true);
    try {
      const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
      const q = query(interventionsRef, where('isDeleted', '==', true));
      const snapshot = await getDocs(q);
      const deleted = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Intervention[];
      // Trier par date de suppression (plus récent en premier)
      deleted.sort((a, b) => {
        const interventionA = a as Intervention & { deletedAt?: Timestamp };
        const interventionB = b as Intervention & { deletedAt?: Timestamp };
        const dateA = interventionA.deletedAt?.toDate?.()?.getTime() || 0;
        const dateB = interventionB.deletedAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      });
      setDeletedInterventions(deleted);
    } catch (error) {
      toast.error('Erreur lors du chargement de la corbeille');
    } finally {
      setLoadingTrash(false);
    }
  }, [establishmentId]);

  const handleRestoreIntervention = async (interventionId: string) => {
    if (!establishmentId) return;
    setTrashActionLoading(interventionId);
    try {
      const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
      await updateDoc(docRef, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: Timestamp.now(),
        restoredBy: user?.id || 'unknown',
      });
      toast.success('Intervention restaurée');
      await loadDeletedInterventions();
      handleRefresh(); // Rafraîchir la liste principale
    } catch (error) {
      toast.error('Erreur lors de la restauration');
    } finally {
      setTrashActionLoading(null);
    }
  };

  const handlePermanentDelete = async (interventionId: string) => {
    if (!establishmentId) return;
    if (!confirm('Supprimer définitivement cette intervention ? Cette action est irréversible.')) {
      return;
    }
    setTrashActionLoading(interventionId);
    try {
      const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
      await deleteDoc(docRef);
      toast.success('Intervention supprimée définitivement');
      await loadDeletedInterventions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setTrashActionLoading(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!establishmentId) return;
    if (deletedInterventions.length === 0) return;
    if (
      !confirm(
        `Vider la corbeille ? Cette action supprimera définitivement ${deletedInterventions.length} intervention(s). Cette action est irréversible.`
      )
    ) {
      return;
    }
    setTrashActionLoading('all');
    try {
      const toastId = toast.loading(
        `Suppression de ${deletedInterventions.length} intervention(s)...`
      );

      // Supprimer par lots de 10
      const batchSize = 10;
      for (let i = 0; i < deletedInterventions.length; i += batchSize) {
        const batch = deletedInterventions.slice(i, i + batchSize);
        await Promise.all(
          batch.map(intervention => {
            const docRef = doc(
              db,
              'establishments',
              establishmentId,
              'interventions',
              intervention.id
            );
            return deleteDoc(docRef);
          })
        );
      }

      toast.success(`${deletedInterventions.length} intervention(s) supprimée(s) définitivement`, {
        id: toastId,
      });
      await loadDeletedInterventions();
    } catch (error) {
      toast.error('Erreur lors du vidage de la corbeille');
    } finally {
      setTrashActionLoading(null);
    }
  };

  // Charger les interventions supprimées quand le dialog s'ouvre
  useEffect(() => {
    if (trashDialogOpen) {
      loadDeletedInterventions();
    }
  }, [trashDialogOpen, loadDeletedInterventions]);

  const handleImportConfirm = async (data: Record<string, unknown>[]) => {
    try {
      // Cast explicite car ImportDialog utilise un type générique Record<string, unknown>[]
      // mais le hook attend InterventionImportRow[] qui est compatible
      await importHook.handleConfirm(
        data as unknown as Parameters<typeof importHook.handleConfirm>[0]
      );
      toast.success('Import réussi', { description: `${data.length} intervention(s) importée(s)` });
      setImportDialogOpen(false);
    } catch {
      toast.error("Erreur lors de l'import");
    }
  };

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Génération du PDF en cours...');

      const blob = await generateInterventionsPDF(filteredInterventions, {
        title: 'Liste des interventions',
        subtitle: `${filteredInterventions.length} intervention(s)`,
        orientation: 'landscape',
      });

      const filename = `interventions_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
      downloadPDF(blob, filename);

      toast.success('PDF généré avec succès', { id: toastId });
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
      console.error('Export PDF error:', error);
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
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Filtrer les interventions par recherche
  const filteredInterventions = useMemo(() => {
    if (!searchQuery.trim()) {
      return interventions;
    }

    const query = searchQuery.toLowerCase().trim();

    return interventions.filter(intervention => {
      // Recherche dans le titre
      if (intervention.title?.toLowerCase().includes(query)) {
        return true;
      }

      // Recherche dans la description
      if (intervention.description?.toLowerCase().includes(query)) {
        return true;
      }

      // Recherche dans le numéro de chambre
      if (intervention.roomNumber?.toLowerCase().includes(query)) {
        return true;
      }

      // Recherche dans la localisation
      if (intervention.location?.toLowerCase().includes(query)) {
        return true;
      }

      // Recherche dans le bâtiment
      if (intervention.building?.toLowerCase().includes(query)) {
        return true;
      }

      // Recherche dans l'étage (peut être string ou number)
      if (intervention.floor?.toString().toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [interventions, searchQuery]);

  const hasActiveFilters =
    filters.status || filters.priority || filters.type || filters.search || searchQuery;

  // Grouper par statut pour le Kanban
  const kanbanColumns = {
    draft: filteredInterventions.filter(i => i.status === 'draft'),
    pending: filteredInterventions.filter(i => i.status === 'pending'),
    assigned: filteredInterventions.filter(i => i.status === 'assigned'),
    in_progress: filteredInterventions.filter(i => i.status === 'in_progress'),
    on_hold: filteredInterventions.filter(i => i.status === 'on_hold'),
    // Les interventions terminées ne sont affichées que si l'option est activée
    completed: showCompletedInKanban
      ? filteredInterventions.filter(i => i.status === 'completed')
      : [],
    validated: showCompletedInKanban
      ? filteredInterventions.filter(i => i.status === 'validated')
      : [],
    cancelled: filteredInterventions.filter(i => i.status === 'cancelled'),
  };

  // Récupérer les couleurs depuis les listes de référence
  const statusColors = useMemo(() => {
    const statusList = referenceListsData?.lists?.interventionStatuses;
    if (!statusList?.items) {
      // Couleurs par défaut si pas de liste de référence
      // Couleurs autorisées: gray, red, orange, yellow, green, blue, indigo, purple, pink
      return {
        draft: 'gray',
        pending: 'yellow',
        assigned: 'blue',
        in_progress: 'indigo',
        on_hold: 'orange',
        completed: 'green',
        validated: 'purple',
        cancelled: 'red',
      };
    }

    // Créer un mapping value → color depuis la liste de référence
    const colorMap: Record<string, string> = {};
    statusList.items.forEach(item => {
      if (item.value && item.color) {
        colorMap[item.value] = item.color;
      }
    });

    // Fallback sur couleurs par défaut si certaines couleurs manquent
    return {
      draft: colorMap.draft || 'gray',
      pending: colorMap.pending || 'yellow',
      assigned: colorMap.assigned || 'blue',
      in_progress: colorMap.in_progress || 'indigo',
      on_hold: colorMap.on_hold || 'orange',
      completed: colorMap.completed || 'green',
      validated: colorMap.validated || 'purple',
      cancelled: colorMap.cancelled || 'red',
    };
  }, [referenceListsData]);

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Aucun établissement sélectionné</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header moderne */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Interventions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Gérez et suivez toutes vos interventions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          {/* Toggle view mode */}
          <div className="flex border rounded-lg bg-white dark:bg-gray-800 flex-shrink-0">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-r-none flex-1 sm:flex-initial"
            >
              <LayoutGrid className="h-4 w-4 sm:mr-2" />
              <span className="hidden xs:inline">Kanban</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none flex-1 sm:flex-initial"
            >
              <TableIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden xs:inline">Liste</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 sm:flex-initial"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualiser</span>
            </Button>

            {/* Bouton Export PDF */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={filteredInterventions.length === 0}
              className="flex-1 sm:flex-initial"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Exporter PDF</span>
            </Button>

            {/* Bouton Corbeille */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrashDialogOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Corbeille</span>
            </Button>

            {/* Bouton Editor/SuperAdmin pour supprimer toutes les interventions */}
            {(user?.role === 'editor' || user?.role === 'super_admin') && interventions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteAllDialog(true)}
                className="bg-red-600 hover:bg-red-700 hidden md:flex"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer tout ({interventions.length})
              </Button>
            )}

            {canCreateInterventions && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                  className="flex-1 sm:flex-initial"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Importer</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateIntervention}
                  className="flex-1 sm:flex-initial"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden xs:inline">Nouvelle</span>
                </Button>
              </>
            )}
          </div>
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

        {/* Checkbox pour afficher les interventions terminées (Kanban uniquement) */}
        {viewMode === 'kanban' && (
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="showCompleted"
              checked={showCompletedInKanban}
              onCheckedChange={checked => setShowCompletedInKanban(checked as boolean)}
            />
            <Label
              htmlFor="showCompleted"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Afficher les interventions terminées et validées
            </Label>
          </div>
        )}

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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    clearFilters();
                  }}
                >
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
      ) : filteredInterventions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {hasActiveFilters
              ? 'Aucune intervention ne correspond aux filtres ou à la recherche'
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
            showCompleted={showCompletedInKanban}
            statusColors={statusColors}
          />
          <DragOverlay>
            {activeIntervention ? (
              <KanbanCard
                intervention={activeIntervention}
                onClick={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragging
                statusColor={statusColors[activeIntervention.status]}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableView
          interventions={filteredInterventions}
          onInterventionClick={handleInterventionClick}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          itemsPerPage={displayPreferences.itemsPerPage}
        />
      )}

      {/* Dialog Corbeille */}
      <Dialog open={trashDialogOpen} onOpenChange={setTrashDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Corbeille ({deletedInterventions.length})
            </DialogTitle>
            <DialogDescription>
              Les interventions supprimées sont conservées 30 jours avant suppression automatique
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingTrash ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : deletedInterventions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trash2 className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">La corbeille est vide</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deletedInterventions.map(intervention => {
                  const interventionWithDeleted = intervention as Intervention & { deletedAt?: Timestamp };
                  const deletedAt = interventionWithDeleted.deletedAt?.toDate?.();
                  return (
                    <div
                      key={intervention.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {intervention.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Supprimé{' '}
                          {deletedAt
                            ? formatDistanceToNow(deletedAt, { addSuffix: true, locale: fr })
                            : 'récemment'}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreIntervention(intervention.id)}
                          disabled={trashActionLoading === intervention.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {trashActionLoading === intervention.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline ml-1">Restaurer</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePermanentDelete(intervention.id)}
                          disabled={trashActionLoading === intervention.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {trashActionLoading === intervention.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline ml-1">Supprimer</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t">
            {deletedInterventions.length > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyTrash}
                disabled={trashActionLoading === 'all'}
              >
                {trashActionLoading === 'all' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Vider la corbeille
              </Button>
            ) : (
              <div />
            )}
            <Button variant="outline" onClick={() => setTrashDialogOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                {data.slice(0, 5).map((row: Record<string, unknown>, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2">{String(row.titre)}</td>
                    <td className="px-3 py-2">{String(row.type)}</td>
                    <td className="px-3 py-2">{String(row.priorite)}</td>
                    <td className="px-3 py-2">
                      {row.numero_chambre
                        ? `Chambre ${String(row.numero_chambre)}`
                        : String(row.localisation || row.batiment || '-')}
                    </td>
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
  showCompleted?: boolean;
  statusColors: Record<string, string>;
}

const KanbanViewComponent = ({
  columns,
  onInterventionClick,
  onEdit,
  onDelete,
  showCompleted = false,
  statusColors,
}: KanbanViewProps) => {
  const columnConfig = {
    draft: { label: 'Brouillon', icon: Edit, color: statusColors.draft },
    pending: { label: 'En attente', icon: Clock, color: statusColors.pending },
    assigned: { label: 'Assignées', icon: User, color: statusColors.assigned },
    in_progress: { label: 'En cours', icon: AlertCircle, color: statusColors.in_progress },
    on_hold: { label: 'En pause', icon: Pause, color: statusColors.on_hold },
    completed: { label: 'Terminées', icon: CheckCircle2, color: statusColors.completed },
    validated: { label: 'Validées', icon: CheckCircle2, color: statusColors.validated },
    cancelled: { label: 'Annulées', icon: X, color: statusColors.cancelled },
  };

  // Filtrer les colonnes selon showCompleted
  const visibleColumns = Object.entries(columnConfig).filter(([status]) => {
    // Masquer les colonnes 'completed' et 'validated' si showCompleted est false
    if (!showCompleted && (status === 'completed' || status === 'validated')) {
      return false;
    }
    return true;
  });

  // Calculer le nombre de colonnes pour la grille
  const gridCols = visibleColumns.length;
  const gridClass = cn(
    'grid gap-4',
    gridCols === 6 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    gridCols === 8 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8'
  );

  return (
    <div className={gridClass}>
      {visibleColumns.map(([status, config]) => {
        const items = columns[status as InterventionStatus] || [];

        return (
          <DroppableColumn key={status} id={status} config={config} items={items}>
            {items.map(intervention => (
              <DraggableCard
                key={intervention.id}
                intervention={intervention}
                onClick={() => onInterventionClick(intervention.id)}
                onEdit={e => onEdit(intervention.id, e)}
                onDelete={e => onDelete(intervention.id, e)}
                statusColor={config.color}
              />
            ))}
          </DroppableColumn>
        );
      })}
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
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  };
  items: Intervention[];
  children: React.ReactNode;
}

const DroppableColumnComponent = ({ id, config, items, children }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const Icon = config.icon;

  // Convertir la couleur en style CSS
  const getColorStyle = (color: string): React.CSSProperties => {
    // Si c'est un code hex ou rgb, l'utiliser directement
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return {
        backgroundColor: `${color}20`, // Ajouter 20 pour l'opacité (hex alpha)
      };
    }

    // Sinon, mapping des couleurs Tailwind vers hex
    const tailwindColors: Record<string, string> = {
      slate: '#64748b',
      gray: '#6b7280',
      zinc: '#71717a',
      neutral: '#737373',
      stone: '#78716c',
      red: '#ef4444',
      orange: '#f97316',
      amber: '#f59e0b',
      yellow: '#eab308',
      lime: '#84cc16',
      green: '#22c55e',
      emerald: '#10b981',
      teal: '#14b8a6',
      cyan: '#06b6d4',
      sky: '#0ea5e9',
      blue: '#3b82f6',
      indigo: '#6366f1',
      violet: '#8b5cf6',
      purple: '#a855f7',
      fuchsia: '#d946ef',
      pink: '#ec4899',
      rose: '#f43f5e',
    };

    const hexColor = tailwindColors[color] || '#6b7280'; // gray par défaut
    return {
      backgroundColor: `${hexColor}20`, // Opacité de 12.5% (20 en hex)
    };
  };

  return (
    <div className="flex flex-col min-h-[400px]">
      {/* En-tête de colonne */}
      <div
        className="flex items-center justify-between p-3 rounded-lg mb-3"
        style={getColorStyle(config.color)}
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
  statusColor?: string;
}

const DraggableCardComponent = ({
  intervention,
  onClick,
  onEdit,
  onDelete,
  statusColor,
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
        statusColor={statusColor}
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
  statusColor?: string;
}

const KanbanCardComponent = ({
  intervention,
  onClick,
  onEdit,
  onDelete,
  isDragging = false,
  statusColor,
}: KanbanCardProps) => {
  const { user } = useAuth();

  const canEdit = useMemo(
    () => user?.role === 'editor' || user?.role === 'super_admin' || user?.role === 'admin' || user?.id === intervention.createdBy,
    [user?.role, user?.id, intervention.createdBy]
  );

  const canDelete = useMemo(() => user?.role === 'editor' || user?.role === 'super_admin' || user?.role === 'admin', [user?.role]);

  const timeAgo = useMemo(
    () =>
      intervention.createdAt
        ? formatDistanceToNow(intervention.createdAt.toDate(), { locale: fr, addSuffix: true })
        : '',
    [intervention.createdAt]
  );

  // Obtenir la couleur de bordure selon le statut
  const getStatusBorderColor = (): string => {
    if (!statusColor) return '#d1d5db'; // gray-300 par défaut

    // Si c'est un code hex ou rgb, l'utiliser directement
    if (statusColor.startsWith('#') || statusColor.startsWith('rgb')) {
      return statusColor;
    }

    // Sinon, mapping des couleurs Tailwind vers hex
    const tailwindColors: Record<string, string> = {
      slate: '#64748b',
      gray: '#6b7280',
      zinc: '#71717a',
      neutral: '#737373',
      stone: '#78716c',
      red: '#ef4444',
      orange: '#f97316',
      amber: '#f59e0b',
      yellow: '#eab308',
      lime: '#84cc16',
      green: '#22c55e',
      emerald: '#10b981',
      teal: '#14b8a6',
      cyan: '#06b6d4',
      sky: '#0ea5e9',
      blue: '#3b82f6',
      indigo: '#6366f1',
      violet: '#8b5cf6',
      purple: '#a855f7',
      fuchsia: '#d946ef',
      pink: '#ec4899',
      rose: '#f43f5e',
    };

    return tailwindColors[statusColor] || '#6b7280';
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group p-0 cursor-grab active:cursor-grabbing transition-all duration-200 overflow-hidden',
        'border-t-4 border-x border-b',
        'bg-white dark:bg-gray-900',
        'hover:shadow-lg hover:scale-[1.02]',
        isDragging && 'opacity-50 shadow-2xl scale-105 rotate-2'
      )}
      style={{
        borderTopColor: getStatusBorderColor(),
      }}
    >
      {/* En-tête avec titre et menu */}
      <div className="px-3.5 pt-3.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 flex-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {intervention.title}
          </h4>
          {(canEdit || canDelete) && !isDragging && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
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
      </div>

      {/* Badges dans une bande grise très légère */}
      <div className="px-3.5 py-2 bg-gray-50/50 dark:bg-gray-800/30 border-y border-gray-100 dark:border-gray-800">
        <div className="flex gap-1.5 flex-wrap">
          <PriorityBadge priority={intervention.priority} size="sm" />
          <TypeBadge type={intervention.type} size="sm" />
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="px-3.5 py-3 space-y-2">
        {/* Localisation */}
        {(intervention.roomNumber || intervention.location || intervention.building) && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
              {intervention.roomNumber ? (
                `Chambre ${intervention.roomNumber}`
              ) : intervention.location ? (
                <ReferenceDisplay listKey="interventionLocations" value={intervention.location} />
              ) : intervention.building ? (
                <ReferenceDisplay listKey="buildings" value={intervention.building} />
              ) : null}
            </span>
          </div>
        )}

        {/* Assigné à */}
        {intervention.assignedToName && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950">
              <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
              {intervention.assignedToName}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800">
            <Clock className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-gray-500 dark:text-gray-400">{timeAgo}</span>
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

type SortField = 'title' | 'status' | 'priority' | 'type' | 'location' | 'assignedTo' | 'date';
type SortDirection = 'asc' | 'desc';

const TableViewComponent = ({
  interventions,
  onInterventionClick,
  onEdit,
  onDelete,
  itemsPerPage,
}: TableViewProps) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fonction de tri
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        // Si on clique sur la même colonne, inverser la direction
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        // Nouvelle colonne, ordre croissant par défaut (sauf pour la date)
        setSortField(field);
        setSortDirection(field === 'date' ? 'desc' : 'asc');
      }
      setCurrentPage(1); // Retour à la première page après tri
    },
    [sortField]
  );

  // Trier les interventions
  const sortedInterventions = useMemo(() => {
    const sorted = [...interventions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'fr');
          break;
        case 'status':
          comparison = (STATUS_LABELS[a.status] || '').localeCompare(
            STATUS_LABELS[b.status] || '',
            'fr'
          );
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = {
            critical: 5,
            urgent: 4,
            high: 3,
            normal: 2,
            low: 1,
          };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'type':
          comparison = (INTERVENTION_TYPE_LABELS[a.type] || '').localeCompare(
            INTERVENTION_TYPE_LABELS[b.type] || '',
            'fr'
          );
          break;
        case 'location':
          const locationA = a.roomNumber || a.location || a.building || '';
          const locationB = b.roomNumber || b.location || b.building || '';
          comparison = locationA.localeCompare(locationB, 'fr');
          break;
        case 'assignedTo':
          comparison = (a.assignedToName || '').localeCompare(b.assignedToName || '', 'fr');
          break;
        case 'date':
          const dateA = a.createdAt?.toDate().getTime() || 0;
          const dateB = b.createdAt?.toDate().getTime() || 0;
          comparison = dateA - dateB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [interventions, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedInterventions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInterventions = sortedInterventions.slice(startIndex, endIndex);

  // Reset page when interventions change
  useState(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  });

  // Composant pour les en-têtes triables
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    const Icon = isActive ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
      <th
        className={cn(
          'px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-all',
          'hover:bg-white/50 dark:hover:bg-gray-700/50',
          isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
        )}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2 group">
          <span>{children}</span>
          <Icon
            className={cn(
              'h-3.5 w-3.5 transition-all',
              isActive
                ? 'text-blue-600 dark:text-blue-400 opacity-100'
                : 'text-gray-400 opacity-0 group-hover:opacity-50'
            )}
          />
        </div>
      </th>
    );
  };

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: '0 8px' }}>
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              <SortableHeader field="title">Intervention</SortableHeader>
              <SortableHeader field="status">Statut</SortableHeader>
              <th
                className="hidden md:table-cell px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-all hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-2 group">
                  <span>Priorité</span>
                  <ArrowUpDown className="h-3.5 w-3.5 transition-all text-gray-400 opacity-0 group-hover:opacity-50" />
                </div>
              </th>
              <th
                className="hidden lg:table-cell px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-all hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2 group">
                  <span>Type</span>
                  <ArrowUpDown className="h-3.5 w-3.5 transition-all text-gray-400 opacity-0 group-hover:opacity-50" />
                </div>
              </th>
              <th
                className="hidden sm:table-cell px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-all hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-2 group">
                  <span>Localisation</span>
                  <ArrowUpDown className="h-3.5 w-3.5 transition-all text-gray-400 opacity-0 group-hover:opacity-50" />
                </div>
              </th>
              <th
                className="hidden xl:table-cell px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-all hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                onClick={() => handleSort('assignedTo')}
              >
                <div className="flex items-center gap-2 group">
                  <span>Assigné à</span>
                  <ArrowUpDown className="h-3.5 w-3.5 transition-all text-gray-400 opacity-0 group-hover:opacity-50" />
                </div>
              </th>
              <th
                className="hidden lg:table-cell px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-all hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2 group">
                  <span>Date</span>
                  <ArrowUpDown className="h-3.5 w-3.5 transition-all text-gray-400 opacity-0 group-hover:opacity-50" />
                </div>
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <span className="hidden sm:inline">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 dark:bg-gray-950">
            {currentInterventions.map(intervention => {
              const canEdit =
                user?.role === 'editor' ||
                user?.role === 'admin' ||
                user?.role === 'super_admin' ||
                user?.id === intervention.createdBy;
              const canDelete = user?.role === 'editor' || user?.role === 'admin' || user?.role === 'super_admin';

              const getStatusBorderColor = () => {
                switch (intervention.status) {
                  case 'draft':
                    return '#9ca3af'; // gray-400
                  case 'pending':
                    return '#f97316'; // orange-500
                  case 'assigned':
                    return '#eab308'; // yellow-500
                  case 'in_progress':
                    return '#3b82f6'; // blue-500
                  case 'on_hold':
                    return '#6b7280'; // gray-500
                  case 'completed':
                    return '#22c55e'; // green-500
                  case 'validated':
                    return '#a855f7'; // purple-500
                  case 'cancelled':
                    return '#ef4444'; // red-500
                  default:
                    return '#d1d5db'; // gray-300
                }
              };

              return (
                <tr
                  key={intervention.id}
                  onClick={() => onInterventionClick(intervention.id)}
                  className={cn(
                    'group cursor-pointer transition-all duration-200',
                    'bg-white dark:bg-gray-900',
                    'border border-gray-200 dark:border-gray-700',
                    'rounded-lg',
                    'shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
                    'hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]',
                    'hover:scale-[1.01]',
                    'hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {/* Titre et description - première cellule avec arrondi gauche et bandeau de couleur */}
                  <td
                    className="px-4 py-3.5 rounded-l-lg"
                    style={{
                      borderLeft: `5px solid ${getStatusBorderColor()}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {intervention.title}
                        </p>
                        {intervention.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {intervention.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Statut */}
                  <td className="px-3 py-3.5">
                    <StatusBadge status={intervention.status} size="sm" />
                  </td>

                  {/* Priorité - Masquée sur mobile */}
                  <td className="hidden md:table-cell px-3 py-3.5">
                    <PriorityBadge priority={intervention.priority} size="sm" />
                  </td>

                  {/* Type - Masqué sur tablette et mobile */}
                  <td className="hidden lg:table-cell px-3 py-3.5">
                    <TypeBadge type={intervention.type} size="sm" />
                  </td>

                  {/* Localisation - Masquée sur très petit mobile */}
                  <td className="hidden sm:table-cell px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                        {intervention.roomNumber ? (
                          `Chambre ${intervention.roomNumber}`
                        ) : intervention.location ? (
                          <ReferenceDisplay
                            listKey="interventionLocations"
                            value={intervention.location}
                          />
                        ) : intervention.building ? (
                          <ReferenceDisplay listKey="buildings" value={intervention.building} />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Assigné à - Masqué sur tablette et mobile */}
                  <td className="hidden xl:table-cell px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/50">
                        <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                        {intervention.assignedToName || <span className="text-gray-400">-</span>}
                      </span>
                    </div>
                  </td>

                  {/* Date - Masquée sur tablette et mobile */}
                  <td className="hidden lg:table-cell px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800">
                        <Clock className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {intervention.createdAt
                          ? format(intervention.createdAt.toDate(), 'dd/MM/yy', { locale: fr })
                          : '-'}
                      </span>
                    </div>
                  </td>

                  {/* Actions - dernière cellule avec arrondi droit */}
                  <td className="px-3 py-3.5 rounded-r-lg" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-white hover:bg-blue-600 transition-colors"
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
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-white hover:bg-red-600 transition-colors"
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
        <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            <span className="text-gray-900 dark:text-white">{startIndex + 1}</span>
            {' - '}
            <span className="text-gray-900 dark:text-white">
              {Math.min(endIndex, sortedInterventions.length)}
            </span>
            {' sur '}
            <span className="text-gray-900 dark:text-white">{sortedInterventions.length}</span>
            {' intervention'}
            {sortedInterventions.length > 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
            <div className="hidden sm:flex items-center gap-1">
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
                      className={cn(
                        'min-w-[36px] h-9',
                        currentPage === page && 'bg-blue-600 hover:bg-blue-700 text-white'
                      )}
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-gray-400">
                      •••
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
              className="gap-1"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

TableViewComponent.displayName = 'TableView';

const TableView = memo(TableViewComponent);
