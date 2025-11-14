/**
 * InterventionCard Component - VERSION AMÉLIORÉE
 *
 * Card moderne pour afficher une intervention avec actions rapides
 */

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MapPin,
  User,
  Calendar,
  Image as ImageIcon,
  Clock,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { StatusBadge } from '../badges/StatusBadge';
import { PriorityBadge } from '../badges/PriorityBadge';
import { INTERVENTION_TYPE_LABELS } from '@/shared/types/status.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Intervention } from '../../types/intervention.types';
import { cn } from '@/shared/lib/utils';

interface InterventionCardProps {
  intervention: Intervention;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showPhotos?: boolean;
  showAssignee?: boolean;
  className?: string;
}

export const InterventionCard = ({
  intervention,
  onClick,
  onEdit,
  onDelete,
  showPhotos = true,
  showAssignee = true,
  className = '',
}: InterventionCardProps) => {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  const {
    title,
    description,
    type,
    status,
    priority,
    location,
    roomNumber,
    createdAt,
    scheduledAt,
    assignedTo,
    assignedToName,
    createdBy,
    photos,
    photosCount,
    isUrgent,
    isBlocking,
  } = intervention;

  // Permissions
  const canEdit = user?.role === 'admin' || user?.uid === createdBy;
  const canDelete = user?.role === 'admin';
  const isAssigned = user?.uid === assignedTo;

  // Formater la date
  const formattedDate = createdAt
    ? format(createdAt.toDate(), 'dd MMM yyyy', { locale: fr })
    : '';
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt.toDate(), { locale: fr, addSuffix: true })
    : '';

  // Photo de couverture
  const coverPhoto = photos && photos.length > 0 && !imageError ? photos[0] : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Ne pas déclencher onClick si on clique sur un bouton/menu
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  return (
    <Card
      className={cn(
        'group relative cursor-pointer transition-all duration-200',
        'hover:shadow-xl hover:scale-[1.02]',
        'border-l-4',
        isUrgent && 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
        isBlocking && 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20',
        !isUrgent && !isBlocking && 'border-l-blue-500',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Photo de couverture */}
        {showPhotos && coverPhoto && (
          <div className="relative w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={coverPhoto.thumbnailUrl || coverPhoto.url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
            {/* Overlay avec badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Compteur de photos */}
            {photosCount && photosCount > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5">
                <ImageIcon size={14} />
                <span className="font-medium">{photosCount}</span>
              </div>
            )}

            {/* Badges urgence */}
            {isUrgent && (
              <div className="absolute top-3 left-3">
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <AlertCircle size={14} />
                  URGENT
                </div>
              </div>
            )}
            {isBlocking && !isUrgent && (
              <div className="absolute top-3 left-3">
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  BLOQUANT
                </div>
              </div>
            )}

            {/* Statut */}
            <div className="absolute top-3 right-3">
              <StatusBadge status={status} size="md" />
            </div>
          </div>
        )}

        {/* Contenu */}
        <div className="p-5">
          {/* Header avec titre et menu actions */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                {title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                  {INTERVENTION_TYPE_LABELS[type]}
                </span>
                <PriorityBadge priority={priority} size="sm" />
              </div>
            </div>

            {/* Menu actions */}
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onClick}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les détails
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
            {description}
          </p>

          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Localisation */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Localisation</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {roomNumber ? `Ch. ${roomNumber}` : location}
                </p>
              </div>
            </div>

            {/* Assigné à */}
            {showAssignee && assignedToName && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                    isAssigned
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  {isAssigned ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Assigné à</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {assignedToName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer avec date */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
