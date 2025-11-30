/**
 * ============================================================================
 * RECURRENCE DIALOG COMPONENT
 * ============================================================================
 *
 * Dialogue pour configurer la récurrence des interventions
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
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
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Calendar as CalendarIcon, Repeat, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { RecurrenceConfig, RecurrenceFrequency } from '../types/intervention.types';
import { validateRecurrenceConfig, formatRecurrenceDescription } from '../utils/recurrence.utils';

interface RecurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RecurrenceConfig | null) => void;
  initialConfig?: RecurrenceConfig | null;
}

export const RecurrenceDialog = ({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: RecurrenceDialogProps) => {
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [interval, setInterval] = useState(1);
  const [endMode, setEndMode] = useState<'never' | 'count' | 'date'>('count');
  const [count, setCount] = useState(10);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]); // Lundi par défaut
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  // Charger la configuration initiale
  useEffect(() => {
    if (initialConfig) {
      setFrequency(initialConfig.frequency);
      setInterval(initialConfig.interval);
      setDaysOfWeek(initialConfig.daysOfWeek || [1]);
      setDayOfMonth(initialConfig.dayOfMonth || 1);

      if (initialConfig.count) {
        setEndMode('count');
        setCount(initialConfig.count);
      } else if (initialConfig.endDate) {
        setEndMode('date');
        setEndDate(initialConfig.endDate);
      } else {
        setEndMode('never');
      }
    }
  }, [initialConfig, open]);

  const handleSave = () => {
    const config: RecurrenceConfig = {
      frequency,
      interval,
      ...(endMode === 'count' && { count }),
      ...(endMode === 'date' && endDate && { endDate }),
      ...(frequency === 'weekly' && { daysOfWeek }),
      ...(frequency === 'monthly' && { dayOfMonth }),
    };

    const validationErrors = validateRecurrenceConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSave(config);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setErrors([]);
    onOpenChange(false);
  };

  const handleRemoveRecurrence = () => {
    onSave(null);
    onOpenChange(false);
  };

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Aperçu de la configuration
  const previewConfig: RecurrenceConfig = {
    frequency,
    interval,
    ...(endMode === 'count' && { count }),
    ...(endMode === 'date' && endDate && { endDate }),
    ...(frequency === 'weekly' && { daysOfWeek }),
    ...(frequency === 'monthly' && { dayOfMonth }),
  };

  const description = formatRecurrenceDescription(previewConfig);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Configuration de la récurrence
          </DialogTitle>
          <DialogDescription>
            Définissez comment cette intervention doit se répéter automatiquement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fréquence */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence</Label>
            <Select
              value={frequency}
              onValueChange={(value: RecurrenceFrequency) => setFrequency(value)}
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuelle</SelectItem>
                <SelectItem value="yearly">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Intervalle */}
          <div className="space-y-2">
            <Label htmlFor="interval">
              Répéter tous les{' '}
              {frequency === 'daily'
                ? 'jours'
                : frequency === 'weekly'
                  ? 'semaines'
                  : frequency === 'monthly'
                    ? 'mois'
                    : 'ans'}
            </Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="365"
              value={interval}
              onChange={e => setInterval(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Jours de la semaine (pour récurrence hebdomadaire) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Jours de la semaine</Label>
              <div className="flex gap-2 flex-wrap">
                {dayNames.map((name, index) => (
                  <div key={index} className="flex items-center">
                    <Checkbox
                      id={`day-${index}`}
                      checked={daysOfWeek.includes(index)}
                      onCheckedChange={() => toggleDayOfWeek(index)}
                    />
                    <label htmlFor={`day-${index}`} className="ml-2 text-sm cursor-pointer">
                      {name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jour du mois (pour récurrence mensuelle) */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Jour du mois</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={e => setDayOfMonth(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* Fin de la récurrence */}
          <div className="space-y-3">
            <Label>Fin de la récurrence</Label>
            <RadioGroup
              value={endMode}
              onValueChange={(value: 'never' | 'count' | 'date') => setEndMode(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="end-never" />
                <label htmlFor="end-never" className="text-sm cursor-pointer">
                  Jamais
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="end-count" />
                <label htmlFor="end-count" className="text-sm cursor-pointer">
                  Après
                </label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={count}
                  onChange={e => {
                    setCount(parseInt(e.target.value) || 1);
                    setEndMode('count');
                  }}
                  className="w-20"
                  disabled={endMode !== 'count'}
                />
                <span className="text-sm">occurrences</span>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="end-date" />
                <label htmlFor="end-date" className="text-sm cursor-pointer">
                  Le
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={endMode !== 'date'}
                      onClick={() => setEndMode('date')}
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate
                        ? format(endDate, 'dd MMMM yyyy', { locale: fr })
                        : 'Choisir une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={date => {
                        setEndDate(date);
                        setEndMode('date');
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </RadioGroup>
          </div>

          {/* Aperçu */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Aperçu</p>
            <p className="text-sm text-blue-800 dark:text-blue-400">{description}</p>
          </div>

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                    Erreurs de configuration
                  </p>
                  <ul className="text-sm text-red-800 dark:text-red-400 list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={handleRemoveRecurrence}>
              Supprimer la récurrence
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handleSave}>Enregistrer</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
