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
    user?.role === 'admin' || user?.role === 'super_admin' || user?.id === intervention.createdBy;
  const canDelete = user?.role === 'admin' || user?.role === 'super_admin';
  const canStart =
    intervention.status === 'pending' && (user?.id === intervention.assignedTo || canEdit);
  const canComplete =
    intervention.status === 'in_progress' && (user?.id === intervention.assignedTo || canEdit);
  const canValidate =
    intervention.status === 'completed' && (user?.role === 'admin' || user?.role === 'super_admin');

  // ============================================================================
  // ACTIONS
  // ============================================================================
  const handleStatusChange = async (newStatus: string) => {
    if (!id) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <div className="px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            {/* Gauche - Retour + Titre */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/interventions')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {intervention.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {intervention.reference || `#${intervention.id.slice(0, 8)}`}
                </p>
              </div>
            </div>

            {/* Droite - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Actions rapides de statut */}
              {canStart && (
                <Button
                  onClick={() => handleStatusChange('in_progress')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Démarrer
                </Button>
              )}
              {canComplete && (
                <Button
                  onClick={() => handleStatusChange('completed')}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Terminer
                </Button>
              )}
              {canValidate && (
                <Button
                  onClick={() => handleStatusChange('validated')}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Valider
                </Button>
              )}

              {/* Block/Unblock Room Button */}
              {intervention.roomNumber && currentRoom && (
                <>
                  {currentRoom.isBlocked ? (
                    <Button
                      variant="outline"
                      onClick={handleUnblockRoom}
                      disabled={isBlockingRoom}
                      size="sm"
                      className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Débloquer
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowBlockRoomDialog(true)}
                      disabled={isBlockingRoom}
                      size="sm"
                      className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Bloquer
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
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* eslint-disable @typescript-eslint/no-explicit-any */}
            <StatusBadgeDropdown
              currentStatus={intervention.status as any}
              interventionId={intervention.id}
              assignedTo={intervention.assignedTo}
              onStatusChange={handleStatusChange as any}
              disabled={isUpdating}
            />
            {/* eslint-enable @typescript-eslint/no-explicit-any */}
            <PriorityBadge priority={intervention.priority} />
            <TypeBadge type={intervention.type} />

            {intervention.isUrgent && (
              <Badge variant="destructive" className="bg-red-600">
                URGENT
              </Badge>
            )}
            {intervention.isBlocking && (
              <Badge variant="destructive" className="bg-orange-600">
                BLOQUANT
              </Badge>
            )}

            <span className="text-sm text-gray-500">•</span>

            {intervention.roomNumber && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Chambre {intervention.roomNumber}
                </span>
                {currentRoom && (
                  <RoomStatusBadge isBlocked={currentRoom.isBlocked} status={currentRoom.status} />
                )}
              </div>
            )}

            {intervention.assignedToName && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Assigné à {intervention.assignedToName}
                </span>
              </>
            )}

            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
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
      <div className="px-6 py-6">
        <Tabs defaultValue="details" className="space-y-6">
          {/* Liste des onglets */}
          <TabsList className="w-full justify-start h-auto p-1 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="details" className="gap-2">
              <Info className="h-4 w-4" />
              Détails
            </TabsTrigger>

            {hasFeature('comments') && (
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Commentaires
              </TabsTrigger>
            )}

            {hasFeature('photos') && (
              <TabsTrigger value="photos" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Photos
                {intervention.photosCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {intervention.photosCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}

            {hasFeature('parts') && (
              <TabsTrigger value="parts" className="gap-2">
                <Package className="h-4 w-4" />
                Pièces
              </TabsTrigger>
            )}

            {hasFeature('timeTracking') && (
              <TabsTrigger value="time" className="gap-2">
                <Clock className="h-4 w-4" />
                Temps
              </TabsTrigger>
            )}

            {hasFeature('history') && (
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Historique
              </TabsTrigger>
            )}
          </TabsList>

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
