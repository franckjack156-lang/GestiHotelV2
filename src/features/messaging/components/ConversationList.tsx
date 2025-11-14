/**
 * ============================================================================
 * CONVERSATION LIST COMPONENT
 * ============================================================================
 *
 * Liste des conversations avec filtres, recherche et scroll infini
 */

import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Search,
  Plus,
  Pin,
  Users,
  Wrench,
  CheckCheck,
  Circle,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Conversation, ConversationType } from '../types/message.types';
import { cn } from '@/lib/utils';

// ============================================================================
// PROPS
// ============================================================================

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  currentUserId: string;
  typingIndicators?: Record<string, { userId: string; userName: string }[]>;
}

// ============================================================================
// UTILS
// ============================================================================

const getConversationName = (
  conversation: Conversation,
  currentUserId: string
): string => {
  if (conversation.name) {
    return conversation.name;
  }

  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.name || 'Utilisateur inconnu';
  }

  if (conversation.type === 'intervention') {
    return conversation.interventionTitle || 'Intervention';
  }

  return `Groupe (${conversation.participants.length})`;
};

const getConversationAvatar = (
  conversation: Conversation,
  currentUserId: string
): { url?: string; fallback: string } => {
  if (conversation.avatar) {
    return { url: conversation.avatar, fallback: conversation.name?.[0] || 'G' };
  }

  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return {
      url: otherParticipant?.avatar,
      fallback: otherParticipant?.name?.[0] || 'U',
    };
  }

  if (conversation.type === 'intervention') {
    return { fallback: 'I' };
  }

  return { fallback: conversation.name?.[0] || 'G' };
};

const getOnlineStatus = (
  conversation: Conversation,
  currentUserId: string
): boolean => {
  if (conversation.type !== 'direct') return false;

  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );

  return otherParticipant?.isOnline || false;
};

const formatTimestamp = (date: Date | any): string => {
  const dateObj = date?.toDate ? date.toDate() : new Date(date);

  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm', { locale: fr });
  }

  if (isYesterday(dateObj)) {
    return 'Hier';
  }

  return format(dateObj, 'dd/MM/yy', { locale: fr });
};

const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// ============================================================================
// CONVERSATION ITEM COMPONENT
// ============================================================================

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
  isTyping?: boolean;
  typingUsers?: string[];
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  currentUserId,
  onClick,
  isTyping,
  typingUsers = [],
}) => {
  const name = getConversationName(conversation, currentUserId);
  const { url, fallback } = getConversationAvatar(conversation, currentUserId);
  const isOnline = getOnlineStatus(conversation, currentUserId);
  const unreadCount = conversation.unreadCount[currentUserId] || 0;
  const isPinned = conversation.pinnedBy?.includes(currentUserId);

  const getTypeIcon = () => {
    switch (conversation.type) {
      case 'group':
        return <Users className="h-3 w-3 text-muted-foreground" />;
      case 'intervention':
        return <Wrench className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all',
        'hover:bg-accent/50',
        isSelected && 'bg-accent',
        isPinned && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
    >
      {/* Avatar avec indicateur en ligne */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={url} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {fallback}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {/* Ligne 1: Nom + Timestamp */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {isPinned && <Pin className="h-3 w-3 text-blue-600 flex-shrink-0" />}
            {getTypeIcon()}
            <h3
              className={cn(
                'text-sm font-semibold truncate',
                unreadCount > 0 && 'text-foreground'
              )}
            >
              {name}
            </h3>
          </div>

          {conversation.lastMessage && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatTimestamp(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>

        {/* Ligne 2: Dernier message */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isTyping && typingUsers.length > 0 ? (
              <p className="text-sm text-primary italic">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} écrit...`
                  : `${typingUsers.length} personnes écrivent...`}
              </p>
            ) : conversation.lastMessage ? (
              <p
                className={cn(
                  'text-sm truncate',
                  unreadCount > 0
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {conversation.lastMessage.senderId === currentUserId && (
                  <CheckCheck className="inline h-3 w-3 mr-1 text-blue-600" />
                )}
                {conversation.lastMessage.senderName}:{' '}
                {truncateText(conversation.lastMessage.content, 40)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Aucun message
              </p>
            )}
          </div>

          {/* Badge non lu */}
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="bg-primary text-primary-foreground h-5 min-w-5 px-1.5 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  currentUserId,
  typingIndicators = {},
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConversationType | 'all'>('all');

  // Filtrer et trier les conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filtre par type
    if (filter !== 'all') {
      filtered = filtered.filter((c) => c.type === filter);
    }

    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((c) => {
        const name = getConversationName(c, currentUserId).toLowerCase();
        const lastMessage = c.lastMessage?.content.toLowerCase() || '';
        return name.includes(searchLower) || lastMessage.includes(searchLower);
      });
    }

    // Trier: épinglées en premier, puis par date du dernier message
    return filtered.sort((a, b) => {
      const aPinned = a.pinnedBy?.includes(currentUserId) ? 1 : 0;
      const bPinned = b.pinnedBy?.includes(currentUserId) ? 1 : 0;

      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }

      const aTime = a.lastMessage?.createdAt
        ? (a.lastMessage.createdAt as any)?.toDate?.() || a.lastMessage.createdAt
        : new Date(0);
      const bTime = b.lastMessage?.createdAt
        ? (b.lastMessage.createdAt as any)?.toDate?.() || b.lastMessage.createdAt
        : new Date(0);

      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [conversations, filter, search, currentUserId]);

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        {/* Titre + Bouton nouveau */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Messagerie</h2>
          <Button
            size="sm"
            onClick={onNewConversation}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtres par type */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              Tous
            </TabsTrigger>
            <TabsTrigger value="direct" className="text-xs">
              Direct
            </TabsTrigger>
            <TabsTrigger value="group" className="text-xs">
              Groupes
            </TabsTrigger>
            <TabsTrigger value="intervention" className="text-xs">
              Interventions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Circle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? 'Aucune conversation trouvée'
                  : 'Aucune conversation pour le moment'}
              </p>
              {!search && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={onNewConversation}
                  className="mt-2"
                >
                  Créer une nouvelle conversation
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const typing = typingIndicators[conversation.id];
              return (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedId === conversation.id}
                  currentUserId={currentUserId}
                  onClick={() => onSelect(conversation.id)}
                  isTyping={typing && typing.length > 0}
                  typingUsers={typing?.map((t) => t.userName)}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
