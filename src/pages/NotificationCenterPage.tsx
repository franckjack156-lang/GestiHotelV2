/**
 * ============================================================================
 * NOTIFICATION CENTER - COMPLET
 * ============================================================================
 *
 * Centre de notifications avec :
 * - Liste notifications temps réel
 * - Marquer comme lu
 * - Filtres par type
 * - Groupement par date
 * - Actions rapides
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Filter, Settings, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { EmptyState, LoadingSkeleton, UserAvatar } from '@/shared/components/ui-extended';
import { useAuth } from '@/features/auth/hooks/useAuth';
import notificationService, {
  type Notification,
  type NotificationType,
} from '@/shared/services/notificationService';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// ============================================================================
// TYPES DE NOTIFICATIONS
// ============================================================================

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  intervention_assigned: 'Intervention assignée',
  intervention_updated: 'Intervention modifiée',
  intervention_completed: 'Intervention terminée',
  intervention_urgent: 'Intervention urgente',
  message_received: 'Nouveau message',
  status_changed: 'Statut modifié',
  room_blocked: 'Chambre bloquée',
  room_unblocked: 'Chambre débloquée',
  mention: 'Mention',
  validation_required: 'Validation requise',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  // Charger les notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      data => {
        setNotifications(data);
        setIsLoading(false);
      },
      100 // Plus de notifications
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Filtrer les notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      // Filtre par type
      if (filterType !== 'all' && notif.type !== filterType) {
        return false;
      }

      // Filtre par statut lu/non lu
      if (filterRead === 'unread' && notif.isRead) {
        return false;
      }
      if (filterRead === 'read' && !notif.isRead) {
        return false;
      }

      return true;
    });
  }, [notifications, filterType, filterRead]);

  // Grouper par date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    filteredNotifications.forEach(notif => {
      const date = notif.createdAt.toDate();

      if (isToday(date)) {
        groups.today.push(notif);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  }, [filteredNotifications]);

  // Marquer comme lue
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      toast.success('Marquée comme lue');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await notificationService.markAllAsRead(user.id);
      toast.success('Toutes marquées comme lues');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Cliquer sur une notification
  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lue si non lue
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // Naviguer vers la ressource liée
    if (notification.relatedType === 'intervention' && notification.relatedId) {
      navigate(`/app/interventions/${notification.relatedId}`);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const urgent = notifications.filter(n => n.type === 'intervention_urgent' && !n.isRead).length;

    return { total, unread, urgent };
  }, [notifications]);

  if (isLoading) {
    return <LoadingSkeleton type="card" count={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stats.unread > 0
              ? `${stats.unread} notification(s) non lue(s)`
              : 'Aucune notification non lue'}
          </p>
        </div>

        <div className="flex gap-2">
          {stats.unread > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck size={16} className="mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="text-gray-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Non lues</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.unread}</p>
              </div>
              <Bell className="text-indigo-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <Bell className="text-red-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="Aucune notification"
          description="Vous n'avez aucune notification pour le moment"
        />
      ) : (
        <div className="space-y-6">
          {/* Aujourd'hui */}
          {groupedNotifications.today.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Aujourd'hui</h3>
              <div className="space-y-2">
                {groupedNotifications.today.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hier */}
          {groupedNotifications.yesterday.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Hier</h3>
              <div className="space-y-2">
                {groupedNotifications.yesterday.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Plus ancien */}
          {groupedNotifications.older.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Plus ancien</h3>
              <div className="space-y-2">
                {groupedNotifications.older.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
}

const NotificationItem = ({ notification, onClick, onMarkAsRead }: NotificationItemProps) => {
  const icon = notificationService.NOTIFICATION_ICONS[notification.type];

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="text-2xl">{icon}</div>

          {/* Contenu */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-medium">{notification.title}</h4>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(notification.createdAt.toDate(), {
                  locale: fr,
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
          </div>

          {/* Actions */}
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onMarkAsRead();
              }}
            >
              <Check size={16} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default NotificationCenterPage;
