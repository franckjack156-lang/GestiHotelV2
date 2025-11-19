/**
 * ============================================================================
 * BLOCKAGE CARD COMPONENT
 * ============================================================================
 *
 * Displays a room blockage card with intervention details
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  User,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { formatDate, formatTime } from '@/shared/utils/dateUtils';
import { cn } from '@/shared/lib/utils';
import type { RoomBlockage } from '../types/blockage.types';

// ============================================================================
// TYPES
// ============================================================================

interface BlockageCardProps {
  blockage: RoomBlockage;
  roomNumber?: string;
  onResolve?: (blockageId: string) => void;
  onViewIntervention?: (interventionId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

// ============================================================================
// URGENCY CONFIG
// ============================================================================

const URGENCY_CONFIG = {
  low: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: AlertCircle,
    label: 'Faible',
  },
  medium: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: AlertCircle,
    label: 'Moyen',
  },
  high: {
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    icon: AlertTriangle,
    label: 'Élevé',
  },
  critical: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: AlertTriangle,
    label: 'Critique',
  },
};

// ============================================================================
// INTERVENTION TYPE CONFIG
// ============================================================================

const TYPE_CONFIG = {
  maintenance: { label: 'Maintenance', color: 'bg-blue-500' },
  cleaning: { label: 'Nettoyage', color: 'bg-green-500' },
  repair: { label: 'Réparation', color: 'bg-orange-500' },
  installation: { label: 'Installation', color: 'bg-purple-500' },
  inspection: { label: 'Inspection', color: 'bg-teal-500' },
  other: { label: 'Autre', color: 'bg-gray-500' },
};

// ============================================================================
// HELPERS
// ============================================================================

const formatDuration = (days: number, hours: number, minutes: number): string => {
  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}min`);
  return parts.join(' ') || '0min';
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// ============================================================================
// COMPONENT
// ============================================================================

export const BlockageCard: React.FC<BlockageCardProps> = ({
  blockage,
  roomNumber,
  onResolve,
  onViewIntervention,
  showActions = true,
  compact = false,
}) => {
  const urgencyConfig = URGENCY_CONFIG[blockage.urgency];
  const typeConfig = TYPE_CONFIG[blockage.interventionType] || TYPE_CONFIG.other;
  const UrgencyIcon = urgencyConfig.icon;

  if (compact) {
    return (
      <Card className="border-l-4" style={{ borderLeftColor: typeConfig.color.replace('bg-', '') }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn('text-xs', urgencyConfig.color)}>
                  <UrgencyIcon className="h-3 w-3 mr-1" />
                  {urgencyConfig.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {typeConfig.label}
                </Badge>
              </div>
              <p className="font-medium text-sm truncate">{blockage.interventionTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDuration(
                  blockage.durationDays,
                  blockage.durationHours,
                  blockage.durationMinutes
                )}
              </p>
            </div>
            {showActions && blockage.isActive && onResolve && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolve(blockage.id)}
                className="shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border-l-4 hover:shadow-md transition-shadow"
      style={{ borderLeftColor: typeConfig.color.replace('bg-', '') }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={urgencyConfig.color}>
                <UrgencyIcon className="h-3 w-3 mr-1" />
                {urgencyConfig.label}
              </Badge>
              <Badge variant="secondary">{typeConfig.label}</Badge>
              {blockage.isActive ? (
                <Badge className="bg-orange-500">
                  <Clock className="h-3 w-3 mr-1" />
                  En cours
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 dark:bg-green-900/20"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Résolu
                </Badge>
              )}
              {blockage.isOverdue && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  En retard
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{blockage.interventionTitle}</CardTitle>
          </div>
          {roomNumber && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Chambre</p>
              <p className="text-2xl font-bold">{roomNumber}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reason */}
        {blockage.reason && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm">{blockage.reason}</p>
          </div>
        )}

        {/* Duration and Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Durée</span>
            </div>
            <p className="text-sm font-semibold">
              {formatDuration(
                blockage.durationDays,
                blockage.durationHours,
                blockage.durationMinutes
              )}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Bloquée le</span>
            </div>
            <p className="text-sm">
              {formatDate(blockage.blockedAt)}
              <span className="text-xs text-muted-foreground ml-1">
                {formatTime(blockage.blockedAt)}
              </span>
            </p>
          </div>
        </div>

        {/* Estimated unblock date */}
        {blockage.estimatedUnblockDate && blockage.isActive && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Déblocage estimé</span>
            </div>
            <p className="text-sm">
              {formatDate(blockage.estimatedUnblockDate)}
              <span className="text-xs text-muted-foreground ml-1">
                {formatTime(blockage.estimatedUnblockDate)}
              </span>
            </p>
          </div>
        )}

        {/* Actual unblock date */}
        {blockage.actualUnblockDate && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Débloquée le</span>
            </div>
            <p className="text-sm">
              {formatDate(blockage.actualUnblockDate)}
              <span className="text-xs text-muted-foreground ml-1">
                {formatTime(blockage.actualUnblockDate)}
              </span>
            </p>
          </div>
        )}

        {/* Revenue Loss */}
        {blockage.estimatedRevenueLoss !== undefined && blockage.estimatedRevenueLoss > 0 && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-900 dark:text-red-100">
                  Perte de revenu estimée
                </span>
              </div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(blockage.estimatedRevenueLoss)}
              </p>
            </div>
            {blockage.roomPricePerNight && (
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                ({formatCurrency(blockage.roomPricePerNight)}/nuit)
              </p>
            )}
          </div>
        )}

        {/* Responsible */}
        <div className="flex items-start gap-4 text-sm">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              <span className="text-xs font-medium">Bloqué par</span>
            </div>
            <p className="font-medium">{blockage.blockedByName}</p>
          </div>
          {blockage.assignedToName && (
            <div className="flex-1">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span className="text-xs font-medium">Assigné à</span>
              </div>
              <p className="font-medium">{blockage.assignedToName}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {blockage.notes && (
          <div className="text-sm">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-muted-foreground italic">{blockage.notes}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {onViewIntervention && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewIntervention(blockage.interventionId)}
                className="flex-1"
              >
                Voir l'intervention
              </Button>
            )}
            {blockage.isActive && onResolve && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onResolve(blockage.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Résoudre
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
