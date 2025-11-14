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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 -m-6 p-6">
      {/* ========================================================================
          HERO SECTION AVEC PHOTO DE FOND
          ======================================================================== */}
      <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl">
        {/* Photo de fond avec overlay */}
        {coverPhoto ? (
          <div className="relative h-80">
            <img
              src={coverPhoto.url}
              alt={intervention.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          </div>
        ) : (
          <div className="relative h-80 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        )}

        {/* Contenu Hero */}
        <div className="absolute inset-0 flex flex-col justify-between p-8 text-white">
          {/* Top Bar */}
          <div className="flex items-start justify-between">
            <Button
              variant="secondary"
              onClick={() => navigate('/app/interventions')}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            <div className="flex gap-2">
              {/* Actions contextuelles */}
              {canStart && (
                <Button
                  onClick={() => handleStatusChange('in_progress')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Démarrer
                </Button>
              )}

              {canComplete && (
                <Button
                  onClick={() => handleStatusChange('completed')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Terminer
                </Button>
              )}

              {canValidate && (
                <Button
                  onClick={() => handleStatusChange('validated')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Valider
                </Button>
              )}

              {canEdit && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/interventions/${intervention.id}/edit`)}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md"
                  >
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

          {/* Bottom Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {intervention.isUrgent && (
                <Badge className="bg-red-500/90 hover:bg-red-600 text-white gap-1 backdrop-blur-sm">
                  <Zap className="h-3 w-3" />
                  URGENT
                </Badge>
              )}
              {intervention.isBlocking && (
                <Badge className="bg-orange-500/90 hover:bg-orange-600 text-white gap-1 backdrop-blur-sm">
                  <AlertCircle className="h-3 w-3" />
                  BLOQUANT
                </Badge>
              )}
              <StatusBadge status={intervention.status} />
              <PriorityBadge priority={intervention.priority} />
              <TypeBadge type={intervention.type} />
            </div>

            <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">{intervention.title}</h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="font-mono">{intervention.reference}</span>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {elapsedTime}
              </span>
              {intervention.assignedToName && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {intervention.assignedToName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================
          CONTENU PRINCIPAL AVEC TABS
          ======================================================================== */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 p-1 shadow-sm">
          <TabsTrigger value="details" className="gap-2">
            <Info className="h-4 w-4" />
            Détails
          </TabsTrigger>
          {intervention.photos && intervention.photos.length > 0 && (
            <TabsTrigger value="photos" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Photos ({intervention.photos.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Commentaires
            {intervention.comments && intervention.comments.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {intervention.comments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* TAB: DÉTAILS */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Description */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  {intervention.description}
                </p>

                {/* Notes internes */}
                {intervention.internalNotes && (
                  <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Notes internes
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      {intervention.internalNotes}
                    </p>
                  </div>
                )}

                {/* Notes de résolution */}
                {intervention.resolutionNotes && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-900 dark:text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Notes de résolution
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      {intervention.resolutionNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Infos */}
            <div className="space-y-6">
              {/* Temps & Durée */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Temps & Durée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1 font-medium">
                      TEMPS ÉCOULÉ
                    </p>
                    <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                      {elapsedTime}
                    </p>
                  </div>

                  {intervention.actualDuration && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">
                        DURÉE RÉELLE
                      </p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">
                        {intervention.actualDuration} min
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations clés */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    Informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Localisation</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {intervention.location}
                      </p>
                      {intervention.roomNumber && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {intervention.roomNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {intervention.assignedTo && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigné à</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {intervention.assignedToName || 'Technicien'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Créée le</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {intervention.createdAt &&
                          format(intervention.createdAt.toDate(), 'dd MMM yyyy', {
                            locale: fr,
                          })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: PHOTOS */}
        {intervention.photos && intervention.photos.length > 0 && (
          <TabsContent value="photos">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {intervention.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-xl"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
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
            <CardContent className="p-6 space-y-6">
              {/* Liste des messages */}
              {intervention.comments && intervention.comments.length > 0 ? (
                <div className="space-y-4">
                  {intervention.comments.map(comment => (
                    <div
                      key={comment.id}
                      className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <UserAvatar
                        name={comment.userName || 'User'}
                        photoURL={comment.userPhotoURL}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {comment.userName || 'Utilisateur'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.createdAt &&
                              format(comment.createdAt.toDate(), 'dd/MM à HH:mm', {
                                locale: fr,
                              })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun commentaire pour le moment</p>
                </div>
              )}

              {/* Formulaire nouveau message */}
              <div className="pt-6 border-t">
                <div className="flex gap-3">
                  <Textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={3}
                    className="flex-1"
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
                    className="h-auto"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Ctrl+Entrée pour envoyer rapidement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: HISTORIQUE */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
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
                <div className="text-center py-12">
                  <History className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun historique disponible</p>
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
