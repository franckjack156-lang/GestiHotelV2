/**
 * ============================================================================
 * PLANNING PAGE - CALENDRIER COMPLET
 * ============================================================================
 *
 * Calendrier des interventions avec :
 * - Vue jour/semaine/mois
 * - Drag & drop (simulation)
 * - Vue par technicien
 * - Vue par chambre
 * - Filtres avancés
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  // Filter, // TODO: Imported but unused
  Users,
  DoorClosed,
  Clock,
  Plus,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import { useInterventions } from '@/features/interventions/hooks/useInterventions';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
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
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '@/features/interventions/types/intervention.types';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'day' | 'week' | 'month';
type GroupMode = 'default' | 'technician' | 'room';

// ============================================================================
// COMPONENT
// ============================================================================

export const PlanningPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  // TODO: isLoading unused
  const { allInterventions } = useInterventions();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [groupMode, setGroupMode] = useState<GroupMode>('default');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation de dates
  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'week') {
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

  // Filtrer les interventions par période
  const filteredInterventions = useMemo(() => {
    return allInterventions.filter(intervention => {
      const scheduledAt = intervention.scheduledAt?.toDate();
      if (!scheduledAt) return false;

      if (viewMode === 'day') {
        return isSameDay(scheduledAt, currentDate);
      } else {
        const start =
          viewMode === 'week'
            ? startOfWeek(currentDate, { locale: fr })
            : startOfMonth(currentDate);
        const end =
          viewMode === 'week' ? endOfWeek(currentDate, { locale: fr }) : endOfMonth(currentDate);

        return scheduledAt >= start && scheduledAt <= end;
      }
    });
  }, [allInterventions, currentDate, viewMode]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planning</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble des interventions planifiées
          </p>
        </div>
        <Button onClick={() => navigate('/app/interventions/create')}>
          <Plus size={16} className="mr-2" />
          Nouvelle intervention
        </Button>
      </div>

      {/* Contrôles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight size={16} />
              </Button>
              <div className="ml-4 font-semibold text-lg capitalize">{periodTitle}</div>
            </div>

            {/* Vues et filtres */}
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupMode} onValueChange={(value: GroupMode) => setGroupMode(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Par défaut</SelectItem>
                  <SelectItem value="technician">Par technicien</SelectItem>
                  <SelectItem value="room">Par chambre</SelectItem>
                </SelectContent>
              </Select>
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
                // Vue mois : Grille de jours
                <div className="grid grid-cols-7 gap-2">
                  {/* Jours de la semaine */}
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Jours du mois */}
                  {days.map(day => {
                    const dayInterventions = interventions.filter(i =>
                      isSameDay(i.scheduledAt?.toDate() || new Date(), day)
                    );

                    return (
                      <div
                        key={day.toString()}
                        className="border rounded-lg p-2 min-h-24 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="text-sm font-medium mb-2">{format(day, 'd')}</div>
                        <div className="space-y-1">
                          {dayInterventions.slice(0, 3).map(intervention => (
                            <div
                              key={intervention.id}
                              onClick={() => navigate(`/app/interventions/${intervention.id}`)}
                              className="text-xs p-1 bg-indigo-100 dark:bg-indigo-900 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 truncate"
                            >
                              {intervention.title}
                            </div>
                          ))}
                          {dayInterventions.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayInterventions.length - 3} autres
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Vue jour/semaine : Timeline
                <div className="space-y-4">
                  {days.map(day => {
                    const dayInterventions = interventions.filter(i =>
                      isSameDay(i.scheduledAt?.toDate() || new Date(), day)
                    );

                    if (dayInterventions.length === 0 && viewMode === 'week') return null;

                    return (
                      <div key={day.toString()}>
                        <h3 className="font-semibold mb-3 capitalize">
                          {format(day, 'EEEE d MMMM', { locale: fr })}
                        </h3>

                        {dayInterventions.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            Aucune intervention planifiée
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {dayInterventions.map(intervention => (
                              <div
                                key={intervention.id}
                                onClick={() => navigate(`/app/interventions/${intervention.id}`)}
                                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock size={14} className="text-gray-400" />
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {intervention.scheduledAt &&
                                          format(intervention.scheduledAt.toDate(), 'HH:mm', {
                                            locale: fr,
                                          })}
                                      </span>
                                    </div>
                                    <h4 className="font-medium">{intervention.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {intervention.location}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={intervention.status} />
                                    <PriorityBadge priority={intervention.priority} />
                                  </div>
                                </div>

                                {intervention.assignedToName && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Users size={14} />
                                    <span>{intervention.assignedToName}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
    </div>
  );
};

export default PlanningPage;
