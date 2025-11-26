/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * StatsCard Component
 *
 * Carte de statistique simple
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

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
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-400',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'text-yellow-400',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'text-red-400',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-400',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    icon: 'text-gray-400',
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
    <Card className={colors.bg}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${colors.text}`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center mt-2">
                <span
                  className={`text-xs font-medium ${
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-xs text-gray-500 ml-1">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div>
              <Icon className={`w-12 h-12 ${colors.icon}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
