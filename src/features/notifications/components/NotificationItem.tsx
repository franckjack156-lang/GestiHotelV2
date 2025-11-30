/**
 * Composant d'affichage d'une notification individuelle
 */

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Users,
  Clock,
  DoorClosed,
  Settings,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: (notification: Notification) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

/**
 * Icône par type de notification
 */
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'intervention_created':
    case 'intervention_assigned':
      return Bell;
    case 'intervention_status_changed':
    case 'intervention_completed':
      return CheckCircle;
    case 'intervention_comment':
    case 'message_received':
    case 'mention':
      return MessageSquare;
    case 'intervention_overdue':
    case 'sla_at_risk':
    case 'sla_breached':
      return Clock;
    case 'intervention_urgent':
      return AlertTriangle;
    case 'room_blocked':
    case 'room_unblocked':
      return DoorClosed;
    case 'validation_required':
      return Users;
    case 'system':
      return Settings;
    default:
      return AlertCircle;
  }
};

/**
 * Couleur par priorité
 */
const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    case 'high':
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    case 'normal':
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    case 'low':
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

/**
 * Couleur de fond par priorité (pour l'indicateur non lu)
 */
const getUnreadIndicatorColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'normal':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
};

export const NotificationItem = ({
  notification,
  onRead,
  onClick,
  onDismiss,
  compact = false,
}: NotificationItemProps) => {
  const Icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);
  const unreadColor = getUnreadIndicatorColor(notification.priority);

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    onClick(notification);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(notification.id);
  };

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: fr })
    : '';

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex items-start gap-3 p-3 cursor-pointer transition-colors',
          'hover:bg-gray-50 dark:hover:bg-gray-800',
          !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
        )}
      >
        {/* Indicateur non lu */}
        {!notification.read && (
          <span className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', unreadColor)} />
        )}

        {/* Icône */}
        <div className={cn('p-1.5 rounded-full', priorityColor)}>
          <Icon size={14} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              !notification.read && 'text-gray-900 dark:text-white'
            )}
          >
            {notification.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-4 p-4 cursor-pointer transition-colors rounded-lg border',
        'hover:bg-gray-50 dark:hover:bg-gray-800',
        !notification.read
          ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
          : 'border-gray-200 dark:border-gray-700'
      )}
    >
      {/* Indicateur non lu */}
      {!notification.read && (
        <span className={cn('w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0', unreadColor)} />
      )}

      {/* Icône */}
      <div className={cn('p-2 rounded-full flex-shrink-0', priorityColor)}>
        <Icon size={18} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={cn('font-medium', !notification.read && 'text-gray-900 dark:text-white')}
            >
              {notification.title}
            </h4>
            {(notification.body || notification.message) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {notification.body || notification.message}
              </p>
            )}
          </div>

          {/* Bouton fermer */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={handleDismiss}
            >
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{timeAgo}</span>
          {notification.actionLabel && notification.actionUrl && (
            <span className="text-indigo-600 dark:text-indigo-400 hover:underline">
              {notification.actionLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
