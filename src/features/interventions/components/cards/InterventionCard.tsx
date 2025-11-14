/**
 * Intervention Card
 *
 * Carte d'intervention avec support de deux modes d'affichage :
 * - grid : Vue carte complète avec photo
 * - list : Vue liste compacte horizontale
 */

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  MapPin,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { StatusBadge } from '../badges/StatusBadge';
import { PriorityBadge } from '../badges/PriorityBadge';
import { TypeBadge } from '../badges/TypeBadge';
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
  viewMode?: 'grid' | 'list';
  className?: string;
}

export const InterventionCard = ({
  intervention,
  onClick,
  onEdit,
  onDelete,
  showPhotos = true,
  showAssignee = true,
  viewMode = 'grid',
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

  // ============================================================================
  // VUE LISTE (COMPACTE)
  // ============================================================================
  if (viewMode === 'list') {
    return (
      <Card
        onClick={handleCardClick}
        className={cn(
          'group relative cursor-pointer transition-all duration-150',
          'hover:shadow-md border-l-4',
          isUrgent && 'border-l-red-500 bg-red-50/30 dark:bg-red-950/10',
          isBlocking && !isUrgent && 'border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10',
          !isUrgent && !isBlocking && 'border-l-blue-500',
          isAssigned && 'ring-2 ring-indigo-200 dark:ring-indigo-800',
          className
        )}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail (optionnel) */}
          {showPhotos && coverPhoto && (
            <div className="hidden sm:block flex-shrink-0 w-16 h-16 rounded overflow-hidden">
              <img
                src={coverPhoto.thumbnailUrl || coverPhoto.url}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              {/* Titre et badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {title}
                  </h3>
                  {isUrgent && (
                    <span className="flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </span>
                  )}
                  {isBlocking && (
                    <span className="flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </span>
                  )}
                </div>

                {/* Badges en ligne */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={status} size="sm" />
                  <PriorityBadge priority={priority} size="sm" />
                  <TypeBadge type={type} size="sm" />
                </div>
              </div>

              {/* Actions */}
              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Informations compactes */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {/* Localisation */}
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{location}</span>
                {roomNumber && <span className="text-gray-400">• {roomNumber}</span>}
              </div>

              {/* Assigné */}
              {showAssignee && assignedToName && (
                <div className="hidden md:flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px]">{assignedToName}</span>
                </div>
              )}

              {/* Date */}
              <div className="hidden lg:flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{timeAgo}</span>
              </div>

              {/* Photos count */}
              {photosCount > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{photosCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Indicateur statut (droite) */}
          <div className="hidden md:flex flex-shrink-0 items-center justify-center w-12">
            {status === 'completed' || status === 'validated' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : status === 'in_progress' ? (
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
            ) : (
              <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
        </div>
      </Card>
    );
  }

  // ============================================================================
  // VUE GRILLE (CARTE COMPLÈTE)
  // ============================================================================
  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'group relative cursor-pointer transition-all duration-200',
        'hover:shadow-xl hover:scale-[1.02]',
        'border-l-4',
        isUrgent && 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
        isBlocking && !isUrgent && 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20',
        !isUrgent && !isBlocking && 'border-l-blue-500',
        isAssigned && 'ring-2 ring-indigo-200 dark:ring-indigo-800',
        className
      )}
    >
      {/* Photo de couverture avec overlay */}
      {showPhotos && coverPhoto && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={coverPhoto.thumbnailUrl || coverPhoto.url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badges urgents en overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isUrgent && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
                <AlertTriangle className="h-3 w-3" />
                URGENT
              </span>
            )}
            {isBlocking && (
              <span className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full shadow-lg">
                <AlertTriangle className="h-3 w-3" />
                BLOQUANT
              </span>
            )}
          </div>

          {/* Menu actions */}
          {(canEdit || canDelete) && (
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
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
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Photos count */}
          {photosCount > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
              <ImageIcon className="h-3 w-3" />
              <span>{photosCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Contenu */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{description}</p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={status} />
          <PriorityBadge priority={priority} />
          <TypeBadge type={type} />
        </div>

        {/* Informations */}
        <div className="space-y-2 text-sm">
          {/* Localisation */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {location}
              {roomNumber && <span className="text-gray-400 ml-1">• {roomNumber}</span>}
            </span>
          </div>

          {/* Assigné */}
          {showAssignee && assignedToName && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{assignedToName}</span>
              {isAssigned && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Vous
                </span>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs">{timeAgo}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
