/**
 * ============================================================================
 * PLANNING PAGE - CALENDRIER COMPLET AVEC DRAG & DROP
 * ============================================================================
 *
 * Calendrier des interventions avec :
 * - Vue jour/semaine/mois
 * - Drag & drop fonctionnel
 * - Vue par technicien
 * - Vue par chambre
 * - Filtres avancés
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  DoorClosed,
  Clock,
  Plus,
  GripVertical,
  Search,
  X,
  Filter,
  Repeat,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useInterventions } from '@/features/interventions/hooks/useInterventions';
import { useInterventionActions } from '@/features/interventions/hooks/useInterventionActions';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { PlanningStatistics } from '@/features/interventions/components/PlanningStatistics';
import { toast } from 'sonner';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  setHours,
  setMinutes,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '@/features/interventions/types/intervention.types';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'day' | 'week' | 'month';
type GroupMode = 'default' | 'technician' | 'room';

// ============================================================================
// DRAGGABLE INTERVENTION CARD
// ============================================================================

interface DraggableInterventionProps {
  intervention: Intervention;
  onClick: () => void;
}

const DraggableIntervention = ({ intervention, onClick }: DraggableInterventionProps) => {
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

  // Couleur basée sur la priorité
  const getPriorityColor = () => {
    switch (intervention.priority) {
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

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded border shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing ${getPriorityColor()} ${
            isDragging ? 'opacity-50' : ''
          }`}
          onClick={onClick}
        >
          {/* Grip handle - purement visuel */}
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

// ============================================================================
// DROPPABLE DAY SLOT - MONTH VIEW
// ============================================================================

interface DroppableMonthDayProps {
  day: Date;
  interventions: Intervention[];
  onInterventionClick: (id: string) => void;
}

const DroppableMonthDay = ({ day, interventions, onInterventionClick }: DroppableMonthDayProps) => {
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
      }`}
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
// TIME SLOT - For hour-based grid
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

  // Filtrer les interventions qui commencent dans cet créneau horaire
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
        const heightPercent = (duration / 60) * 100; // 60min = 100% de hauteur
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
              height: `${Math.max(heightPercent, 25)}%`, // Minimum 25% pour visibilité
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
// CALENDAR GRID - Day/Week view with hour scale
// ============================================================================

interface CalendarGridProps {
  days: Date[];
  interventions: Intervention[];
  viewMode: ViewMode;
  onInterventionClick: (id: string) => void;
  onSlotClick?: (date: Date) => void;
}

const CalendarGrid = ({
  days,
  interventions,
  onInterventionClick,
  onSlotClick,
}: CalendarGridProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23h
  const workingHours = hours.filter(h => h >= 6 && h <= 22); // 6h-22h pour réduire l'affichage

  // Calculer le nombre d'interventions par jour
  const getInterventionsForDay = (day: Date) => {
    return interventions.filter(i => {
      if (!i.scheduledAt || typeof i.scheduledAt.toDate !== 'function') return false;
      return isSameDay(i.scheduledAt.toDate(), day);
    }).length;
  };

  // Déterminer la couleur du badge de charge
  const getLoadBadgeColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    if (count <= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (count <= 6) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (count <= 9)
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
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

// ============================================================================
// COMPONENT
// ============================================================================

export const PlanningPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { allInterventions } = useInterventions();
  const { updateIntervention } = useInterventionActions();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [groupMode, setGroupMode] = useState<GroupMode>('default');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeIntervention, setActiveIntervention] = useState<Intervention | null>(null);

  // États de filtrage
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Configuration du drag and drop avec support tactile pour mobile/tablette
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Navigation de dates
  const goToPrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtenir les jours à afficher
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: fr });
      const end = endOfWeek(currentDate, { locale: fr });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Filtrer les interventions par période ET par filtres avancés
  const filteredInterventions = useMemo(() => {
    return allInterventions.filter(intervention => {
      if (!intervention.scheduledAt) return false;
      if (typeof intervention.scheduledAt.toDate !== 'function') return false;

      const scheduledAt = intervention.scheduledAt.toDate();

      // Filtre par période
      let inPeriod = false;
      if (viewMode === 'day') {
        inPeriod = isSameDay(scheduledAt, currentDate);
      } else {
        const start =
          viewMode === 'week'
            ? startOfWeek(currentDate, { locale: fr })
            : startOfMonth(currentDate);
        const end =
          viewMode === 'week' ? endOfWeek(currentDate, { locale: fr }) : endOfMonth(currentDate);

        inPeriod = scheduledAt >= start && scheduledAt <= end;
      }

      if (!inPeriod) return false;

      // Filtre par statut
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(intervention.status)) {
        return false;
      }

      // Filtre par priorité
      if (
        selectedPriorities.length > 0 &&
        !selectedPriorities.includes(intervention.priority || 'normal')
      ) {
        return false;
      }

      // Filtre par mot-clé
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase();
        const matchesTitle = intervention.title?.toLowerCase().includes(keyword);
        const matchesDescription = intervention.description?.toLowerCase().includes(keyword);
        const matchesLocation = intervention.location?.toLowerCase().includes(keyword);
        const matchesReference = intervention.reference?.toLowerCase().includes(keyword);

        if (!matchesTitle && !matchesDescription && !matchesLocation && !matchesReference) {
          return false;
        }
      }

      return true;
    });
  }, [
    allInterventions,
    currentDate,
    viewMode,
    selectedStatuses,
    selectedPriorities,
    searchKeyword,
  ]);

  // Grouper les interventions
  const groupedInterventions = useMemo(() => {
    if (groupMode === 'technician') {
      const groups: Record<string, Intervention[]> = {};
      filteredInterventions.forEach(intervention => {
        const key = intervention.assignedTo || 'unassigned';
        if (!groups[key]) groups[key] = [];
        groups[key].push(intervention);
      });
      return groups;
    } else if (groupMode === 'room') {
      const groups: Record<string, Intervention[]> = {};
      filteredInterventions.forEach(intervention => {
        const key = intervention.roomNumber || 'no-room';
        if (!groups[key]) groups[key] = [];
        groups[key].push(intervention);
      });
      return groups;
    }
    return { default: filteredInterventions };
  }, [filteredInterventions, groupMode]);

  // Titre de la période
  const periodTitle = useMemo(() => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr });
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: fr });
      const end = endOfWeek(currentDate, { locale: fr });
      return `${format(start, 'd MMM', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: fr });
    }
  }, [currentDate, viewMode]);

  // Handlers du drag and drop
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const intervention = event.active.data.current?.intervention as Intervention;
    setActiveIntervention(intervention);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveIntervention(null);

      if (!over) return;

      const intervention = active.data.current?.intervention as Intervention;
      const targetData = over.data.current as { date: Date } | undefined;

      if (!targetData?.date) {
        return;
      }

      const targetDate = targetData.date;
      const currentDate = intervention.scheduledAt?.toDate();

      try {
        // Pour les créneaux horaires, utiliser l'heure du créneau
        // Pour les jours (vue mois), conserver l'heure d'origine ou mettre 9h par défaut
        let newDate = new Date(targetDate);

        // Si le créneau a une heure spécifique (vue jour/semaine), l'utiliser
        // Sinon conserver l'heure d'origine (vue mois)
        const targetHour = targetDate.getHours();
        if (targetHour === 0 && targetDate.getMinutes() === 0) {
          // Créneau de jour sans heure spécifique (vue mois)
          if (currentDate) {
            newDate = setHours(newDate, currentDate.getHours());
            newDate = setMinutes(newDate, currentDate.getMinutes());
          } else {
            newDate = setHours(newDate, 9);
            newDate = setMinutes(newDate, 0);
          }
        }
        // Sinon, l'heure est déjà définie dans targetDate (vue jour/semaine)

        // Vérifier si la date/heure a vraiment changé
        if (currentDate && currentDate.getTime() === newDate.getTime()) {
          return; // Pas de changement
        }

        // Mettre à jour l'intervention
        await updateIntervention(intervention.id, {
          scheduledAt: newDate,
        });

        toast.success(
          `Intervention déplacée au ${format(newDate, 'dd MMMM yyyy à HH:mm', { locale: fr })}`
        );
      } catch {
        toast.error("Erreur lors du déplacement de l'intervention");
      }
    },
    [updateIntervention]
  );

  // Handler pour créer une intervention en cliquant sur un créneau vide
  const handleSlotClick = useCallback(
    (date: Date) => {
      // Naviguer vers la création d'intervention avec la date préremplie
      const dateParam = encodeURIComponent(date.toISOString());
      navigate(`/app/interventions/create?scheduledAt=${dateParam}`);
      toast.info(
        `Création d'intervention pour le ${format(date, 'dd MMMM yyyy à HH:mm', { locale: fr })}`
      );
    },
    [navigate]
  );

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Veuillez sélectionner un établissement</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Header - Responsive optimisé */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Planning</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 line-clamp-1">
                <span className="hidden md:inline">
                  Vue d'ensemble des interventions planifiées - Drag & drop pour déplacer
                </span>
                <span className="md:hidden">Interventions planifiées</span>
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/interventions/create')}
              size="sm"
              className="flex-shrink-0 w-full xs:w-auto"
            >
              <Plus size={16} className="sm:mr-2" />
              <span className="hidden xs:inline">Nouvelle intervention</span>
              <span className="xs:hidden">Nouvelle intervention</span>
            </Button>
          </div>

          {/* Contrôles - Optimisé mobile */}
          <Card>
            <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-3">
                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevious}
                        className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4"
                      >
                        Aujourd'hui
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNext}
                        className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                    <div className="font-semibold text-xs sm:text-base md:text-lg capitalize truncate ml-2">
                      {periodTitle}
                    </div>
                  </div>

                  {/* Vues et filtres */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={viewMode}
                      onValueChange={(value: ViewMode) => setViewMode(value)}
                    >
                      <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Jour</SelectItem>
                        <SelectItem value="week">Semaine</SelectItem>
                        <SelectItem value="month">Mois</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={groupMode}
                      onValueChange={(value: GroupMode) => setGroupMode(value)}
                    >
                      <SelectTrigger className="flex-1 sm:w-40 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Défaut</SelectItem>
                        <SelectItem value="technician">Technicien</SelectItem>
                        <SelectItem value="room">Chambre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filtres avancés */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Recherche par mot-clé */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchKeyword}
                      onChange={e => setSearchKeyword(e.target.value)}
                      className="pl-10 text-sm"
                    />
                    {searchKeyword && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchKeyword('')}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>

                  {/* Filtre par statut */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                        <Filter size={14} />
                        <span className="hidden xs:inline">Statut</span>
                        {selectedStatuses.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {selectedStatuses.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Filtrer par statut</h4>
                        <div className="space-y-2">
                          {[
                            'pending',
                            'assigned',
                            'in_progress',
                            'on_hold',
                            'completed',
                            'validated',
                            'cancelled',
                          ].map(status => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`status-${status}`}
                                checked={selectedStatuses.includes(status)}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    setSelectedStatuses([...selectedStatuses, status]);
                                  } else {
                                    setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`status-${status}`}
                                className="text-sm cursor-pointer capitalize"
                              >
                                {status === 'pending'
                                  ? 'En attente'
                                  : status === 'assigned'
                                    ? 'Assignée'
                                    : status === 'in_progress'
                                      ? 'En cours'
                                      : status === 'on_hold'
                                        ? 'En pause'
                                        : status === 'completed'
                                          ? 'Terminée'
                                          : status === 'validated'
                                            ? 'Validée'
                                            : 'Annulée'}
                              </label>
                            </div>
                          ))}
                        </div>
                        {selectedStatuses.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedStatuses([])}
                          >
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Filtre par priorité */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                        <Filter size={14} />
                        <span className="hidden xs:inline">Priorité</span>
                        {selectedPriorities.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {selectedPriorities.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Filtrer par priorité</h4>
                        <div className="space-y-2">
                          {['low', 'normal', 'high', 'urgent', 'critical'].map(priority => (
                            <div key={priority} className="flex items-center space-x-2">
                              <Checkbox
                                id={`priority-${priority}`}
                                checked={selectedPriorities.includes(priority)}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    setSelectedPriorities([...selectedPriorities, priority]);
                                  } else {
                                    setSelectedPriorities(
                                      selectedPriorities.filter(p => p !== priority)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`priority-${priority}`}
                                className="text-sm cursor-pointer capitalize"
                              >
                                {priority === 'low'
                                  ? 'Basse'
                                  : priority === 'normal'
                                    ? 'Normale'
                                    : priority === 'high'
                                      ? 'Haute'
                                      : priority === 'urgent'
                                        ? 'Urgente'
                                        : 'Critique'}
                              </label>
                            </div>
                          ))}
                        </div>
                        {selectedPriorities.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedPriorities([])}
                          >
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Indicateur de filtres actifs */}
                  {(searchKeyword ||
                    selectedStatuses.length > 0 ||
                    selectedPriorities.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchKeyword('');
                        setSelectedStatuses([]);
                        setSelectedPriorities([]);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={14} className="mr-1" />
                      Effacer tous les filtres
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendrier */}
          <div className="space-y-4">
            {Object.entries(groupedInterventions).map(([groupKey, interventions]) => (
              <Card key={groupKey}>
                {groupMode !== 'default' && (
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {groupMode === 'technician' ? (
                        <>
                          <Users size={16} />
                          {groupKey === 'unassigned' ? 'Non assignées' : `Technicien ${groupKey}`}
                        </>
                      ) : (
                        <>
                          <DoorClosed size={16} />
                          {groupKey === 'no-room' ? 'Sans chambre' : `Chambre ${groupKey}`}
                        </>
                      )}
                      <span className="text-sm text-gray-500">({interventions.length})</span>
                    </CardTitle>
                  </CardHeader>
                )}

                <CardContent className={groupMode !== 'default' ? '' : 'pt-6'}>
                  {viewMode === 'month' ? (
                    // Vue mois : Grille de jours avec scroll horizontal sur mobile
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[320px]">
                        {/* Jours de la semaine */}
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                          <div
                            key={`${day}-${index}`}
                            className="text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 py-1 sm:py-2"
                          >
                            <span className="sm:hidden">{day}</span>
                            <span className="hidden sm:inline">
                              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index]}
                            </span>
                          </div>
                        ))}

                        {/* Jours du mois */}
                        {days.map(day => {
                          const dayInterventions = interventions.filter(
                            i =>
                              i.scheduledAt &&
                              typeof i.scheduledAt.toDate === 'function' &&
                              isSameDay(i.scheduledAt.toDate(), day)
                          );

                          return (
                            <DroppableMonthDay
                              key={day.toString()}
                              day={day}
                              interventions={dayInterventions}
                              onInterventionClick={id => navigate(`/app/interventions/${id}`)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Vue jour/semaine : Calendrier avec échelle d'heures
                    <CalendarGrid
                      days={days}
                      interventions={interventions}
                      viewMode={viewMode}
                      onInterventionClick={id => navigate(`/app/interventions/${id}`)}
                      onSlotClick={handleSlotClick}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInterventions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-semibold mb-2">Aucune intervention</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aucune intervention planifiée pour cette période
                </p>
                <Button onClick={() => navigate('/app/interventions/create')}>
                  Créer une intervention
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Statistiques visuelles */}
          {filteredInterventions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Statistiques de la période</h2>
              <PlanningStatistics
                interventions={filteredInterventions}
                period={{
                  start:
                    viewMode === 'week'
                      ? startOfWeek(currentDate, { locale: fr })
                      : viewMode === 'month'
                        ? startOfMonth(currentDate)
                        : currentDate,
                  end:
                    viewMode === 'week'
                      ? endOfWeek(currentDate, { locale: fr })
                      : viewMode === 'month'
                        ? endOfMonth(currentDate)
                        : currentDate,
                }}
              />
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeIntervention && (
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-lg opacity-90">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activeIntervention.scheduledAt &&
                    format(activeIntervention.scheduledAt.toDate(), 'HH:mm', { locale: fr })}
                </span>
                {activeIntervention.isRecurring && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Repeat size={10} />
                    Récurrente
                  </Badge>
                )}
              </div>
              <h4 className="font-medium">{activeIntervention.title}</h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  );
};

export default PlanningPage;
