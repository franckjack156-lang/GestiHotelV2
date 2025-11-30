/**
 * TechnicianActions Component
 *
 * Zone d'actions rapides pour le technicien
 * Permet de démarrer, terminer, mettre en pause une intervention en un clic
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { PlayCircle, PauseCircle, CheckCircle2, Clock, Wrench, AlertCircle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '../../types/intervention.types';

interface TechnicianActionsProps {
  intervention: Intervention;
  onStatusChange: (newStatus: string) => Promise<boolean>;
  canStartWork?: boolean;
  canPause?: boolean;
  canComplete?: boolean;
  isUpdating?: boolean;
}

export const TechnicianActions = ({
  intervention,
  onStatusChange,
  canStartWork = false,
  canPause = false,
  canComplete = false,
  isUpdating = false,
}: TechnicianActionsProps) => {
  const { status, startedAt, estimatedDuration } = intervention;

  // Calculer le temps écoulé si l'intervention a démarré
  const getElapsedTime = () => {
    if (!startedAt) return null;
    const start = startedAt.toDate();
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return { hours, minutes: mins, totalMinutes: minutes };
  };

  const elapsed = getElapsedTime();

  // Déterminer si on dépasse le temps estimé
  const isOvertime =
    elapsed && estimatedDuration ? elapsed.totalMinutes > estimatedDuration : false;

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Actions Technicien
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut actuel et temps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Statut</span>
            <Badge variant={status === 'in_progress' ? 'default' : 'secondary'}>
              {status === 'pending' && 'En attente'}
              {status === 'assigned' && 'Assignée'}
              {status === 'in_progress' && 'En cours'}
              {status === 'on_hold' && 'En pause'}
              {status === 'completed' && 'Terminée'}
              {status === 'validated' && 'Validée'}
            </Badge>
          </div>

          {/* Temps écoulé */}
          {elapsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Temps écoulé</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span
                  className={`font-mono text-sm ${isOvertime ? 'text-orange-600 font-semibold' : ''}`}
                >
                  {elapsed.hours > 0 && `${elapsed.hours}h `}
                  {elapsed.minutes}min
                </span>
                {isOvertime && <AlertCircle className="h-4 w-4 text-orange-600" />}
              </div>
            </div>
          )}

          {/* Temps estimé */}
          {estimatedDuration && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Durée estimée</span>
              <span className="text-sm font-medium">
                {Math.floor(estimatedDuration / 60) > 0 &&
                  `${Math.floor(estimatedDuration / 60)}h `}
                {estimatedDuration % 60}min
              </span>
            </div>
          )}

          {/* Date de début */}
          {startedAt && (
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Démarrée le</span>
              <span>{format(startedAt.toDate(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
            </div>
          )}
        </div>

        {/* Actions disponibles */}
        <div className="space-y-2 pt-2 border-t">
          {canStartWork && (
            <Button
              onClick={() => onStatusChange('in_progress')}
              disabled={isUpdating}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Commencer l'intervention
            </Button>
          )}

          {canPause && (
            <Button
              onClick={() => onStatusChange('on_hold')}
              disabled={isUpdating}
              variant="outline"
              className="w-full"
            >
              <PauseCircle className="mr-2 h-5 w-5" />
              Mettre en pause
            </Button>
          )}

          {status === 'on_hold' && (
            <Button
              onClick={() => onStatusChange('in_progress')}
              disabled={isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Reprendre l'intervention
            </Button>
          )}

          {canComplete && (
            <Button
              onClick={() => onStatusChange('completed')}
              disabled={isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Marquer comme terminée
            </Button>
          )}
        </div>

        {/* Aide contextuelle */}
        {status === 'in_progress' && !canComplete && (
          <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-xs text-blue-800 dark:text-blue-300">
            💡 <strong>Astuce :</strong> Pensez à ajouter des notes de résolution avant de terminer
            l'intervention.
          </div>
        )}

        {status === 'pending' && !canStartWork && (
          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-700 dark:text-gray-300">
            ℹ️ Cette intervention doit vous être assignée pour que vous puissiez la démarrer.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
