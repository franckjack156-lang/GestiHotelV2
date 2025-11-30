/**
 * Carte d'intervention draggable pour le planning
 */

import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Clock, Users, DoorClosed, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import type { Intervention } from '@/features/interventions/types/intervention.types';

interface DraggableInterventionProps {
  intervention: Intervention;
  onClick: () => void;
}

/**
 * Formater la durée en heures/minutes
 */
const formatDuration = (minutes?: number | null) => {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
  }
  return `${mins}min`;
};

/**
 * Obtenir la couleur basée sur la priorité
 */
const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'urgent':
    case 'critical':
      return 'bg-red-500 hover:bg-red-600 border-red-600 text-white';
    case 'high':
      return 'bg-orange-500 hover:bg-orange-600 border-orange-600 text-white';
    case 'normal':
      return 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white';
    default:
      return 'bg-gray-500 hover:bg-gray-600 border-gray-600 text-white';
  }
};

export const DraggableIntervention = ({ intervention, onClick }: DraggableInterventionProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: intervention.id,
    data: { intervention },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded border shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing ${getPriorityColor(intervention.priority)} ${
            isDragging ? 'opacity-50' : ''
          }`}
          onClick={onClick}
        >
          {/* Grip handle */}
          <div className="flex-shrink-0">
            <GripVertical size={12} className="opacity-70" />
          </div>

          {/* Contenu compact */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs font-medium truncate leading-tight">
              {intervention.isRecurring && (
                <Repeat size={10} className="flex-shrink-0 opacity-80" />
              )}
              <span className="truncate">{intervention.title}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] opacity-90">
              {intervention.scheduledAt && (
                <span>{format(intervention.scheduledAt.toDate(), 'HH:mm', { locale: fr })}</span>
              )}
              {intervention.assignedToName && (
                <>
                  <span>•</span>
                  <span className="truncate">{intervention.assignedToName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-sm">
        <div className="space-y-2">
          <div>
            <p className="font-semibold">{intervention.title}</p>
            {intervention.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {intervention.description}
              </p>
            )}
          </div>

          <div className="text-xs space-y-1">
            {intervention.scheduledAt && (
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span>
                  {format(intervention.scheduledAt.toDate(), 'dd MMMM yyyy à HH:mm', {
                    locale: fr,
                  })}
                </span>
              </div>
            )}

            {intervention.estimatedDuration && (
              <div className="flex items-center gap-2">
                <span className="opacity-70">⏱️</span>
                <span>Durée estimée: {formatDuration(intervention.estimatedDuration)}</span>
              </div>
            )}

            {intervention.assignedToName && (
              <div className="flex items-center gap-2">
                <Users size={12} />
                <span>{intervention.assignedToName}</span>
              </div>
            )}

            {intervention.location && (
              <div className="flex items-center gap-2">
                <DoorClosed size={12} />
                <span>{intervention.location}</span>
              </div>
            )}

            {intervention.priority && (
              <div className="flex items-center gap-2">
                <span className="opacity-70">🔔</span>
                <span className="capitalize">Priorité: {intervention.priority}</span>
              </div>
            )}

            {intervention.status && (
              <div className="flex items-center gap-2">
                <span className="opacity-70">📊</span>
                <span className="capitalize">Statut: {intervention.status}</span>
              </div>
            )}

            {intervention.isRecurring && (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Repeat size={12} />
                <span>Intervention récurrente</span>
              </div>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
