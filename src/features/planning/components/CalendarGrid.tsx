/**
 * Grille de calendrier pour vue jour/semaine avec échelle horaire
 */

import { useDroppable } from '@dnd-kit/core';
import { format, isSameDay, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/shared/components/ui/badge';
import { DraggableIntervention } from './DraggableIntervention';
import type { Intervention } from '@/features/interventions/types/intervention.types';

// ============================================================================
// TIME SLOT COMPONENT
// ============================================================================

interface DroppableTimeSlotProps {
  day: Date;
  hour: number;
  interventions: Intervention[];
  onInterventionClick: (id: string) => void;
  onSlotClick?: (date: Date) => void;
}

const DroppableTimeSlot = ({
  day,
  hour,
  interventions,
  onInterventionClick,
  onSlotClick,
}: DroppableTimeSlotProps) => {
  const slotDate = setHours(setMinutes(day, 0), hour);
  const { setNodeRef, isOver } = useDroppable({
    id: `${format(day, 'yyyy-MM-dd')}-${hour}`,
    data: { date: slotDate },
  });

  // Filtrer les interventions qui commencent dans ce créneau horaire
  const slotInterventions = interventions.filter(intervention => {
    if (!intervention.scheduledAt || typeof intervention.scheduledAt.toDate !== 'function')
      return false;
    const intDate = intervention.scheduledAt.toDate();
    return intDate.getHours() === hour && isSameDay(intDate, day);
  });

  const handleSlotClick = (e: React.MouseEvent) => {
    // Ne pas déclencher si on clique sur une intervention
    if ((e.target as HTMLElement).closest('[data-intervention]')) {
      return;
    }
    if (slotInterventions.length === 0 && onSlotClick) {
      onSlotClick(slotDate);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleSlotClick}
      className={`relative border-t border-l border-gray-200 dark:border-gray-700 min-h-16 transition-colors ${
        isOver
          ? 'bg-indigo-50 dark:bg-indigo-900/20'
          : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer'
      }`}
    >
      {slotInterventions.map((intervention, index) => {
        const startTime = intervention.scheduledAt?.toDate();
        const duration = intervention.estimatedDuration || 60;
        const heightPercent = (duration / 60) * 100;
        const topPercent = startTime ? (startTime.getMinutes() / 60) * 100 : 0;

        // Calculer le décalage horizontal pour les interventions qui se chevauchent
        const totalInSlot = slotInterventions.length;
        const widthPercent = totalInSlot > 1 ? 100 / totalInSlot : 100;
        const leftPercent = totalInSlot > 1 ? index * widthPercent : 0;

        return (
          <div
            key={intervention.id}
            data-intervention="true"
            className="absolute px-0.5"
            style={{
              top: `${topPercent}%`,
              height: `${Math.max(heightPercent, 25)}%`,
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
            }}
          >
            <DraggableIntervention
              intervention={intervention}
              onClick={() => onInterventionClick(intervention.id)}
            />
          </div>
        );
      })}
      {isOver && slotInterventions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-indigo-600 dark:text-indigo-400">Déposer ici</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CALENDAR GRID COMPONENT
// ============================================================================

interface CalendarGridProps {
  days: Date[];
  interventions: Intervention[];
  onInterventionClick: (id: string) => void;
  onSlotClick?: (date: Date) => void;
  workingHoursStart?: number;
  workingHoursEnd?: number;
}

/**
 * Déterminer la couleur du badge de charge
 */
const getLoadBadgeColor = (count: number) => {
  if (count === 0) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  if (count <= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (count <= 6) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (count <= 9) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

export const CalendarGrid = ({
  days,
  interventions,
  onInterventionClick,
  onSlotClick,
  workingHoursStart = 6,
  workingHoursEnd = 22,
}: CalendarGridProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const workingHours = hours.filter(h => h >= workingHoursStart && h <= workingHoursEnd);

  // Calculer le nombre d'interventions par jour
  const getInterventionsForDay = (day: Date) => {
    return interventions.filter(i => {
      if (!i.scheduledAt || typeof i.scheduledAt.toDate !== 'function') return false;
      return isSameDay(i.scheduledAt.toDate(), day);
    }).length;
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header avec les jours */}
      <div
        className="grid bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}
      >
        <div className="p-2 border-r border-gray-200 dark:border-gray-700"></div>
        {days.map(day => {
          const dayCount = getInterventionsForDay(day);
          return (
            <div
              key={day.toString()}
              className="p-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
              {/* Badge de charge */}
              <div className="mt-1">
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 ${getLoadBadgeColor(dayCount)}`}
                >
                  {dayCount} {dayCount > 1 ? 'interventions' : 'intervention'}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille avec heures et créneaux */}
      <div className="overflow-auto max-h-[600px]">
        {workingHours.map(hour => (
          <div
            key={hour}
            className="grid"
            style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}
          >
            {/* Colonne des heures */}
            <div className="p-2 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 text-right">
              {hour.toString().padStart(2, '0')}:00
            </div>

            {/* Colonnes des jours */}
            {days.map(day => (
              <DroppableTimeSlot
                key={`${day.toString()}-${hour}`}
                day={day}
                hour={hour}
                interventions={interventions}
                onInterventionClick={onInterventionClick}
                onSlotClick={onSlotClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
