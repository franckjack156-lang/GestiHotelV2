/**
 * ============================================================================
 * CHAT WINDOW COMPONENT
 * ============================================================================
 *
 * Fenêtre de chat avec liste des messages et header
 */

import React, { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  MoreVertical,
  Info,
  Pin,
  Archive,
  CheckCheck,
  Check,
  Download,
  File,
  Image as ImageIcon,
  Users,
  Circle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Conversation, Message, SendMessageData } from '../types/message.types';
import { MessageInput } from './MessageInput';
import { cn } from '@/lib/utils';
import type { Timestamp } from 'firebase/firestore';
import { EmojiPicker } from './EmojiPicker';

// ============================================================================
// PROPS
// ============================================================================

export interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (data: SendMessageData) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  isSending?: boolean;
  typingUsers?: { userId: string; userName: string }[];
  onReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onPinConversation?: () => void;
  onArchiveConversation?: () => void;
  onShowInfo?: () => void;
  onDeleteConversation?: () => void;
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Convertir un timestamp Firestore en Date JavaScript
 * @param timestamp - Le timestamp à convertir
 * @param fallbackTimestamp - Timestamp de fallback (optionnel, ex: clientCreatedAt)
 */
const toDate = (timestamp: any, fallbackTimestamp?: number): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else if (typeof timestamp === 'number') {
    return new Date(timestamp);
  } else {
    // Pour serverTimestamp() non résolu, utiliser le fallback client ou la date actuelle
    if (fallbackTimestamp) {
      return new Date(fallbackTimestamp);
    }
    return new Date();
  }
};

const formatMessageTime = (date: Date | Timestamp, clientCreatedAt?: number): string => {
  const dateObj = toDate(date, clientCreatedAt);

  // Vérifier que la date est valide avant de formater
  if (isNaN(dateObj.getTime())) {
    return '--:--';
  }

  return format(dateObj, 'HH:mm', { locale: fr });
};

const formatDateSeparator = (date: Date | Timestamp, clientCreatedAt?: number): string => {
  const dateObj = toDate(date, clientCreatedAt);

  // Vérifier que la date est valide avant d'utiliser date-fns
  if (isNaN(dateObj.getTime())) {
    return "Aujourd'hui";
  }

  if (isToday(dateObj)) {
    return "Aujourd'hui";
  }

  if (isYesterday(dateObj)) {
    return 'Hier';
  }

  return format(dateObj, 'EEEE d MMMM yyyy', { locale: fr });
};

const groupMessagesByDate = (messages: Message[]): Map<string, Message[]> => {
  const grouped = new Map<string, Message[]>();

  messages.forEach(message => {
    const date = toDate(message.createdAt, (message as any).clientCreatedAt);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(message);
  });

  // Trier les messages dans chaque groupe par ordre chronologique
  grouped.forEach((msgs, key) => {
    grouped.set(
      key,
      msgs.sort((a, b) => {
        const aTime = toDate(a.createdAt, (a as any).clientCreatedAt).getTime();
        const bTime = toDate(b.createdAt, (b as any).clientCreatedAt).getTime();
        return aTime - bTime; // Ordre chronologique (ancien -> récent)
      })
    );
  });

  return grouped;
};

const shouldGroupMessages = (current: Message, previous: Message | undefined): boolean => {
  if (!previous) return false;
  if (current.senderId !== previous.senderId) return false;
  if (current.type === 'system' || previous.type === 'system') return false;

  const currentTime = toDate(current.createdAt, (current as any).clientCreatedAt);
  const previousTime = toDate(previous.createdAt, (previous as any).clientCreatedAt);

  const diff = currentTime.getTime() - previousTime.getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  return File;
};

const highlightMentions = (content: string): React.ReactNode => {
  const mentionRegex = /@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Texte avant la mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // La mention
    parts.push(
      <span key={match.index} className="bg-primary/10 text-primary font-medium px-1 rounded">
        @{match[1]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Texte restant
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGrouped: boolean;
  showAvatar: boolean;
  currentUserId: string;
  onReaction?: (emoji: string) => void;
  onRemoveReaction?: () => void;
  onReply?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isGrouped,
  showAvatar,
  currentUserId,
  onReaction,
  onRemoveReaction,
  onReply,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-4 py-2 rounded-full text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const handleEmojiClick = (emoji: string) => {
    onReaction?.(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div
      className={cn(
        'flex gap-2 group',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        isGrouped && 'mt-1'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8">
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback className="text-xs">{message.senderName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name (pour messages groupés ou non own) */}
        {!isGrouped && !isOwn && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
            {message.senderName}
          </span>
        )}

        {/* Reply to preview */}
        {message.replyTo && (
          <div
            className={cn(
              'text-xs px-3 py-1.5 mb-1 rounded border-l-2 bg-muted/50',
              isOwn ? 'border-primary/50' : 'border-muted-foreground/50'
            )}
          >
            <p className="font-medium text-muted-foreground">{message.replyTo.senderName}</p>
            <p className="text-muted-foreground/80 truncate max-w-[300px]">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-3 py-2 relative',
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted',
            message.isDeleted && 'opacity-60 italic'
          )}
        >
          {message.isDeleted ? (
            <p className="text-sm">Message supprimé</p>
          ) : (
            <>
              {/* Content */}
              <p className="text-sm whitespace-pre-wrap break-words">
                {highlightMentions(message.content)}
              </p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment, index) => {
                    const IconComponent = getFileIcon(attachment.type);

                    if (attachment.type.startsWith('image/')) {
                      return (
                        <div key={index} className="rounded overflow-hidden max-w-sm">
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-full h-auto"
                          />
                        </div>
                      );
                    }

                    return (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex items-center gap-2 p-2 rounded border',
                          isOwn
                            ? 'bg-primary-foreground/10 border-primary-foreground/20'
                            : 'bg-background border-border'
                        )}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{attachment.name}</p>
                        </div>
                        <Download className="h-3 w-3 flex-shrink-0" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Timestamp + Read status */}
              <div
                className={cn(
                  'flex items-center gap-1 mt-1 text-xs',
                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}
              >
                <span>
                  {formatMessageTime(message.createdAt, (message as any).clientCreatedAt)}
                </span>
                {message.isEdited && <span>(modifié)</span>}
                {isOwn && (
                  <>
                    {message.readBy.length > 1 ? (
                      <CheckCheck className="h-3 w-3 text-blue-400" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Hover actions */}
          {!message.isDeleted && (
            <div
              className={cn(
                'absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
                isOwn ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'
              )}
            >
              <div className="bg-background border rounded-lg shadow-lg flex items-center p-1 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-6 w-6 p-0"
                >
                  <span className="text-sm">😊</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={onReply} className="h-6 px-2 text-xs">
                  Répondre
                </Button>
              </div>
            </div>
          )}

          {/* Emoji Picker pour réactions */}
          {showEmojiPicker && (
            <>
              {/* Overlay pour fermer au clic à l'extérieur */}
              <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
              <div className={cn('absolute top-full mt-1 z-50', isOwn ? 'right-0' : 'left-0')}>
                <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={350} />
              </div>
            </>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.reactions.reduce(
                (acc, reaction) => {
                  if (!acc[reaction.emoji]) {
                    acc[reaction.emoji] = { userIds: [], userNames: [] };
                  }
                  acc[reaction.emoji].userIds.push(reaction.userId);
                  acc[reaction.emoji].userNames.push(reaction.userName);
                  return acc;
                },
                {} as Record<string, { userIds: string[]; userNames: string[] }>
              )
            ).map(([emoji, data]) => {
              const hasUserReacted = data.userIds.includes(currentUserId);

              return (
                <button
                  key={emoji}
                  onClick={() => {
                    // Si l'utilisateur a déjà réagi avec cet emoji, retirer la réaction
                    if (hasUserReacted) {
                      onRemoveReaction?.();
                    } else {
                      // Sinon, ajouter la réaction (qui remplacera l'ancienne s'il en avait une)
                      onReaction?.(emoji);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border',
                    'hover:bg-accent transition-colors',
                    hasUserReacted && 'bg-primary/10 border-primary'
                  )}
                  title={data.userNames.join(', ')}
                >
                  <span>{emoji}</span>
                  <span className="text-muted-foreground">{data.userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onLoadMore,
  hasMore,
  isLoading = false,
  isSending = false,
  typingUsers = [],
  onReaction,
  onRemoveReaction,
  onTypingStart,
  onTypingStop,
  onPinConversation,
  onArchiveConversation,
  onShowInfo,
  onDeleteConversation,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<SendMessageData['replyTo']>();
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Auto-scroll vers le bas pour les nouveaux messages
  useEffect(() => {
    if (shouldScrollToBottom && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, shouldScrollToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShouldScrollToBottom(isAtBottom);

    // Load more au scroll vers le haut
    if (target.scrollTop < 100 && hasMore && !isLoading) {
      onLoadMore();
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo({
      messageId: message.id,
      content: message.content,
      senderName: message.senderName,
    });
  };

  const groupedMessages = groupMessagesByDate(messages);
  const sortedDates = Array.from(groupedMessages.keys()).sort();

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'direct') {
      const other = conversation.participants.find(p => p.userId !== currentUserId);
      return other?.name || 'Utilisateur';
    }
    return `Groupe (${conversation.participants.length})`;
  };

  const getConversationAvatar = () => {
    if (conversation.avatar) return conversation.avatar;
    if (conversation.type === 'direct') {
      const other = conversation.participants.find(p => p.userId !== currentUserId);
      return other?.avatar;
    }
    return undefined;
  };

  const isOnline =
    conversation.type === 'direct' &&
    conversation.participants.find(p => p.userId !== currentUserId)?.isOnline;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getConversationAvatar()} alt={getConversationName()} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getConversationName()[0]}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>

            <div>
              <h2 className="font-semibold">{getConversationName()}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {conversation.type === 'group' && (
                  <>
                    <Users className="h-3 w-3" />
                    <span>{conversation.participants.length} membres</span>
                  </>
                )}
                {conversation.type === 'direct' && isOnline && (
                  <span className="text-green-600">En ligne</span>
                )}
                {typingUsers.length > 0 && (
                  <span className="text-primary italic">
                    {typingUsers.length === 1
                      ? `${typingUsers[0].userName} écrit...`
                      : `${typingUsers.length} personnes écrivent...`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShowInfo}>
                <Info className="h-4 w-4 mr-2" />
                Informations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPinConversation}>
                <Pin className="h-4 w-4 mr-2" />
                {conversation.pinnedBy?.includes(currentUserId) ? 'Désépingler' : 'Épingler'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchiveConversation}>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDeleteConversation}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6" onScroll={handleScroll as any}>
          {/* Load more indicator */}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Charger plus de messages'
                )}
              </Button>
            </div>
          )}

          {/* Messages groupés par date */}
          {sortedDates.map(dateKey => {
            const dateMessages = groupedMessages.get(dateKey) || [];
            const firstMessage = dateMessages[0];
            const date = toDate(firstMessage.createdAt, (firstMessage as any).clientCreatedAt);

            return (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex justify-center my-4">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                    {formatDateSeparator(date, (firstMessage as any).clientCreatedAt)}
                  </div>
                </div>

                {/* Messages du jour */}
                <div className="space-y-2">
                  {dateMessages.map((message, index) => {
                    const previousMessage = index > 0 ? dateMessages[index - 1] : undefined;
                    const isGrouped = shouldGroupMessages(message, previousMessage);
                    const showAvatar = !isGrouped;
                    const isOwn = message.senderId === currentUserId;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        isGrouped={isGrouped}
                        showAvatar={showAvatar}
                        currentUserId={currentUserId}
                        onReaction={emoji => onReaction?.(message.id, emoji)}
                        onRemoveReaction={() => onRemoveReaction?.(message.id)}
                        onReply={() => handleReply(message)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Circle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucun message pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Envoyez un message pour démarrer la conversation
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        onSend={onSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        disabled={isSending}
      />
    </div>
  );
};
