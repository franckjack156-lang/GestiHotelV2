/**
 * StatsCard Component
 *
 * Carte de statistique simple avec gestion du débordement de texte
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>;

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-400 dark:text-blue-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-400 dark:text-green-500',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: 'text-yellow-400 dark:text-yellow-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-400 dark:text-red-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-400 dark:text-purple-500',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-300',
    icon: 'text-gray-400 dark:text-gray-500',
  },
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}: StatsCardProps) => {
  const colors = colorClasses[color];

  return (
    <Card className={`h-full ${colors.bg}`}>
      <CardContent className="p-4 sm:p-6 h-full">
        <div className="flex items-start justify-between gap-3 h-full">
          {/* Contenu principal - min-w-0 est CRUCIAL pour le truncate */}
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {title}
            </p>
            <p
              className={`text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 ${colors.text} truncate`}
              title={String(value)}
            >
              {value}
            </p>
            {subtitle && (
              <p
                className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate"
                title={subtitle}
              >
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2 flex-wrap gap-1">
                <span
                  className={`text-xs font-medium ${
                    trend.value >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          {/* Icône - flex-shrink-0 pour empêcher le rétrécissement */}
          {Icon && (
            <div className="flex-shrink-0">
              <Icon className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${colors.icon}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
