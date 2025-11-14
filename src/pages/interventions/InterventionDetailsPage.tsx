/**
 * ============================================================================
 * INTERVENTION DETAILS PAGE - REDESIGN COMPLET V2
 * ============================================================================
 *
 * Design moderne avec :
 * - Hero section avec photo de fond
 * - Tabs pour organiser le contenu
 * - Cards épurées et modernes
 * - Animations fluides
 * - Layout responsive optimisé
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Share2,
  Clock,
  MapPin,
  User,
  Calendar,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  MessageSquare,
  Image as ImageIcon,
  MoreVertical,
  Info,
  History,
  FileText,
  Send,
  Zap,
  Eye,
  Building2,
  Phone,
  Mail,
  Tag,
  Activity,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu';
import {
  Timeline,
  ImageLightbox,
  ConfirmDialog,
  UserAvatar,
  LoadingSkeleton,
} from '@/shared/components/ui-extended';
import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import { TypeBadge } from '@/features/interventions/components/badges/TypeBadge';
import { useIntervention } from '@/features/interventions/hooks/useIntervention';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import exportService from '@/shared/services/exportService';

export const InterventionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { intervention, isLoading, error } = useIntervention(id!);
  const { updateStatus, deleteIntervention, addComment, isUpdating, isDeleting } =
    useInterventionActions();

  // UI State
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Calculer le temps écoulé
  const elapsedTime = intervention?.createdAt
    ? formatDistanceToNow(intervention.createdAt.toDate(), {
        locale: fr,
        addSuffix: true,
      })
    : null;

  // Actions rapides selon le rôle et le statut
  const canEdit = user?.role === 'admin' || user?.id === intervention?.createdBy;
  const canDelete = user?.role === 'admin';
  const canStart = intervention?.status === 'pending' && user?.id === intervention?.assignedTo;
  const canComplete =
    intervention?.status === 'in_progress' && user?.id === intervention?.assignedTo;
  const canValidate = intervention?.status === 'completed' && user?.role === 'admin';

  // Gérer le changement de statut
  const handleStatusChange = async (newStatus: string) => {
    if (!intervention) return;

    try {
      await updateStatus(intervention.id, newStatus as any);
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Gérer la suppression
  const handleDelete = async () => {
    if (!intervention) return;

    try {
      await deleteIntervention(intervention.id);
      toast.success('Intervention supprimée');
      navigate('/app/interventions');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Gérer l'envoi de message
  const handleSendMessage = async () => {
    if (!intervention || !messageText.trim()) return;

    setIsSendingMessage(true);
    try {
      await addComment(intervention.id, messageText);
      setMessageText('');
      toast.success('Message envoyé');
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!intervention) return;
    exportService.exportToPDF(
      `intervention-${intervention.id}`,
      `intervention-${intervention.reference}.pdf`
    );
  };

  // Partager
  const handleShare = () => {
    if (!intervention) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papiers');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500 h-12 w-12" />
            <h3 className="text-xl font-semibold mb-2">Intervention introuvable</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Cette intervention n'existe pas ou a été supprimée
            </p>
            <Button onClick={() => navigate('/app/interventions')}>Retour aux interventions</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coverPhoto = intervention.photos && intervention.photos.length > 0 ? intervention.photos[0] : null;

  return (
    <div className="space-y-4">
      {/* Header compact avec actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/interventions')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-gray-500 font-mono">{intervention.reference}</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {intervention.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {intervention.isUrgent && (
              <Badge variant="destructive" className="gap-1">
                <Zap className="h-3 w-3" />
                URGENT
              </Badge>
            )}
            {intervention.isBlocking && (
              <Badge className="bg-orange-500 hover:bg-orange-600 gap-1">
                <AlertCircle className="h-3 w-3" />
                BLOQUANT
              </Badge>
            )}
            <StatusBadge status={intervention.status} size="sm" />
            <PriorityBadge priority={intervention.priority} size="sm" />
            <TypeBadge type={intervention.type} size="sm" />
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {elapsedTime}
            </span>
            {intervention.assignedToName && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-3.5 w-3.5" />
                  {intervention.assignedToName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 flex-shrink-0">
          {canStart && (
            <Button
              onClick={() => handleStatusChange('in_progress')}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Démarrer
            </Button>
          )}
          {canComplete && (
            <Button
              onClick={() => handleStatusChange('completed')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Terminer
            </Button>
          )}
          {canValidate && (
            <Button
              onClick={() => handleStatusChange('validated')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Valider
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/app/interventions/${intervention.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

      {/* Tabs compacts */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="w-full justify-start h-9">
          <TabsTrigger value="details" className="gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Détails
          </TabsTrigger>
          {intervention.photos && intervention.photos.length > 0 && (
            <TabsTrigger value="photos" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Photos
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {intervention.photos.length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="messages" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Commentaires
            {intervention.comments && intervention.comments.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {intervention.comments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* TAB: DÉTAILS */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Description */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {intervention.description}
                </p>

                {/* Notes internes */}
                {intervention.internalNotes && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-2 border-orange-500">
                    <h4 className="text-xs font-semibold text-orange-900 dark:text-orange-400 mb-1 flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Notes internes
                    </h4>
                    <p className="text-xs text-orange-800 dark:text-orange-300">
                      {intervention.internalNotes}
                    </p>
                  </div>
                )}

                {/* Notes de résolution */}
                {intervention.resolutionNotes && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-2 border-green-500">
                    <h4 className="text-xs font-semibold text-green-900 dark:text-green-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      Notes de résolution
                    </h4>
                    <p className="text-xs text-green-800 dark:text-green-300">
                      {intervention.resolutionNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Infos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Localisation */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{intervention.location}</span>
                    {intervention.roomNumber && (
                      <span className="text-gray-500 ml-1">• {intervention.roomNumber}</span>
                    )}
                  </div>
                </div>

                {/* Assigné */}
                {intervention.assignedTo && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{intervention.assignedToName || 'Technicien'}</span>
                  </div>
                )}

                {/* Date création */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {intervention.createdAt &&
                      format(intervention.createdAt.toDate(), 'dd MMM yyyy à HH:mm', {
                        locale: fr,
                      })}
                  </span>
                </div>

                {/* Durée réelle */}
                {intervention.actualDuration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{intervention.actualDuration} minutes</span>
                  </div>
                )}

                <Separator />

                {/* Photo preview si disponible */}
                {coverPhoto && (
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={coverPhoto.thumbnailUrl || coverPhoto.url}
                      alt={intervention.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: PHOTOS */}
        {intervention.photos && intervention.photos.length > 0 && (
          <TabsContent value="photos">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {intervention.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border hover:border-indigo-500 transition-colors"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* TAB: COMMENTAIRES */}
        <TabsContent value="messages">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Liste des messages */}
              {intervention.comments && intervention.comments.length > 0 ? (
                <div className="space-y-2">
                  {intervention.comments.map(comment => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <UserAvatar
                        name={comment.userName || 'User'}
                        photoURL={comment.userPhotoURL}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.userName || 'Utilisateur'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.createdAt &&
                              format(comment.createdAt.toDate(), 'dd/MM à HH:mm', {
                                locale: fr,
                              })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun commentaire</p>
                </div>
              )}

              {/* Formulaire nouveau message */}
              <div className="pt-3 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={2}
                    className="flex-1 text-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSendingMessage}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Ctrl+Entrée pour envoyer</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: HISTORIQUE */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-4">
              {intervention.history && intervention.history.length > 0 ? (
                <Timeline
                  items={intervention.history.map(item => ({
                    id: item.id || `${item.timestamp.seconds}`,
                    title: item.action,
                    description: item.details,
                    timestamp: item.timestamp.toDate(),
                    user: {
                      name: item.userName || 'Système',
                    },
                  }))}
                />
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun historique</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lightbox photos */}
      {selectedImageIndex !== null && intervention.photos && (
        <ImageLightbox
          images={intervention.photos.map(p => ({ url: p.url, alt: p.filename }))}
          currentIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onNext={() =>
            setSelectedImageIndex((selectedImageIndex + 1) % intervention.photos!.length)
          }
          onPrevious={() =>
            setSelectedImageIndex(
              (selectedImageIndex - 1 + intervention.photos!.length) % intervention.photos!.length
            )
          }
        />
      )}

      {/* Dialog de confirmation suppression */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer l'intervention"
        description="Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible et supprimera également toutes les photos et commentaires associés."
        confirmLabel="Supprimer définitivement"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default InterventionDetailsPage;
