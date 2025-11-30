/**
 * Composant Badge SLA
 *
 * Affiche le statut SLA d'une intervention avec temps restant
 */

import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import type { Intervention } from '../types/intervention.types';
import {
  calculateSLA,
  formatRemainingTime,
  getSLABadgeColor,
  getSLAStatusLabel,
} from '../services/slaService';

interface SLABadgeProps {
  intervention: Intervention;
  showDetails?: boolean;
  className?: string;
}

export const SLABadge = ({ intervention, showDetails = false, className = '' }: SLABadgeProps) => {
  // Ne pas afficher si l'intervention est terminée ou annulée
  if (intervention.status === 'completed' || intervention.status === 'cancelled') {
    return null;
  }

  const slaInfo = calculateSLA(intervention);
  const badgeColor = getSLABadgeColor(slaInfo.status);
  const statusLabel = getSLAStatusLabel(slaInfo.status);
  const remainingTimeText = formatRemainingTime(slaInfo.remainingMinutes);

  // Icône selon le statut
  const Icon =
    slaInfo.status === 'breached'
      ? AlertTriangle
      : slaInfo.status === 'at_risk'
        ? Clock
        : CheckCircle;

  if (showDetails) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <Badge className={badgeColor}>
          <Icon className="w-3 h-3 mr-1" />
          {statusLabel}
        </Badge>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {slaInfo.isBreached ? 'Dépassé de ' : 'Reste '}
          {remainingTimeText}
        </span>
      </div>
    );
  }

  return (
    <Badge className={`${badgeColor} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {statusLabel} • {remainingTimeText}
    </Badge>
  );
};

/**
 * Composant pour afficher les détails SLA complets
 */
interface SLADetailsProps {
  intervention: Intervention;
  className?: string;
}

export const SLADetails = ({ intervention, className = '' }: SLADetailsProps) => {
  const slaInfo = calculateSLA(intervention);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Statut SLA</span>
        <SLABadge intervention={intervention} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Temps écoulé</span>
          <div className="font-medium">{formatRemainingTime(slaInfo.elapsedMinutes)}</div>
        </div>

        <div>
          <span className="text-gray-500 dark:text-gray-400">Temps restant</span>
          <div className="font-medium">{formatRemainingTime(slaInfo.remainingMinutes)}</div>
        </div>

        <div>
          <span className="text-gray-500 dark:text-gray-400">Objectif SLA</span>
          <div className="font-medium">{formatRemainingTime(slaInfo.targetMinutes)}</div>
        </div>

        <div>
          <span className="text-gray-500 dark:text-gray-400">Échéance</span>
          <div className="font-medium">
            {slaInfo.dueDate.toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {slaInfo.responseTime !== undefined && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Temps de réponse</span>
            <div className="font-medium">{formatRemainingTime(slaInfo.responseTime)}</div>
          </div>
        )}

        {slaInfo.resolutionTime !== undefined && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Temps de résolution</span>
            <div className="font-medium">{formatRemainingTime(slaInfo.resolutionTime)}</div>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Progression</span>
          <span className="font-medium">{slaInfo.percentageUsed}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              slaInfo.status === 'breached'
                ? 'bg-red-500'
                : slaInfo.status === 'at_risk'
                  ? 'bg-orange-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, slaInfo.percentageUsed)}%` }}
          />
        </div>
      </div>

      {slaInfo.isBreached && slaInfo.breachedAt && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-600 dark:text-red-400">
              <div className="font-medium">SLA dépassé</div>
              <div className="text-xs mt-1">
                Depuis le{' '}
                {slaInfo.breachedAt.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
