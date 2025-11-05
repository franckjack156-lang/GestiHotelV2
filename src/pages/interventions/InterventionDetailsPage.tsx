/**
 * InterventionDetailsPage
 *
 * Page de détails d'une intervention
 * - Toutes les informations
 * - Galerie photos
 * - Actions (éditer, supprimer, changer statut)
 * - Historique
 *
 * Destination: src/pages/interventions/InterventionDetailsPage.tsx
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import { TypeBadge } from '@/features/interventions/components/badges/TypeBadge';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { getIntervention } from '@/features/interventions/services/interventionService';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import { CATEGORY_LABELS } from '@/shared/types/status.types';

export const InterventionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { canEditIntervention, canDeleteIntervention } = usePermissions();

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { deleteIntervention, isDeleting } = useInterventionActions(establishmentId || '');

  // Charger l'intervention
  useEffect(() => {
    if (!establishmentId || !id) return;

    const loadIntervention = async () => {
      try {
        setIsLoading(true);
        const data = await getIntervention(establishmentId, id);
        setIntervention(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadIntervention();
  }, [establishmentId, id]);

  // Gérer la suppression
  const handleDelete = async () => {
    if (!id) return;

    const success = await deleteIntervention(id);
    if (success) {
      navigate('/app/interventions');
    }
  };

  // Formatage date
  const formatDate = (timestamp: any, formatStr = 'dd MMMM yyyy à HH:mm') => {
    if (!timestamp) return '-';
    return format(timestamp.toDate(), formatStr, { locale: fr });
  };

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Aucun établissement sélectionné</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-gray-600">{error || 'Intervention introuvable'}</p>
          <Button className="mt-4" onClick={() => navigate('/app/interventions')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = canEditIntervention(intervention);
  const canDelete = canDeleteIntervention(intervention);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/interventions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {intervention.title}
            </h1>
            {intervention.reference && (
              <p className="mt-1 text-sm text-gray-500">Réf: {intervention.reference}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/app/interventions/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est
                    irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Badges et statut */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={intervention.status} />
        <PriorityBadge priority={intervention.priority} />
        <TypeBadge type={intervention.type} />
        {intervention.isUrgent && (
          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded dark:bg-red-900/20 dark:text-red-400">
            🚨 URGENT
          </span>
        )}
        {intervention.isBlocking && (
          <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded dark:bg-orange-900/20 dark:text-orange-400">
            🚫 Chambre bloquée
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {intervention.description}
              </p>
            </CardContent>
          </Card>

          {/* Photos */}
          {intervention.photos && intervention.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos ({intervention.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {intervention.photos.map((photo, index) => (
                    <img
                      key={photo.id || index}
                      src={photo.url}
                      alt={photo.name || `Photo ${index + 1}`}
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes internes */}
          {intervention.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes internes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {intervention.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes de résolution */}
          {intervention.resolutionNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes de résolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {intervention.resolutionNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Informations */}
        <div className="space-y-6">
          {/* Localisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Lieu:</span>
                <p className="text-gray-600 dark:text-gray-400">{intervention.location}</p>
              </div>
              {intervention.roomNumber && (
                <div>
                  <span className="font-medium">Chambre:</span>
                  <p className="text-gray-600 dark:text-gray-400">{intervention.roomNumber}</p>
                </div>
              )}
              {intervention.floor !== undefined && (
                <div>
                  <span className="font-medium">Étage:</span>
                  <p className="text-gray-600 dark:text-gray-400">{intervention.floor}</p>
                </div>
              )}
              {intervention.building && (
                <div>
                  <span className="font-medium">Bâtiment:</span>
                  <p className="text-gray-600 dark:text-gray-400">{intervention.building}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Catégorie:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {CATEGORY_LABELS[intervention.category]}
                </p>
              </div>
              <div>
                <span className="font-medium">Créée le:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatDate(intervention.createdAt)}
                </p>
              </div>
              {intervention.scheduledAt && (
                <div>
                  <span className="font-medium">Planifiée le:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(intervention.scheduledAt)}
                  </p>
                </div>
              )}
              {intervention.startedAt && (
                <div>
                  <span className="font-medium">Démarrée le:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(intervention.startedAt)}
                  </p>
                </div>
              )}
              {intervention.completedAt && (
                <div>
                  <span className="font-medium">Terminée le:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(intervention.completedAt)}
                  </p>
                </div>
              )}
              {intervention.estimatedDuration && (
                <div>
                  <span className="font-medium">Durée estimée:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {intervention.estimatedDuration} min
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
