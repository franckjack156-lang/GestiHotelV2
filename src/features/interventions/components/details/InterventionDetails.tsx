/**
 * InterventionDetails Component
 *
 * Affichage détaillé d'une intervention
 */

import { useState, memo, useCallback } from 'react';
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
  Image as ImageIcon,
  X,
  Eye,
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
import { StatusBadge } from '../badges/StatusBadge';
import { TypeBadge } from '../badges/TypeBadge';
import { PriorityBadge } from '../badges/PriorityBadge';
import type { Intervention } from '../../types/intervention.types';

interface InterventionDetailsProps {
  intervention: Intervention;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const InterventionDetailsComponent = ({
  intervention,
  onEdit,
  onDelete,
  onBack,
  canEdit = true,
  canDelete = false,
}: InterventionDetailsProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const {
    title,
    description,
    type,
    status,
    priority,
    location,
    roomNumber,
    floor,
    building,
    createdAt,
    scheduledAt,
    startedAt,
    completedAt,
    assignedToName,
    createdByName,
    estimatedDuration,
    actualDuration,
    internalNotes,
    resolutionNotes,
    photos,
    reference,
    isUrgent,
    isBlocking,
    viewsCount,
  } = intervention;

  // Formatage des dates - memoized
  const formatDate = useCallback((timestamp: any, formatStr = 'dd MMMM yyyy à HH:mm') => {
    if (!timestamp) return '-';
    return format(timestamp.toDate(), formatStr, { locale: fr });
  }, []);

  // Calculer la durée - memoized
  const formatDuration = useCallback((minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  }, []);

  const handlePhotoClick = useCallback((url: string) => {
    setSelectedPhoto(url);
  }, []);

  const handleClosePhoto = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            {reference && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Réf: {reference}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Éditer
            </Button>
          )}
          {canDelete && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
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
                  <AlertDialogAction onClick={onDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <TypeBadge type={type} />
        <PriorityBadge priority={priority} />
        {isUrgent && (
          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded dark:bg-red-900/20 dark:text-red-400">
            🚨 URGENT
          </span>
        )}
        {isBlocking && (
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
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{description}</p>
            </CardContent>
          </Card>

          {/* Photos */}
          {photos && photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos ({photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handlePhotoClick(photo.url)}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes internes */}
          {internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {internalNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes de résolution */}
          {resolutionNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes de résolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {resolutionNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale - Informations */}
        <div className="space-y-6">
          {/* Localisation */}
          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Localisation</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{location}</p>
                </div>
              </div>

              {roomNumber && (
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Chambre</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {roomNumber}
                    </p>
                  </div>
                </div>
              )}

              {floor !== undefined && floor !== null && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Étage</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{floor}</p>
                </div>
              )}

              {building && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bâtiment</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{building}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personnes */}
          <Card>
            <CardHeader>
              <CardTitle>Personnes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Créé par</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {createdByName || 'Non spécifié'}
                  </p>
                </div>
              </div>

              {assignedToName && (
                <div className="flex items-start gap-3">
                  <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Assigné à</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {assignedToName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Créée le</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(createdAt)}
                  </p>
                </div>
              </div>

              {scheduledAt && (
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Planifiée le</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(scheduledAt)}
                    </p>
                  </div>
                </div>
              )}

              {startedAt && (
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Débutée le</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(startedAt)}
                    </p>
                  </div>
                </div>
              )}

              {completedAt && (
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terminée le</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(completedAt)}
                    </p>
                  </div>
                </div>
              )}

              {estimatedDuration && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Durée estimée</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDuration(estimatedDuration)}
                  </p>
                </div>
              )}

              {actualDuration && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Durée réelle</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDuration(actualDuration)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          {viewsCount !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Eye size={16} />
                  <span>
                    {viewsCount} consultation{viewsCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lightbox pour les photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={handleClosePhoto}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={handleClosePhoto}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={selectedPhoto}
            alt="Photo agrandie"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

InterventionDetailsComponent.displayName = 'InterventionDetails';

export const InterventionDetails = memo(InterventionDetailsComponent);
