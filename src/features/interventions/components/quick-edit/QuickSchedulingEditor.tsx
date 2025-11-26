/**
 * QuickSchedulingEditor Component
 *
 * Éditeur rapide pour la planification d'intervention
 * avec suggestions basées sur la charge
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useInterventions } from '../../hooks/useInterventions';
import { useSchedulingSuggestions } from '../../hooks/useSchedulingSuggestions';
import type { Intervention } from '../../types/intervention.types';

interface QuickSchedulingEditorProps {
  intervention: Intervention;
  onSave: (scheduledAt: Date | null, estimatedDuration: number | null) => Promise<boolean>;
  canEdit: boolean;
}

export const QuickSchedulingEditor = ({
  intervention,
  onSave,
  canEdit,
}: QuickSchedulingEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    intervention.scheduledAt ? intervention.scheduledAt.toDate() : null
  );
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(
    intervention.estimatedDuration || null
  );

  // Charger les interventions pour les suggestions
  const { interventions } = useInterventions();

  // Obtenir les suggestions de planification
  const { topSuggestions, stats } = useSchedulingSuggestions({
    interventions: interventions || [],
    estimatedDuration: estimatedDuration || 60,
    assignedTo: intervention.assignedTo,
    priority: intervention.priority,
    excludeWeekends: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(scheduledAt, estimatedDuration);
      if (success) {
        toast.success('Planification mise à jour');
        setIsEditing(false);
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setScheduledAt(intervention.scheduledAt ? intervention.scheduledAt.toDate() : null);
    setEstimatedDuration(intervention.estimatedDuration || null);
    setIsEditing(false);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Planification
          </CardTitle>
          {canEdit && !isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          // Mode affichage
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date et heure prévue</p>
              <p className="font-medium">
                {scheduledAt
                  ? format(scheduledAt, 'dd MMMM yyyy à HH:mm', { locale: fr })
                  : 'Non planifiée'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Durée estimée</p>
              <p className="font-medium">{formatDuration(estimatedDuration)}</p>
            </div>
          </div>
        ) : (
          // Mode édition
          <div className="space-y-4">
            {/* Date et heure */}
            <div className="space-y-2">
              <Label>Date et heure souhaitée</Label>
              <div className="grid grid-cols-2 gap-4">
                {/* Sélecteur de date */}
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !scheduledAt && 'text-muted-foreground'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledAt ? (
                          format(scheduledAt, 'dd MMMM yyyy', { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledAt || undefined}
                        onSelect={date => {
                          if (date) {
                            const existingTime = scheduledAt
                              ? {
                                  hours: scheduledAt.getHours(),
                                  minutes: scheduledAt.getMinutes(),
                                }
                              : { hours: 9, minutes: 0 };

                            date.setHours(existingTime.hours, existingTime.minutes);
                            setScheduledAt(date);
                          } else {
                            setScheduledAt(null);
                          }
                        }}
                        disabled={date => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Sélecteur d'heure */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="HH"
                    min="0"
                    max="23"
                    value={scheduledAt ? scheduledAt.getHours() : ''}
                    onChange={e => {
                      const hours = parseInt(e.target.value);
                      if (hours >= 0 && hours <= 23) {
                        const date = scheduledAt || new Date();
                        date.setHours(hours);
                        setScheduledAt(new Date(date));
                      }
                    }}
                    className="w-20"
                  />
                  <span className="flex items-center">:</span>
                  <Input
                    type="number"
                    placeholder="MM"
                    min="0"
                    max="59"
                    value={scheduledAt ? scheduledAt.getMinutes() : ''}
                    onChange={e => {
                      const minutes = parseInt(e.target.value);
                      if (minutes >= 0 && minutes <= 59) {
                        const date = scheduledAt || new Date();
                        date.setMinutes(minutes);
                        setScheduledAt(new Date(date));
                      }
                    }}
                    className="w-20"
                  />
                </div>
              </div>
              {scheduledAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScheduledAt(null)}
                  className="mt-2"
                >
                  Effacer la planification
                </Button>
              )}
            </div>

            {/* Durée estimée */}
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Durée estimée</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="estimatedDuration"
                  type="number"
                  placeholder="Ex: 120"
                  min="5"
                  max="1440"
                  value={estimatedDuration ?? ''}
                  onChange={e =>
                    setEstimatedDuration(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-32"
                />
                <span className="text-sm text-gray-500">minutes</span>
              </div>
              {estimatedDuration && (
                <p className="text-xs text-gray-500">≈ {formatDuration(estimatedDuration)}</p>
              )}
            </div>

            {/* Suggestions de créneaux */}
            {topSuggestions.length > 0 && (
              <div className="space-y-2">
                <Label>Créneaux suggérés</Label>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {topSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setScheduledAt(suggestion.date)}
                      className={`flex items-center justify-between p-3 text-left border rounded-lg transition-colors ${
                        suggestion.isRecommended
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span className="text-sm font-medium">{suggestion.label}</span>
                          {suggestion.isRecommended && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              Recommandé
                            </span>
                          )}
                        </div>
                        {suggestion.reason && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {suggestion.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {suggestion.load === 0 ? (
                          <TrendingDown size={16} className="text-green-500" />
                        ) : suggestion.load < 3 ? (
                          <TrendingUp size={16} className="text-blue-500" />
                        ) : (
                          <TrendingUp size={16} className="text-orange-500" />
                        )}
                        <span className="text-xs text-gray-500">{suggestion.load}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Statistiques de charge */}
            {stats.totalScheduled > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  📊 Charge actuelle
                </h4>
                <div className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <p>
                    <span className="font-medium">{stats.totalScheduled}</span> interventions
                    planifiées
                  </p>
                  <p>
                    Charge moyenne:{' '}
                    <span className="font-medium">{stats.averageLoad.toFixed(1)}</span>{' '}
                    interventions/jour
                  </p>
                  {stats.maxLoad > 0 && (
                    <p>
                      Charge maximale: <span className="font-medium">{stats.maxLoad}</span>{' '}
                      interventions/jour
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
