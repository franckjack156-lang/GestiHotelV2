/**
 * ============================================================================
 * MESSAGING EXAMPLE
 * ============================================================================
 *
 * Exemple d'utilisation complète des composants de messagerie
 * Pour référence et tests
 */

import React, { useState } from 'react';
import { ConversationList, ChatWindow, NewConversationDialog } from './index';
import { logger } from '@/core/utils/logger';
import type {
  Conversation,
  Message,
  SendMessageData,
  CreateConversationData,
} from '../types/message.types';

// ============================================================================
// MOCK DATA
// ============================================================================

const CURRENT_USER_ID = 'user-1';

const MOCK_USERS = [
  {
    id: 'user-2',
    name: 'Marie Dupont',
    email: 'marie.dupont@gestihotel.fr',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'Réceptionniste',
  },
  {
    id: 'user-3',
    name: 'Jean Martin',
    email: 'jean.martin@gestihotel.fr',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'Technicien',
  },
  {
    id: 'user-4',
    name: 'Sophie Bernard',
    email: 'sophie.bernard@gestihotel.fr',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'Manager',
  },
  {
    id: 'user-5',
    name: 'Pierre Dubois',
    email: 'pierre.dubois@gestihotel.fr',
    avatar: 'https://i.pravatar.cc/150?img=4',
    role: 'Technicien',
  },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    type: 'direct',
    participantIds: ['user-1', 'user-2'],
    participants: [
      {
        userId: 'user-1',
        name: 'Vous',
        email: 'vous@gestihotel.fr',
        joinedAt: new Date('2025-01-01'),
      },
      {
        userId: 'user-2',
        name: 'Marie Dupont',
        email: 'marie.dupont@gestihotel.fr',
        avatar: 'https://i.pravatar.cc/150?img=1',
        isOnline: true,
        joinedAt: new Date('2025-01-01'),
      },
    ],
    lastMessage: {
      content: "D'accord, je m'en occupe tout de suite !",
      senderId: 'user-2',
      senderName: 'Marie Dupont',
      createdAt: new Date('2025-01-14T10:30:00'),
    },
    unreadCount: { 'user-1': 2, 'user-2': 0 },
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-14T10:30:00'),
    createdBy: 'user-1',
    establishmentId: 'hotel-1',
    pinnedBy: ['user-1'],
  },
  {
    id: 'conv-2',
    type: 'group',
    name: 'Équipe Technique',
    participantIds: ['user-1', 'user-3', 'user-5'],
    participants: [
      {
        userId: 'user-1',
        name: 'Vous',
        email: 'vous@gestihotel.fr',
        joinedAt: new Date('2025-01-01'),
      },
      {
        userId: 'user-3',
        name: 'Jean Martin',
        email: 'jean.martin@gestihotel.fr',
        avatar: 'https://i.pravatar.cc/150?img=2',
        joinedAt: new Date('2025-01-01'),
      },
      {
        userId: 'user-5',
        name: 'Pierre Dubois',
        email: 'pierre.dubois@gestihotel.fr',
        avatar: 'https://i.pravatar.cc/150?img=4',
        isOnline: true,
        joinedAt: new Date('2025-01-01'),
      },
    ],
    lastMessage: {
      content: 'La réparation est terminée',
      senderId: 'user-3',
      senderName: 'Jean Martin',
      createdAt: new Date('2025-01-14T09:15:00'),
    },
    unreadCount: { 'user-1': 0, 'user-3': 1, 'user-5': 1 },
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-14T09:15:00'),
    createdBy: 'user-1',
    establishmentId: 'hotel-1',
  },
  {
    id: 'conv-3',
    type: 'intervention',
    name: 'Intervention #123',
    interventionId: 'int-123',
    interventionTitle: "Fuite d'eau chambre 205",
    participantIds: ['user-1', 'user-3'],
    participants: [
      {
        userId: 'user-1',
        name: 'Vous',
        email: 'vous@gestihotel.fr',
        joinedAt: new Date('2025-01-12'),
      },
      {
        userId: 'user-3',
        name: 'Jean Martin',
        email: 'jean.martin@gestihotel.fr',
        avatar: 'https://i.pravatar.cc/150?img=2',
        joinedAt: new Date('2025-01-12'),
      },
    ],
    lastMessage: {
      content: "J'arrive dans 10 minutes",
      senderId: 'user-3',
      senderName: 'Jean Martin',
      createdAt: new Date('2025-01-14T08:45:00'),
    },
    unreadCount: { 'user-1': 1, 'user-3': 0 },
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-14T08:45:00'),
    createdBy: 'user-1',
    establishmentId: 'hotel-1',
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      type: 'text',
      content: 'Bonjour Marie ! Peux-tu vérifier la réservation de M. Durant ?',
      senderId: 'user-1',
      senderName: 'Vous',
      readBy: ['user-1', 'user-2'],
      createdAt: new Date('2025-01-14T10:00:00'),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      type: 'text',
      content: 'Bonjour ! Oui bien sûr, je regarde ça.',
      senderId: 'user-2',
      senderName: 'Marie Dupont',
      senderAvatar: 'https://i.pravatar.cc/150?img=1',
      readBy: ['user-1', 'user-2'],
      createdAt: new Date('2025-01-14T10:02:00'),
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      type: 'text',
      content: "Parfait, merci ! C'est urgent car il arrive dans 30 minutes.",
      senderId: 'user-1',
      senderName: 'Vous',
      readBy: ['user-1', 'user-2'],
      createdAt: new Date('2025-01-14T10:03:00'),
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      type: 'text',
      content: "D'accord, je m'en occupe tout de suite !",
      senderId: 'user-2',
      senderName: 'Marie Dupont',
      senderAvatar: 'https://i.pravatar.cc/150?img=1',
      readBy: ['user-2'],
      createdAt: new Date('2025-01-14T10:30:00'),
      reactions: [
        {
          emoji: '👍',
          userId: 'user-1',
          userName: 'Vous',
          createdAt: new Date('2025-01-14T10:31:00'),
        },
      ],
    },
  ],
  'conv-2': [
    {
      id: 'msg-5',
      conversationId: 'conv-2',
      type: 'system',
      content: 'Jean Martin a rejoint le groupe',
      senderId: 'system',
      senderName: 'Système',
      readBy: [],
      createdAt: new Date('2025-01-14T08:00:00'),
    },
    {
      id: 'msg-6',
      conversationId: 'conv-2',
      type: 'text',
      content:
        "Bonjour à tous ! Quelqu'un peut s'occuper de la climatisation en salle de conférence ?",
      senderId: 'user-1',
      senderName: 'Vous',
      readBy: ['user-1', 'user-3', 'user-5'],
      createdAt: new Date('2025-01-14T09:00:00'),
    },
    {
      id: 'msg-7',
      conversationId: 'conv-2',
      type: 'text',
      content: "@Jean je m'en charge !",
      senderId: 'user-3',
      senderName: 'Jean Martin',
      senderAvatar: 'https://i.pravatar.cc/150?img=2',
      mentions: ['user-1'],
      readBy: ['user-1', 'user-3'],
      createdAt: new Date('2025-01-14T09:10:00'),
    },
    {
      id: 'msg-8',
      conversationId: 'conv-2',
      type: 'text',
      content: 'La réparation est terminée',
      senderId: 'user-3',
      senderName: 'Jean Martin',
      senderAvatar: 'https://i.pravatar.cc/150?img=2',
      readBy: ['user-3'],
      createdAt: new Date('2025-01-14T09:15:00'),
      replyTo: {
        messageId: 'msg-6',
        content:
          "Bonjour à tous ! Quelqu'un peut s'occuper de la climatisation en salle de conférence ?",
        senderName: 'Vous',
      },
    },
  ],
};

// ============================================================================
// EXAMPLE COMPONENT
// ============================================================================

export const MessagingExample: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-1');
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [typingIndicators] = useState<Record<string, { userId: string; userName: string }[]>>({
    'conv-1': [{ userId: 'user-2', userName: 'Marie Dupont' }],
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const currentMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSendMessage = async (data: SendMessageData) => {
    if (!selectedConversationId) return;

    logger.debug('Sending message:', data);

    // Simuler l'envoi
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversationId,
      type: data.type || 'text',
      content: data.content,
      senderId: CURRENT_USER_ID,
      senderName: 'Vous',
      readBy: [CURRENT_USER_ID],
      createdAt: new Date(),
      mentions: data.mentions,
      replyTo: data.replyTo,
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage],
    }));

    // Mettre à jour le dernier message de la conversation
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversationId
          ? {
              ...conv,
              lastMessage: {
                content: data.content,
                senderId: CURRENT_USER_ID,
                senderName: 'Vous',
                createdAt: new Date(),
              },
              updatedAt: new Date(),
            }
          : conv
      )
    );
  };

  const handleCreateConversation = async (data: CreateConversationData) => {
    logger.debug('Creating conversation:', data);

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      type: data.type,
      name: data.name,
      description: data.description,
      participantIds: [CURRENT_USER_ID, ...data.participantIds],
      participants: [
        {
          userId: CURRENT_USER_ID,
          name: 'Vous',
          email: 'vous@gestihotel.fr',
          joinedAt: new Date(),
        },
        ...data.participantIds.map(id => {
          const user = MOCK_USERS.find(u => u.id === id);
          return {
            userId: id,
            name: user?.name || 'Utilisateur',
            email: user?.email || 'email@example.com',
            avatar: user?.avatar,
            joinedAt: new Date(),
          };
        }),
      ],
      unreadCount: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: CURRENT_USER_ID,
      establishmentId: 'hotel-1',
    };

    setConversations(prev => [newConversation, ...prev]);
    setMessages(prev => ({ ...prev, [newConversation.id]: [] }));
    setSelectedConversationId(newConversation.id);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    logger.debug('Adding reaction:', messageId, emoji);
    // Implémenter la logique de réaction
  };

  const handleLoadMore = () => {
    logger.debug('Loading more messages...');
    // Implémenter le chargement de plus de messages
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 border-r">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          onNewConversation={() => setShowNewDialog(true)}
          currentUserId={CURRENT_USER_ID}
          typingIndicators={typingIndicators}
        />
      </div>

      {/* Main - Chat window */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={currentMessages}
            currentUserId={CURRENT_USER_ID}
            onSendMessage={handleSendMessage}
            onLoadMore={handleLoadMore}
            hasMore={false}
            typingUsers={typingIndicators[selectedConversationId]}
            onReaction={handleReaction}
            onPinConversation={() => logger.debug('Pin conversation')}
            onArchiveConversation={() => logger.debug('Archive conversation')}
            onShowInfo={() => logger.debug('Show info')}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">
                Sélectionnez une conversation
              </h2>
              <p className="text-muted-foreground">
                Choisissez une conversation dans la liste ou créez-en une nouvelle
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog nouvelle conversation */}
      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreateConversation={handleCreateConversation}
        currentUserId="current-user"
        users={MOCK_USERS}
      />
    </div>
  );
};

export default MessagingExample;
