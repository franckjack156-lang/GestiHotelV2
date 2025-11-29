/**
 * ============================================================================
 * INTERVENTION DETAILS PAGE - VERSION TECHNICIEN V3
 * ============================================================================
 *
 * Design moderne avec :
 * - Bandeau d'informations fixes (toujours visible)
 * - Système d'onglets en dessous
 * - Onglets : Détails | Commentaires | Photos | Pièces | Temps | Historique
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Info,
  MessageSquare,
  Image as ImageIcon,
  Package,
  Clock,
  History,
  Lock,
  Unlock,
  Download,
  Share2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu';
// TODO: StatusBadge imported but unused
// import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { StatusBadgeDropdown } from '@/features/interventions/components';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import { TypeBadge } from '@/features/interventions/components/badges/TypeBadge';
import { useIntervention } from '@/features/interventions/hooks/useIntervention';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useFeature } from '@/features/establishments/hooks/useFeature';
import { BlockRoomDialog, RoomStatusBadge } from '@/features/rooms/components';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
// TODO: cn imported but unused
// import { cn } from '@/shared/lib/utils';

// Onglets (à implémenter)
import { DetailsTab } from '@/features/interventions/components/tabs/DetailsTab';
import { CommentsTab } from '@/features/interventions/components/tabs/CommentsTab';
import { PhotosTab } from '@/features/interventions/components/tabs/PhotosTab';
import { PartsTab } from '@/features/interventions/components/tabs/PartsTab';
import { TimeTrackingTab } from '@/features/interventions/components/tabs/TimeTrackingTab';
import { HistoryTab } from '@/features/interventions/components/tabs/HistoryTab';

export const InterventionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { intervention, isLoading, error } = useIntervention(id!);
  const { changeStatus, deleteIntervention, isUpdating, isDeleting } = useInterventionActions();

  // Vérifier les fonctionnalités activées
  const { hasFeature } = useFeature();

  // Rooms management
  const { rooms, blockRoom, unblockRoom } = useRooms(user?.establishmentIds?.[0] || '');
  const currentRoom = rooms?.find(r => r.number === intervention?.roomNumber);

  // UI State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockRoomDialog, setShowBlockRoomDialog] = useState(false);
  const [isBlockingRoom, setIsBlockingRoom] = useState(false);

  // Loading state
  if (isLoading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (error || !intervention) {
    return <div className="text-center py-12 text-red-600">Intervention introuvable</div>;
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  const canEdit =
    user?.role === 'editor' ||
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.id === intervention.createdBy;
  const canDelete =
    user?.role === 'editor' || user?.role === 'admin' || user?.role === 'super_admin';
  const canStart =
    intervention.status === 'pending' && (user?.id === intervention.assignedTo || canEdit);
  const canComplete =
    intervention.status === 'in_progress' && (user?.id === intervention.assignedTo || canEdit);
  const canValidate =
    intervention.status === 'completed' &&
    (user?.role === 'editor' || user?.role === 'admin' || user?.role === 'super_admin');

  // ============================================================================
  // ACTIONS
  // ============================================================================
  const handleStatusChange = async (newStatus: string) => {
    if (!id) return false;
    const success = await changeStatus(id, { newStatus: newStatus as any });
    return success || false;
  };

  const handleDelete = async () => {
    if (!id) return;
    const success = await deleteIntervention(id);
    if (success) {
      toast.success('Intervention supprimée');
      navigate('/app/interventions');
    }
  };

  // TODO: estimatedDays parameter unused
  const handleBlockRoom = async (reason: string) => {
    if (!currentRoom || !user) return;
    setIsBlockingRoom(true);
    try {
      await blockRoom(currentRoom.id, { reason, userId: user.id });
      toast.success('Chambre bloquée avec succès');
      setShowBlockRoomDialog(false);
    } catch {
      toast.error('Erreur lors du blocage de la chambre');
    } finally {
      setIsBlockingRoom(false);
    }
  };

  const handleUnblockRoom = async () => {
    if (!currentRoom) return;
    setIsBlockingRoom(true);
    try {
      await unblockRoom(currentRoom.id);
      toast.success('Chambre débloquée avec succès');
    } catch {
      toast.error('Erreur lors du déblocage de la chambre');
    } finally {
      setIsBlockingRoom(false);
    }
  };

  const handleExportPDF = () => {
    toast.info('Export PDF en cours de développement');
  };

  const handleShare = () => {
    toast.info('Partage en cours de développement');
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="space-y-0">
      {/* ========================================================================
          BANDEAU D'INFORMATIONS FIXES (TOUJOURS VISIBLE)
      ======================================================================== */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10 shadow-sm">
        {/* Header avec actions */}
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            {/* Gauche - Retour + Titre */}
            <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/interventions')}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 sm:truncate">
                  {intervention.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                  {intervention.reference || `#${intervention.id.slice(0, 8)}`}
                </p>
              </div>
            </div>

            {/* Droite - Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
              {/* Actions rapides de statut */}
              {canStart && (
                <Button
                  onClick={() => handleStatusChange('in_progress')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <PlayCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Démarrer</span>
                </Button>
              )}
              {canComplete && (
                <Button
                  onClick={() => handleStatusChange('completed')}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Terminer</span>
                </Button>
              )}
              {canValidate && (
                <Button
                  onClick={() => handleStatusChange('validated')}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Valider</span>
                </Button>
              )}

              {/* Block/Unblock Room Button - Masqué sur très petit mobile */}
              {intervention.roomNumber && currentRoom && (
                <>
                  {currentRoom.isBlocked ? (
                    <Button
                      variant="outline"
                      onClick={handleUnblockRoom}
                      disabled={isBlockingRoom}
                      size="sm"
                      className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 hidden xs:flex"
                    >
                      <Unlock className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Débloquer</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowBlockRoomDialog(true)}
                      disabled={isBlockingRoom}
                      size="sm"
                      className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hidden xs:flex"
                    >
                      <Lock className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Bloquer</span>
                    </Button>
                  )}
                </>
              )}

              {/* Menu actions secondaires */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={() => navigate(`/app/interventions/${intervention.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Partager
                  </DropdownMenuItem>
                  {intervention.status === 'in_progress' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Mettre en pause
                      </DropdownMenuItem>
                    </>
                  )}
                  {intervention.status === 'on_hold' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Reprendre
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Informations rapides (badges et infos clés) */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <StatusBadgeDropdown
              currentStatus={intervention.status as any}
              interventionId={intervention.id}
              assignedTo={intervention.assignedTo}
              onStatusChange={handleStatusChange as any}
              disabled={isUpdating}
            />
            {}
            <PriorityBadge priority={intervention.priority} />
            <TypeBadge type={intervention.type} />

            {intervention.isUrgent && (
              <Badge variant="destructive" className="bg-red-600 text-xs">
                URGENT
              </Badge>
            )}
            {intervention.isBlocking && (
              <Badge variant="destructive" className="bg-orange-600 text-xs">
                BLOQUANT
              </Badge>
            )}

            {/* Séparateur visible uniquement sur desktop */}
            <span className="hidden sm:inline text-sm text-gray-500">•</span>

            {intervention.roomNumber && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Chambre {intervention.roomNumber}
                </span>
                {currentRoom && (
                  <RoomStatusBadge isBlocked={currentRoom.isBlocked} status={currentRoom.status} />
                )}
              </div>
            )}

            {intervention.assignedToName && (
              <>
                <span className="hidden sm:inline text-sm text-gray-500">•</span>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px] sm:max-w-none">
                  Assigné à {intervention.assignedToName}
                </span>
              </>
            )}

            {/* Date visible uniquement sur desktop */}
            <span className="hidden md:inline text-sm text-gray-500">•</span>
            <span className="hidden md:inline text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Créé{' '}
              {intervention.createdAt &&
                format(intervention.createdAt.toDate(), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================
          ONGLETS AVEC CONTENU
      ======================================================================== */}
      <div className="px-3 sm:px-6 py-4 sm:py-6">
        <Tabs defaultValue="details" className="space-y-4 sm:space-y-6">
          {/* Liste des onglets - Scrollable sur mobile */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="inline-flex w-max sm:w-full justify-start h-auto p-1 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="details" className="gap-1.5 sm:gap-2 whitespace-nowrap">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Détails</span>
              </TabsTrigger>

              {hasFeature('comments') && (
                <TabsTrigger value="comments" className="gap-1.5 sm:gap-2 whitespace-nowrap">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Commentaires</span>
                </TabsTrigger>
              )}

              {hasFeature('photos') && (
                <TabsTrigger value="photos" className="gap-1.5 sm:gap-2 whitespace-nowrap">
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Photos</span>
                  {intervention.photosCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 text-[10px] sm:text-xs"
                    >
                      {intervention.photosCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}

              {hasFeature('parts') && (
                <TabsTrigger value="parts" className="gap-1.5 sm:gap-2 whitespace-nowrap">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Pièces</span>
                </TabsTrigger>
              )}

              {hasFeature('timeTracking') && (
                <TabsTrigger value="time" className="gap-1.5 sm:gap-2 whitespace-nowrap">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Temps</span>
                </TabsTrigger>
              )}

              {hasFeature('history') && (
                <TabsTrigger value="history" className="gap-1.5 sm:gap-2 whitespace-nowrap">
                  <History className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Historique</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Contenu des onglets */}
          <TabsContent value="details" className="mt-6">
            <DetailsTab intervention={intervention} />
          </TabsContent>

          {hasFeature('comments') && (
            <TabsContent value="comments" className="mt-6">
              <CommentsTab interventionId={intervention.id} />
            </TabsContent>
          )}

          {hasFeature('photos') && (
            <TabsContent value="photos" className="mt-6">
              <PhotosTab interventionId={intervention.id} />
            </TabsContent>
          )}

          {hasFeature('parts') && (
            <TabsContent value="parts" className="mt-6">
              <PartsTab
                interventionId={intervention.id}
                interventionNumber={intervention.id}
                roomNumber={intervention.roomNumber}
              />
            </TabsContent>
          )}

          {hasFeature('timeTracking') && (
            <TabsContent value="time" className="mt-6">
              <TimeTrackingTab intervention={intervention} />
            </TabsContent>
          )}

          {hasFeature('history') && (
            <TabsContent value="history" className="mt-6">
              <HistoryTab intervention={intervention} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ========================================================================
          DIALOGS
      ======================================================================== */}

      {/* Dialog de blocage de chambre */}
      {showBlockRoomDialog && currentRoom && (
        <BlockRoomDialog
          isOpen={showBlockRoomDialog}
          onClose={() => setShowBlockRoomDialog(false)}
          onConfirm={handleBlockRoom}
          roomNumber={currentRoom.number}
          establishmentId={user?.establishmentIds?.[0]}
          isLoading={isBlockingRoom}
        />
      )}

      {/* Dialog de suppression */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterventionDetailsPage;
