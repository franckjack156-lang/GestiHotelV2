/**
 * ============================================================================
 * ACTIVE BLOCKAGES BADGE
 * ============================================================================
 *
 * Badge showing the count of active room blockages with real-time updates
 */

import { Badge } from '@/shared/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useActiveBlockagesCount } from '../hooks/useBlockages';
import { cn } from '@/shared/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ActiveBlockagesBadgeProps {
  variant?: 'default' | 'minimal' | 'detailed';
  className?: string;
  onClick?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ActiveBlockagesBadge: React.FC<ActiveBlockagesBadgeProps> = ({
  variant = 'default',
  className,
  onClick,
}) => {
  const count = useActiveBlockagesCount();

  // Don't show if no active blockages
  if (count === 0) return null;

  // Minimal variant - just the number
  if (variant === 'minimal') {
    return (
      <Badge
        variant="destructive"
        className={cn(
          'h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold',
          onClick && 'cursor-pointer hover:bg-red-700',
          className
        )}
        onClick={onClick}
      >
        {count}
      </Badge>
    );
  }

  // Detailed variant - with icon and text
  if (variant === 'detailed') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50',
          onClick && 'cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30',
          className
        )}
        onClick={onClick}
      >
        <AlertTriangle className="h-3 w-3 mr-1.5" />
        {count} chambre{count > 1 ? 's' : ''} bloquée{count > 1 ? 's' : ''}
      </Badge>
    );
  }

  // Default variant - icon + number
  return (
    <Badge
      variant="destructive"
      className={cn('gap-1', onClick && 'cursor-pointer hover:bg-red-700', className)}
      onClick={onClick}
    >
      <AlertTriangle className="h-3 w-3" />
      {count}
    </Badge>
  );
};
