/**
 * ============================================================================
 * USER STATS COMPONENT
 * ============================================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { UserStats as UserStatsType } from '../types/user.types';
import { UserRole, ROLE_LABELS } from '../types/role.types';
import { Users, UserCheck, UserX, TrendingUp, Activity } from 'lucide-react';

interface UserStatsProps {
  /** Statistiques */
  stats: UserStatsType | null;
  /** Loading */
  isLoading?: boolean;
}

export const UserStats: React.FC<UserStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const kpis = [
    {
      title: 'Total Utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Actifs',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      subtitle: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`,
    },
    {
      title: 'Inactifs',
      value: stats.inactiveUsers,
      icon: UserX,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    },
    {
      title: 'Nouveaux (30j)',
      value: stats.newUsersLast30Days,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Répartition par rôle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition par rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byRole).map(([role, count]) => {
              const percentage = Math.round((count / stats.totalUsers) * 100);
              return (
                <div key={role} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ROLE_LABELS[role as UserRole]}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Connexions (7 derniers jours)
              </span>
              <span className="font-semibold">{stats.recentLogins}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Nouveaux utilisateurs (30 jours)
              </span>
              <span className="font-semibold">{stats.newUsersLast30Days}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
