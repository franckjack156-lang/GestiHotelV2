/**
 * ============================================================================
 * INTERVENTION DETAILS PAGE - VERSION MODERNE & ERGONOMIQUE
 * ============================================================================
 *
 * Page de détails d'une intervention repensée pour une meilleure UX :
 * - Header épuré avec actions contextuelles
 * - Layout moderne en 2 colonnes
 * - Cartes d'information claires
 * - Galerie photos responsive
 * - Timeline interactive
 * - Messagerie intégrée
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
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
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
import exportService from '@/shared/services/exportService';

// ============================================================================
// COMPONENT
// ============================================================================

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

  return (
    <div className="space-y-6 pb-8">
      {/* ========================================================================
          HEADER MODERNE
          ======================================================================== */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          onClick={() => navigate('/app/interventions')}
          className="self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux interventions
        </Button>

        {/* Titre et actions */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {intervention.title}
                  </h1>
                  {intervention.isUrgent && (
                    <Badge variant="destructive" className="gap-1">
                      <Zap className="h-3 w-3" />
                      URGENT
                    </Badge>
                  )}
                  {intervention.isBlocking && (
                    <Badge variant="warning" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      BLOQUANT
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Réf: <span className="font-mono">{intervention.reference}</span> • Créée{' '}
                  {elapsedTime}
                </p>
              </div>
            </div>

            {/* Badges de statut */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={intervention.status} />
              <PriorityBadge priority={intervention.priority} />
              <TypeBadge type={intervention.type} />
            </div>
          </div>

          {/* Actions principales */}
          <div className="flex gap-2 flex-wrap">
            {/* Actions contextuelles selon le statut */}
            {canStart && (
              <Button onClick={() => handleStatusChange('in_progress')} size="lg">
                <PlayCircle className="mr-2 h-4 w-4" />
                Démarrer
              </Button>
            )}

            {canComplete && (
              <Button onClick={() => handleStatusChange('completed')} size="lg">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Terminer
              </Button>
            )}

            {canValidate && (
              <Button onClick={() => handleStatusChange('validated')} size="lg">
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

            {/* Menu actions secondaires */}
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
      </div>

      <Separator />

      {/* ========================================================================
          CONTENU PRINCIPAL - LAYOUT 2 COLONNES
          ======================================================================== */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* COLONNE PRINCIPALE (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-indigo-500" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {intervention.description}
              </p>
            </CardContent>
          </Card>

          {/* Détails clés */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-indigo-500" />
                Informations clés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Localisation */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Localisation
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {intervention.location}
                    </p>
                    {intervention.roomNumber && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {intervention.roomNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Assigné à */}
                {intervention.assignedTo && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Assigné à
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {intervention.assignedToName || 'Technicien'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Date de création */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Créée le
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {intervention.createdAt &&
                        format(intervention.createdAt.toDate(), 'dd MMM yyyy', {
                          locale: fr,
                        })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {intervention.createdAt &&
                        format(intervention.createdAt.toDate(), 'HH:mm', {
                          locale: fr,
                        })}
                    </p>
                  </div>
                </div>

                {/* Durée estimée */}
                {intervention.estimatedDuration && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Durée estimée
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {intervention.estimatedDuration} min
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes internes */}
              {intervention.internalNotes && (
                <>
                  <Separator className="my-4" />
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Notes internes
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      {intervention.internalNotes}
                    </p>
                  </div>
                </>
              )}

              {/* Notes de résolution */}
              {intervention.resolutionNotes && (
                <>
                  <Separator className="my-4" />
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Notes de résolution
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      {intervention.resolutionNotes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Galerie photos */}
          {intervention.photos && intervention.photos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5 text-indigo-500" />
                  Photos ({intervention.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {intervention.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messagerie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                Commentaires{' '}
                {intervention.comments && intervention.comments.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({intervention.comments.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Liste des messages */}
              {intervention.comments && intervention.comments.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {intervention.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <UserAvatar
                        name={comment.userName || 'User'}
                        photoURL={comment.userPhotoURL}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
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
                  <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun commentaire</p>
                </div>
              )}

              {/* Formulaire nouveau message */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={2}
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
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ctrl+Entrée pour envoyer rapidement
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR (1/3) */}
        <div className="space-y-6">
          {/* Temps & SLA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                Temps & Durée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1 font-medium uppercase tracking-wide">
                  Temps écoulé
                </p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  {elapsedTime}
                </p>
              </div>

              {intervention.actualDuration && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium uppercase tracking-wide">
                    Durée réelle
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {intervention.actualDuration} min
                  </p>
                </div>
              )}

              {intervention.status === 'in_progress' && intervention.startedAt && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium uppercase tracking-wide">
                    En cours depuis
                  </p>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {formatDistanceToNow(intervention.startedAt.toDate(), {
                      locale: fr,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-500" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                <div className="text-center py-6">
                  <History className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun historique</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métadonnées */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-500" />
                Métadonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">ID</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {intervention.id.substring(0, 8)}...
                </code>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Créée par</span>
                <span className="font-medium">{intervention.createdByName || 'Utilisateur'}</span>
              </div>
              {intervention.updatedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Modifiée</span>
                    <span className="font-medium">
                      {format(intervention.updatedAt.toDate(), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
