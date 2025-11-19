/**
 * ============================================================================
 * ACTIVE BLOCKAGES WIDGET
 * ============================================================================
 *
 * Dashboard widget showing active room blockages with key metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { AlertTriangle, DollarSign, Clock, ArrowRight, Lock } from 'lucide-react';
import { useBlockages } from '../hooks/useBlockages';
import { LoadingSkeleton } from '@/shared/components/ui-extended';
import { BlockageCard } from './BlockageCard';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

interface ActiveBlockagesWidgetProps {
  maxItems?: number;
  showActions?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (days: number): string => {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return '1 jour';
  return `${days} jours`;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ActiveBlockagesWidget: React.FC<ActiveBlockagesWidgetProps> = ({
  maxItems = 5,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const { activeBlockages, isLoading, resolveBlockage } = useBlockages();

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  // Calculate summary metrics
  const totalRevenueLoss = activeBlockages.reduce(
    (sum, b) => sum + (b.estimatedRevenueLoss || 0),
    0
  );

  const averageDuration =
    activeBlockages.length > 0
      ? activeBlockages.reduce((sum, b) => sum + b.durationDays, 0) / activeBlockages.length
      : 0;

  const criticalBlockages = activeBlockages.filter(b => b.urgency === 'critical').length;
  const highBlockages = activeBlockages.filter(b => b.urgency === 'high').length;

  const displayedBlockages = activeBlockages.slice(0, maxItems);

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-600" />
              Chambres Bloquées
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {activeBlockages.length} chambre{activeBlockages.length > 1 ? 's' : ''} actuellement
              bloquée{activeBlockages.length > 1 ? 's' : ''}
            </p>
          </div>
          {activeBlockages.length > 0 && (
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20"
            >
              {activeBlockages.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeBlockages.length === 0 ? (
          <div className="text-center py-8">
            <Lock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Aucune chambre bloquée actuellement</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Toutes vos chambres sont disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-xs font-medium text-red-900 dark:text-red-200">
                    Perte estimée
                  </p>
                </div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalRevenueLoss)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-xs font-medium text-orange-900 dark:text-orange-200">
                    Durée moy.
                  </p>
                </div>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatDuration(Math.round(averageDuration))}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Urgents</p>
                </div>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {criticalBlockages + highBlockages}
                </p>
              </div>
            </div>

            {/* Active Blockages List */}
            <div className="space-y-3 mt-4">
              {displayedBlockages.map(blockage => (
                <BlockageCard
                  key={blockage.id}
                  blockage={blockage}
                  onResolve={showActions ? resolveBlockage : undefined}
                  onViewIntervention={interventionId =>
                    navigate(`/app/interventions/${interventionId}`)
                  }
                  showActions={showActions}
                  compact
                />
              ))}
            </div>

            {/* View All Button */}
            {activeBlockages.length > maxItems && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/app/rooms?filter=blocked')}
              >
                Voir toutes les chambres bloquées
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
