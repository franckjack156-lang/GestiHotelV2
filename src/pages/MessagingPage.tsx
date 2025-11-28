/**
 * ============================================================================
 * MESSAGING PAGE
 * ============================================================================
 *
 * Page principale de la messagerie interne
 * Layout avec sidebar conversations + fenêtre de chat
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useEstablishmentUsers } from '@/features/messaging/hooks/useEstablishmentUsers';
import { useFeature } from '@/features/establishments/hooks/useFeature';
import { usePresence } from '@/features/messaging/hooks/usePresence';
import {
  ConversationList,
  ChatWindow,
  NewConversationDialog,
} from '@/features/messaging/components';
import { toDate } from '@/shared/utils/dateUtils';
import {
  subscribeToConversations,
  subscribeToMessages,
  loadMoreMessages,
  sendMessage,
  markConversationAsRead,
  createConversation,
  getOrCreateDirectConversation,
  markMessagesAsRead,
  deleteConversationForUser,
  addReaction,
  removeReaction,
  setTypingIndicator,
} from '@/features/messaging/services/messageService';
import type {
  Conversation,
  Message,
  SendMessageData,
  CreateConversationData,
} from '@/features/messaging/types/message.types';
import { toast } from 'sonner';
import { Loader2, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const MessagingPage = () => {
  const { user, firebaseUser } = useAuth();
  const { currentEstablishment } = useCurrentEstablishment();
  const { users: establishmentUsers } = useEstablishmentUsers(currentEstablishment?.id);
  const { hasFeature } = useFeature();

  // User ID (peut venir de user.id ou firebaseUser.uid)
  const userId = user?.id || firebaseUser?.uid;

  // Initialiser la présence en temps réel
  // TODO: isUserOnline unused
  // const { isUserOnline } = usePresence(currentEstablishment?.id, userId);
  usePresence(currentEstablishment?.id, userId);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Conversation sélectionnée
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // ============================================================================
  // EFFECTS - Subscriptions temps réel
  // ============================================================================

  // Écouter les conversations
  useEffect(() => {
    if (!currentEstablishment?.id || !userId) return;

    setIsLoading(true);

    const unsubscribe = subscribeToConversations(currentEstablishment.id, userId, convs => {
      setConversations(convs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentEstablishment?.id, userId]);

  // Écouter les messages de la conversation sélectionnée
  useEffect(() => {
    if (!selectedConversationId || !userId) {
      setMessages([]);
      return;
    }

    // Récupérer le timestamp de suppression pour filtrer les anciens messages
    const deletionTimestamp = selectedConversation?.deletedBy?.[userId];

    const unsubscribe = subscribeToMessages(
      selectedConversationId,
      (msgs: Message[]) => {
        setMessages(msgs);
        // Vérifier s'il y a potentiellement plus de messages (si on a exactement 50 messages)
        setHasMoreMessages(msgs.length >= 50);

        // Marquer les messages non lus comme lus
        const unreadMessages = msgs.filter(
          (msg: Message) => msg.senderId !== userId && !msg.readBy.includes(userId)
        );

        if (unreadMessages.length > 0) {
          markMessagesAsRead(
            unreadMessages.map((m: Message) => m.id),
            userId
          );
          markConversationAsRead(selectedConversationId, userId);
        }
      },
      50,
      deletionTimestamp
    );

    return () => unsubscribe();
  }, [selectedConversationId, userId, selectedConversation?.deletedBy]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleSendMessage = async (data: SendMessageData) => {
    if (!selectedConversationId || !userId) return;

    setIsSendingMessage(true);

    try {
      await sendMessage(
        selectedConversationId,
        userId,
        user?.displayName || user?.email || 'Utilisateur',
        data
      );
    } catch {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCreateConversation = async (data: CreateConversationData) => {
    if (!currentEstablishment?.id || !userId) {
      return;
    }

    try {
      let conversationId: string;

      // Si c'est une conversation directe avec un seul participant
      if (data.type === 'direct' && data.participantIds.length === 1) {
        conversationId = await getOrCreateDirectConversation(
          currentEstablishment.id,
          userId,
          data.participantIds[0]
        );
      } else {
        conversationId = await createConversation(currentEstablishment.id, userId, data);
      }

      setSelectedConversationId(conversationId);
      setIsNewConversationOpen(false);
      toast.success('Conversation créée avec succès');
    } catch (error) {
      toast.error(
        `Erreur lors de la création de la conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversationId || !userId) return;

    try {
      await deleteConversationForUser(selectedConversationId, userId);
      setSelectedConversationId(null);
      toast.success('Conversation supprimée');
    } catch {
      toast.error('Erreur lors de la suppression de la conversation');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!userId) return;

    try {
      await addReaction(
        messageId,
        userId,
        user?.displayName || user?.email || 'Utilisateur',
        emoji
      );
    } catch {
      toast.error("Erreur lors de l'ajout de la réaction");
    }
  };

  const handleRemoveReaction = async (messageId: string) => {
    if (!userId) return;

    try {
      await removeReaction(messageId, userId);
    } catch {
      toast.error('Erreur lors de la suppression de la réaction');
    }
  };

  const handleLoadMore = async () => {
    if (!selectedConversationId || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);

    try {
      // Obtenir le timestamp du message le plus ancien
      const oldestMessage = messages[0];
      if (!oldestMessage) return;

      const oldestTimestamp =
        oldestMessage.clientCreatedAt ||
        (oldestMessage.createdAt ? toDate(oldestMessage.createdAt).getTime() : Date.now());

      const { messages: olderMessages, hasMore } = await loadMoreMessages(
        selectedConversationId,
        50,
        oldestTimestamp
      );

      // Ajouter les anciens messages au début
      setMessages(prev => [...olderMessages, ...prev]);
      setHasMoreMessages(hasMore);
    } catch {
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTypingStart = () => {
    if (!selectedConversationId || !userId) return;

    setTypingIndicator(
      selectedConversationId,
      userId,
      user?.displayName || user?.email || 'Utilisateur',
      true
    ).catch(() => {});
  };

  const handleTypingStop = () => {
    if (!selectedConversationId || !userId) return;

    setTypingIndicator(
      selectedConversationId,
      userId,
      user?.displayName || user?.email || 'Utilisateur',
      false
    ).catch(() => {});
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Vérifier si la fonctionnalité de messagerie est activée
  if (!hasFeature('internalChat')) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 flex justify-center">
            <Lock className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Messagerie Désactivée</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            La fonctionnalité de messagerie interne n'est pas activée pour cet établissement.
            Contactez un administrateur pour l'activer.
          </p>
        </div>
      </div>
    );
  }

  if (!userId || !currentEstablishment) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Liste des conversations - Cachée sur mobile si conversation sélectionnée */}
      <div
        className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r bg-white dark:bg-gray-950 flex-col`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId || undefined}
          onSelect={handleSelectConversation}
          onNewConversation={() => setIsNewConversationOpen(true)}
          currentUserId={userId}
          isLoading={isLoading}
        />
      </div>

      {/* Zone de chat principale - Cachée sur mobile si pas de conversation sélectionnée */}
      <div
        className={`${selectedConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-gray-950`}
      >
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            {/* Bouton retour mobile */}
            <div className="md:hidden border-b px-3 py-2 bg-white dark:bg-gray-950 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversationId(null)}
                className="gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Conversations
              </Button>
            </div>
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              currentUserId={userId}
              onSendMessage={handleSendMessage}
              onLoadMore={handleLoadMore}
              hasMore={hasMoreMessages}
              isLoading={isLoadingMore}
              isSending={isSendingMessage}
              onReaction={handleReaction}
              onRemoveReaction={handleRemoveReaction}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>
        ) : (
          // État vide - Aucune conversation sélectionnée
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="mb-4 flex justify-center">
                <MessageCircle className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Messagerie GestiHôtel</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Sélectionnez une conversation ou démarrez-en une nouvelle pour commencer à discuter
                avec votre équipe.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de nouvelle conversation */}
      <NewConversationDialog
        open={isNewConversationOpen}
        onOpenChange={setIsNewConversationOpen}
        onCreateConversation={handleCreateConversation}
        users={establishmentUsers}
        currentUserId={userId}
      />
    </div>
  );
};
