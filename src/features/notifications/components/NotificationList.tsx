/**
 * Liste de notifications avec filtrage et pagination
 */

import { useState, useMemo } from 'react';
import { Bell, BellOff, Check, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { NotificationItem } from './NotificationItem';
import type { Notification, NotificationPriority } from '../types/notification.types';

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClick: (notification: Notification) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

type FilterTab = 'all' | 'unread' | 'read';

const TYPE_LABELS: Record<string, string> = {
  all: 'Tous',
  intervention_created: 'Création intervention',
  intervention_assigned: 'Assignation',
  intervention_status_changed: 'Changement statut',
  intervention_completed: 'Terminée',
  intervention_comment: 'Commentaire',
  intervention_overdue: 'En retard',
  intervention_urgent: 'Urgent',
  sla_at_risk: 'SLA à risque',
  sla_breached: 'SLA dépassé',
  message_received: 'Message',
  mention: 'Mention',
  room_blocked: 'Chambre bloquée',
  room_unblocked: 'Chambre débloquée',
  validation_required: 'Validation requise',
  system: 'Système',
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  urgent: 'Urgent',
  high: 'Haute',
  normal: 'Normale',
  low: 'Basse',
};

export const NotificationList = ({
  notifications,
  isLoading = false,
  onRead,
  onReadAll,
  onClick,
  onDismiss,
  compact = false,
}: NotificationListProps) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Statistiques
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    return { total, unread, read: total - unread };
  }, [notifications]);

  // Filtrage des notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtre par onglet (lu/non lu)
      if (activeTab === 'unread' && notification.read) return false;
      if (activeTab === 'read' && !notification.read) return false;

      // Filtre par type
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false;

      // Filtre par priorité
      if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;

      return true;
    });
  }, [notifications, activeTab, typeFilter, priorityFilter]);

  // Types disponibles dans les notifications actuelles
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types);
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{stats.total} notifications</Badge>
          {stats.unread > 0 && <Badge variant="destructive">{stats.unread} non lues</Badge>}
        </div>

        {stats.unread > 0 && (
          <Button variant="outline" size="sm" onClick={onReadAll}>
            <Check size={14} className="mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Onglets de filtrage rapide */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as FilterTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="gap-2">
            <Bell size={14} />
            Toutes ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <Bell size={14} />
            Non lues ({stats.unread})
          </TabsTrigger>
          <TabsTrigger value="read" className="gap-2">
            <BellOff size={14} />
            Lues ({stats.read})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtres avancés */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {availableTypes.map(type => (
              <SelectItem key={type} value={type}>
                {TYPE_LABELS[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <BellOff className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Aucune notification
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'unread'
              ? 'Vous avez lu toutes vos notifications'
              : 'Aucune notification ne correspond à vos filtres'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={onRead}
              onClick={onClick}
              onDismiss={onDismiss}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};
