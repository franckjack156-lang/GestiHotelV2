/**
 * NotificationCenterPage
 *
 * Centre de notifications avec liste temps réel, filtres, et actions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { Notification, NotificationType } from '@/features/notifications/types/notification.types';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

// Types de notifications avec labels
const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  intervention_created: 'Intervention créée',
  intervention_assigned: 'Intervention assignée',
  intervention_status_changed: 'Statut modifié',
  intervention_completed: 'Intervention terminée',
  intervention_comment: 'Nouveau commentaire',
  intervention_overdue: 'Intervention en retard',
  sla_at_risk: 'SLA à risque',
  sla_breached: 'SLA dépassé',
  message_received: 'Nouveau message',
  mention: 'Mention',
  system: 'Système',
  other: 'Autre',
};

export const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    applyFilters,
    resetFilters,
  } = useNotifications({
    autoLoad: true,
    realTime: true,
    limitCount: 100,
  });

  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  // Appliquer les filtres
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    if (value === 'all') {
      applyFilters({ type: undefined });
    } else {
      applyFilters({ type: value as NotificationType });
    }
  };

  const handleFilterReadChange = (value: string) => {
    setFilterRead(value);
    if (value === 'all') {
      applyFilters({ read: undefined });
    } else {
      applyFilters({ read: value === 'read' });
    }
  };

  // Grouper par date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifications.forEach(notif => {
      if (!notif.createdAt) return;

      const date = notif.createdAt instanceof Timestamp
        ? notif.createdAt.toDate()
        : new Date(notif.createdAt);

      if (isToday(date)) {
        groups.today.push(notif);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  }, [notifications]);

  // Gérer le clic sur une notification
  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lue si non lue
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Naviguer vers l'URL d'action si définie
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.data?.interventionId) {
      navigate(`/app/interventions/${notification.data.interventionId}`);
    }
  };

  // Gérer la suppression
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toast.success('Notification supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Supprimer toutes les lues
  const handleDeleteAllRead = async () => {
    try {
      await deleteAllRead();
      toast.success('Notifications lues supprimées');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bell className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-900 font-medium mb-2">Erreur de chargement</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notification(s) non lue(s)`
              : 'Aucune notification non lue'}
          </p>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          {stats && stats.total - stats.unread > 0 && (
            <Button variant="outline" onClick={handleDeleteAllRead}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer les lues
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Bell className="text-gray-400 w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Non lues</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                </div>
                <Bell className="text-blue-400 w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de lecture</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.readRate.toFixed(0)}%
                  </p>
                </div>
                <CheckCheck className="text-green-400 w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="grid md:grid-cols-2 gap-4 flex-1">
              <Select value={filterType} onValueChange={handleFilterTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
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

              <Select value={filterRead} onValueChange={handleFilterReadChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterType !== 'all' || filterRead !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterType('all');
                  setFilterRead('all');
                  resetFilters();
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-600">
              Vous n'avez aucune notification pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Aujourd'hui */}
          {groupedNotifications.today.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Aujourd'hui</h3>
              <div className="space-y-2">
                {groupedNotifications.today.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={(e) => handleDelete(notification.id, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hier */}
          {groupedNotifications.yesterday.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Hier</h3>
              <div className="space-y-2">
                {groupedNotifications.yesterday.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={(e) => handleDelete(notification.id, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Plus ancien */}
          {groupedNotifications.older.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Plus ancien</h3>
              <div className="space-y-2">
                {groupedNotifications.older.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={(e) => handleDelete(notification.id, e)}
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

// Composant NotificationItem
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const NotificationItem = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) => {
  const createdDate = notification.createdAt instanceof Timestamp
    ? notification.createdAt.toDate()
    : new Date(notification.createdAt);

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
        !notification.read ? 'bg-blue-50 border-blue-200' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Icône */}
          <div className="flex-shrink-0">
            <Bell className={`w-6 h-6 ${!notification.read ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-medium text-gray-900">{notification.title}</h4>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDistanceToNow(createdDate, {
                  locale: fr,
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm text-gray-600">{notification.body}</p>
            {notification.actionLabel && (
              <span className="text-xs text-blue-600 mt-1 inline-block">
                {notification.actionLabel}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
                title="Marquer comme lue"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCenterPage;
