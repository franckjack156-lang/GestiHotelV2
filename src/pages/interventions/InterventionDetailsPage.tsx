/**
 * ============================================================================
 * INTERVENTION DETAILS PAGE - COMPLET
 * ============================================================================
 *
 * Page de détails d'une intervention avec :
 * - Informations complètes
 * - Galerie photos (lightbox)
 * - Historique complet (timeline)
 * - Messagerie intégrée
 * - Actions rapides (15+ actions)
 * - Export PDF
 * - Temps écoulé/SLA
 */

import { useState, useEffect } from 'react';
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
  XCircle,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Send,
  Image as ImageIcon,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
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
  StatusIndicator,
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
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className="text-lg font-semibold mb-2">Intervention introuvable</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Cette intervention n'existe pas ou a été supprimée
            </p>
            <Button onClick={() => navigate('/app/interventions')}>Retour aux interventions</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/app/interventions')}>
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{intervention.title}</h1>
              {intervention.isUrgent && (
                <span className="text-red-500">
                  <AlertCircle size={20} />
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Réf: {intervention.reference} • Créée {elapsedTime}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Actions rapides */}
          {canStart && (
            <Button onClick={() => handleStatusChange('in_progress')}>
              <PlayCircle size={16} className="mr-2" />
              Démarrer
            </Button>
          )}

          {canComplete && (
            <Button onClick={() => handleStatusChange('completed')}>
              <CheckCircle2 size={16} className="mr-2" />
              Terminer
            </Button>
          )}

          {canValidate && (
            <Button onClick={() => handleStatusChange('validated')}>
              <CheckCircle2 size={16} className="mr-2" />
              Valider
            </Button>
          )}

          {canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/app/interventions/${intervention.id}/edit`)}
            >
              <Edit size={16} className="mr-2" />
              Modifier
            </Button>
          )}

          {/* Menu actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download size={16} className="mr-2" />
                Exporter PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 size={16} className="mr-2" />
                Partager
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {intervention.status === 'in_progress' && (
                <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                  <PauseCircle size={16} className="mr-2" />
                  Mettre en pause
                </DropdownMenuItem>
              )}
              {intervention.status === 'on_hold' && (
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  <PlayCircle size={16} className="mr-2" />
                  Reprendre
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={intervention.status} />
                <PriorityBadge priority={intervention.priority} />
                <TypeBadge type={intervention.type} />
                {intervention.isUrgent && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded-full">
                    Urgent
                  </span>
                )}
                {intervention.isBlocking && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                    Bloquant
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-700 dark:text-gray-300">{intervention.description}</p>
              </div>

              {/* Détails */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Localisation</p>
                    <p className="font-medium">{intervention.location}</p>
                  </div>
                </div>

                {intervention.assignedTo && (
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Assigné à</p>
                      <p className="font-medium">{intervention.assignedToName || 'Technicien'}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Créée le</p>
                    <p className="font-medium">
                      {intervention.createdAt &&
                        format(intervention.createdAt.toDate(), 'dd/MM/yyyy à HH:mm', {
                          locale: fr,
                        })}
                    </p>
                  </div>
                </div>

                {intervention.estimatedDuration && (
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Durée estimée</p>
                      <p className="font-medium">{intervention.estimatedDuration} min</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes internes */}
              {intervention.internalNotes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2 text-orange-600 dark:text-orange-400">
                    Notes internes
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {intervention.internalNotes}
                  </p>
                </div>
              )}

              {/* Notes de résolution */}
              {intervention.resolutionNotes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">
                    Notes de résolution
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {intervention.resolutionNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Galerie photos */}
          {intervention.photos && intervention.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon size={20} />
                  Photos ({intervention.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {intervention.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messagerie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                Messagerie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Liste des messages */}
              {intervention.comments && intervention.comments.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {intervention.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <UserAvatar
                        name={comment.userName || 'User'}
                        photoURL={comment.userPhotoURL}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.userName || 'Utilisateur'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.createdAt &&
                              format(comment.createdAt.toDate(), 'dd/MM à HH:mm', {
                                locale: fr,
                              })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucun message</p>
              )}

              {/* Formulaire nouveau message */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Écrire un message..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSendingMessage}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Temps & SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Temps & SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Temps écoulé</p>
                <p className="text-lg font-semibold">{elapsedTime}</p>
              </div>

              {intervention.actualDuration && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Durée réelle</p>
                  <p className="text-lg font-semibold">{intervention.actualDuration} min</p>
                </div>
              )}

              {intervention.status === 'in_progress' && intervention.startedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">En cours depuis</p>
                  <p className="text-sm">
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
            <CardHeader>
              <CardTitle className="text-sm">Historique</CardTitle>
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
                <p className="text-sm text-gray-500 text-center py-4">Aucun historique</p>
              )}
            </CardContent>
          </Card>

          {/* Métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-xs">{intervention.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Créée par</span>
                <span>{intervention.createdByName || 'Utilisateur'}</span>
              </div>
              {intervention.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Modifiée</span>
                  <span>
                    {format(intervention.updatedAt.toDate(), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
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
        description="Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default InterventionDetailsPage;
