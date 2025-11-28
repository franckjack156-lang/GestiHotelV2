/**
 * Menu déroulant de notifications pour le header
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '../types/notification.types';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading?: boolean;
  onRead: (id: string) => void;
  onReadAll: () => void;
  maxItems?: number;
}

export const NotificationDropdown = ({
  notifications,
  unreadCount,
  isLoading = false,
  onRead,
  onReadAll,
  maxItems = 5,
}: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Notifications récentes (limitées)
  const recentNotifications = notifications.slice(0, maxItems);

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lu
    if (!notification.read) {
      onRead(notification.id);
    }

    // Naviguer vers l'action
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.data?.interventionId) {
      navigate(`/app/interventions/${notification.data.interventionId}`);
    }

    setIsOpen(false);
  };

  const handleViewAll = () => {
    navigate('/app/notifications');
    setIsOpen(false);
  };

  const handleSettings = () => {
    navigate('/app/settings/notifications');
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} nouvelles
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={onReadAll}
              >
                Tout marquer lu
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSettings}
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>

        {/* Liste des notifications */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bell className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune notification
              </p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {recentNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={onRead}
                  onClick={handleNotificationClick}
                  compact
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t">
            <Button
              variant="ghost"
              className="w-full justify-center gap-2 text-sm"
              onClick={handleViewAll}
            >
              Voir toutes les notifications
              <ExternalLink size={14} />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
