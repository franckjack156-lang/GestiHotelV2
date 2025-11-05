/**
 * PriorityPlanningStep Component
 *
 * Étape 3 : Priorité et planification
 */

import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Button } from '@/shared/components/ui/button';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InterventionPriority, PRIORITY_LABELS } from '@/shared/types/status.types';
import type { WizardData } from '@/features/interventions/hooks/useInterventionWizard';

interface PriorityPlanningStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

export const PriorityPlanningStep = ({ data, onUpdate }: PriorityPlanningStepProps) => {
  const handleChange = (field: keyof WizardData, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Priorité */}
      <div className="space-y-2">
        <Label htmlFor="priority">
          Priorité <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.priority || ''}
          onValueChange={value => handleChange('priority', value)}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Sélectionnez la priorité" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Flags urgence et blocage */}
      <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isUrgent"
            checked={data.isUrgent || false}
            onCheckedChange={checked => handleChange('isUrgent', checked)}
          />
          <Label htmlFor="isUrgent" className="cursor-pointer flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>Intervention urgente</span>
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isBlocking"
            checked={data.isBlocking || false}
            onCheckedChange={checked => handleChange('isBlocking', checked)}
          />
          <Label htmlFor="isBlocking" className="cursor-pointer flex items-center gap-2">
            <span>Chambre bloquée</span>
          </Label>
        </div>

        {data.isBlocking && (
          <div className="pl-6 pt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>⚠️ La chambre sera marquée comme indisponible jusqu'à la fin de l'intervention</p>
          </div>
        )}
      </div>

      {/* Date et heure planifiée */}
      <div className="space-y-2">
        <Label>Date et heure souhaitée (optionnel)</Label>
        <div className="grid grid-cols-2 gap-4">
          {/* Sélecteur de date */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !data.scheduledAt && 'text-muted-foreground'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.scheduledAt ? (
                    format(data.scheduledAt, 'dd MMMM yyyy', { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.scheduledAt}
                  onSelect={date => {
                    if (date) {
                      // Conserver l'heure si elle existe déjà
                      const existingTime = data.scheduledAt
                        ? {
                            hours: data.scheduledAt.getHours(),
                            minutes: data.scheduledAt.getMinutes(),
                          }
                        : { hours: 9, minutes: 0 };

                      date.setHours(existingTime.hours, existingTime.minutes);
                      handleChange('scheduledAt', date);
                    } else {
                      handleChange('scheduledAt', undefined);
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
              value={data.scheduledAt ? data.scheduledAt.getHours() : ''}
              onChange={e => {
                const hours = parseInt(e.target.value);
                if (hours >= 0 && hours <= 23) {
                  const date = data.scheduledAt || new Date();
                  date.setHours(hours);
                  handleChange('scheduledAt', new Date(date));
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
              value={data.scheduledAt ? data.scheduledAt.getMinutes() : ''}
              onChange={e => {
                const minutes = parseInt(e.target.value);
                if (minutes >= 0 && minutes <= 59) {
                  const date = data.scheduledAt || new Date();
                  date.setMinutes(minutes);
                  handleChange('scheduledAt', new Date(date));
                }
              }}
              className="w-20"
            />
          </div>
        </div>
        {data.scheduledAt && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleChange('scheduledAt', undefined)}
            className="mt-2"
          >
            Effacer la planification
          </Button>
        )}
      </div>

      {/* Durée estimée */}
      <div className="space-y-2">
        <Label htmlFor="estimatedDuration">Durée estimée (optionnel)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="estimatedDuration"
            type="number"
            placeholder="Ex: 120"
            min="0"
            value={data.estimatedDuration ?? ''}
            onChange={e =>
              handleChange(
                'estimatedDuration',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            className="w-32"
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
        {data.estimatedDuration && (
          <p className="text-xs text-gray-500">
            ≈{' '}
            {Math.floor(data.estimatedDuration / 60) > 0 &&
              `${Math.floor(data.estimatedDuration / 60)}h `}
            {data.estimatedDuration % 60 > 0 && `${data.estimatedDuration % 60}min`}
          </p>
        )}
      </div>

      {/* Récapitulatif */}
      {data.priority && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            📅 Récapitulatif de la planification
          </h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>
              <span className="font-medium">Priorité:</span>{' '}
              {PRIORITY_LABELS[data.priority as InterventionPriority]}
            </p>
            {data.isUrgent && (
              <p className="text-red-600 dark:text-red-400 font-medium">🚨 Intervention urgente</p>
            )}
            {data.isBlocking && (
              <p className="text-orange-600 dark:text-orange-400 font-medium">🚫 Chambre bloquée</p>
            )}
            {data.scheduledAt && (
              <p>
                <span className="font-medium">Planifiée:</span>{' '}
                {format(data.scheduledAt, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            )}
            {data.estimatedDuration && (
              <p>
                <span className="font-medium">Durée estimée:</span>{' '}
                {Math.floor(data.estimatedDuration / 60) > 0 &&
                  `${Math.floor(data.estimatedDuration / 60)}h `}
                {data.estimatedDuration % 60 > 0 && `${data.estimatedDuration % 60}min`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Aide */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Conseils sur la priorité
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>
            <strong>Critique:</strong> Danger immédiat ou impact majeur sur l'activité
          </li>
          <li>
            <strong>Haute:</strong> Problème important nécessitant une intervention rapide
          </li>
          <li>
            <strong>Moyenne:</strong> Intervention à prévoir dans les prochains jours
          </li>
          <li>
            <strong>Basse:</strong> Peut être planifiée selon les disponibilités
          </li>
        </ul>
      </div>
    </div>
  );
};
