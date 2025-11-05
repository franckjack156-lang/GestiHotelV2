/**
 * InterventionCard Component
 * 
 * Card pour afficher une intervention dans la liste
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MapPin,
  User,
  Calendar,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { StatusBadge } from '../badges/StatusBadge';
import { PriorityBadge } from '../badges/PriorityBadge';
import { INTERVENTION_TYPE_LABELS } from '@/shared/types/status.types';
import type { Intervention } from '../../types/intervention.types';

interface InterventionCardProps {
  intervention: Intervention;
  onClick?: () => void;
  showPhotos?: boolean;
  showAssignee?: boolean;
  className?: string;
}

export const InterventionCard = ({
  intervention,
  onClick,
  showPhotos = true,
  showAssignee = true,
  className = '',
}: InterventionCardProps) => {
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
    photos,
    photosCount,
    isUrgent,
  } = intervention;

  // Formater la date
  const formattedDate = format(createdAt.toDate(), 'dd MMM yyyy', {
    locale: fr,
  });

  // Photo de couverture
  const coverPhoto = photos && photos.length > 0 ? photos[0] : null;

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
        isUrgent ? 'border-2 border-red-400' : ''
      } ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header avec badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {INTERVENTION_TYPE_LABELS[type]}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={status} size="sm" />
            <PriorityBadge priority={priority} size="sm" />
          </div>
        </div>

        {/* Photo de couverture */}
        {showPhotos && coverPhoto && (
          <div className="relative w-full h-32 mb-3 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={coverPhoto.url}
              alt={title}
              className="w-full h-full object-cover"
            />
            {photosCount > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <ImageIcon size={12} />
                <span>{photosCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {description}
        </p>

        {/* Informations */}
        <div className="space-y-2">
          {/* Localisation */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate">
              {roomNumber ? `Ch. ${roomNumber} - ` : ''}
              {location}
            </span>
          </div>

          {/* Date de création */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock size={14} className="flex-shrink-0" />
            <span>Créée le {formattedDate}</span>
          </div>

          {/* Date planifiée */}
          {scheduledAt && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar size={14} className="flex-shrink-0" />
              <span>
                Planifiée le{' '}
                {format(scheduledAt.toDate(), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          )}

          {/* Technicien assigné */}
          {showAssignee && assignedTo && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <User size={14} className="flex-shrink-0" />
              <span className="truncate">Assignée à {assignedTo}</span>
            </div>
          )}
        </div>

        {/* Badge urgent */}
        {isUrgent && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
              <Flame size={14} />
              <span>Intervention urgente</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
