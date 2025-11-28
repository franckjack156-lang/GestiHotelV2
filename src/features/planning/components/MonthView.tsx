/**
 * Vue mensuelle du planning avec jours droppables
 */

import { useDroppable } from '@dnd-kit/core';
import { format, isSameDay } from 'date-fns';
import { Repeat } from 'lucide-react';
import type { Intervention } from '@/features/interventions/types/intervention.types';

// ============================================================================
// DROPPABLE DAY COMPONENT
// ============================================================================

interface DroppableMonthDayProps {
  day: Date;
  interventions: Intervention[];
  onInterventionClick: (id: string) => void;
  isCurrentMonth?: boolean;
}

export const DroppableMonthDay = ({
  day,
  interventions,
  onInterventionClick,
  isCurrentMonth = true,
}: DroppableMonthDayProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-2 min-h-24 transition-colors ${
        isOver
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      } ${!isCurrentMonth ? 'opacity-50' : ''}`}
    >
      <div className="text-sm font-medium mb-2">{format(day, 'd')}</div>
      <div className="space-y-1">
        {interventions.slice(0, 3).map(intervention => (
          <div
            key={intervention.id}
            onClick={() => onInterventionClick(intervention.id)}
            className="text-xs p-1 bg-indigo-100 dark:bg-indigo-900 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 truncate flex items-center gap-1"
          >
            {intervention.isRecurring && (
              <Repeat size={10} className="flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className="truncate">{intervention.title}</span>
          </div>
        ))}
        {interventions.length > 3 && (
          <div className="text-xs text-gray-500">+{interventions.length - 3} autres</div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MONTH VIEW COMPONENT
// ============================================================================

interface MonthViewProps {
  days: Date[];
  interventions: Intervention[];
  onInterventionClick: (id: string) => void;
  currentDate: Date;
}

const WEEKDAY_LABELS = {
  short: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  long: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
};

export const MonthView = ({
  days,
  interventions,
  onInterventionClick,
  currentDate,
}: MonthViewProps) => {
  // Filtrer les interventions par jour
  const getInterventionsForDay = (day: Date) => {
    return interventions.filter(
      i =>
        i.scheduledAt &&
        typeof i.scheduledAt.toDate === 'function' &&
        isSameDay(i.scheduledAt.toDate(), day)
    );
  };

  // Vérifier si un jour est dans le mois courant
  const isInCurrentMonth = (day: Date) => {
    return day.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[320px]">
        {/* Jours de la semaine */}
        {WEEKDAY_LABELS.short.map((shortLabel, index) => (
          <div
            key={`weekday-${index}`}
            className="text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 py-1 sm:py-2"
          >
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{WEEKDAY_LABELS.long[index]}</span>
          </div>
        ))}

        {/* Jours du mois */}
        {days.map(day => (
          <DroppableMonthDay
            key={day.toString()}
            day={day}
            interventions={getInterventionsForDay(day)}
            onInterventionClick={onInterventionClick}
            isCurrentMonth={isInCurrentMonth(day)}
          />
        ))}
      </div>
    </div>
  );
};
