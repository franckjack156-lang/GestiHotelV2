/**
 * InterventionDetails Component
 * 
 * Affichage détaillé d'une intervention
 */

import { useState } from 'react';
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
  X,
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
import { PriorityBadge } from '../badges/PriorityBadge';
import { INTERVENTION_TYPE_LABELS, CATEGORY_LABELS } from '@/shared/types/status.types';
import type { Intervention } from '../../types/intervention.types';

interface InterventionDetailsProps {
  intervention: Intervention;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const InterventionDetails = ({
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
    category,
    status,
    priority,
    location,
    roomNumber,
    floor,
    building,
    createdAt,
    updatedAt,
    scheduledAt,
    startedAt,
    completedAt,
    assignedTo,
    createdBy,
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

  // Formatage des dates
  const formatDate = (timestamp: any, formatStr = 'dd MMMM yyyy à HH:mm') => {
    if (!timestamp) return '-';
    return format(timestamp.toDate(), formatStr, { locale: fr });
  };

  // Calculer la durée
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
              <ArrowLeft size={16} className="mr-2" />
              Retour
            </Button>
          )}
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {isUrgent && (
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-full">
                URGENT
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Référence: {reference}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit size={16} className="mr-2" />
              Modifier
            </Button>
          )}
          
          {canDelete && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600">
                  <Trash2 size={16} className="mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action
                    est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Badges de statut et priorité */}
      <div className="flex items-center gap-3">
        <StatusBadge status={status} size="lg" />
        <PriorityBadge priority={priority} size="lg" />
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {description}
              </p>
            </CardContent>
          </Card>

          {/* Photos */}
          {photos && photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon size={20} />
                  Photos ({photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedPhoto(photo.url)}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">Voir en grand</span>
                      </div>
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
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Notes internes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {internalNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes de résolution */}
          {resolutionNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Notes de résolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {resolutionNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale - Détails */}
        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {INTERVENTION_TYPE_LABELS[type]}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Catégorie</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {CATEGORY_LABELS[category]}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Localisation</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {roomNumber && `Ch. ${roomNumber} - `}
                      {location}
                    </p>
                    {(floor !== undefined || building) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {floor !== undefined && `Étage ${floor}`}
                        {floor !== undefined && building && ' - '}
                        {building}
                      </p>
                    )}
                  </div>
                </div>

                {assignedTo && (
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Assigné à
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {assignedTo}
                      </p>
                    </div>
                  </div>
                )}

                {isBlocking && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ Chambre/zone bloquée
                    </p>
                  </div>
                )}
              </div>
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
                  <Calendar size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Démarrée le</p>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Durée estimée
                  </p>
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
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Vues</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {viewsCount || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Dernière mise à jour</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(updatedAt, 'dd/MM/yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox pour les photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={24} />
          </button>
          <img
            src={selectedPhoto}
            alt="Photo en grand"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
