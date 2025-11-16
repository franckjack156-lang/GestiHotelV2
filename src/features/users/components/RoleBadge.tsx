/**
 * ============================================================================
 * ROLE BADGE COMPONENT
 * ============================================================================
 */

import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { UserRole, ROLE_LABELS, ROLE_COLORS } from '../types/role.types';
import { Shield, ShieldCheck, Users, Wrench, UserCheck, Eye } from 'lucide-react';

interface RoleBadgeProps {
  /** Rôle à afficher */
  role: UserRole;
  /** Afficher l'icône */
  showIcon?: boolean;
  /** Taille */
  size?: 'sm' | 'md' | 'lg';
  /** Classe CSS additionnelle */
  className?: string;
  /** Variante (default, outline) */
  variant?: 'default' | 'outline' | 'secondary';
}

const roleIcons = {
  [UserRole.SUPER_ADMIN]: Shield,
  [UserRole.ADMIN]: ShieldCheck,
  [UserRole.MANAGER]: Users,
  [UserRole.TECHNICIAN]: Wrench,
  [UserRole.RECEPTIONIST]: UserCheck,
  [UserRole.VIEWER]: Eye,
};

const colorVariants: Record<string, string> = {
  purple:
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  yellow:
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  gray: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  showIcon = true,
  size = 'md',
  className,
  variant = 'default',
}) => {
  const Icon = roleIcons[role];
  const label = ROLE_LABELS[role];
  const color = ROLE_COLORS[role];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        sizeClasses[size],
        variant === 'default' && colorVariants[color],
        'inline-flex items-center gap-1.5 font-medium',
        className
      )}
    >
      {showIcon && Icon && <Icon className={iconSize[size]} />}
      <span>{label}</span>
    </Badge>
  );
};
