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
import {
  ConversationList,
  ChatWindow,
  MessageInput,
  NewConversationDialog,
} from '@/features/messaging/components';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
  createConversation,
  getOrCreateDirectConversation,
  markMessagesAsRead,
} from '@/features/messaging/services/messageService';
import type {
  Conversation,
  Message,
  SendMessageData,
  CreateConversationData,
} from '@/features/messaging/types/message.types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const MessagingPage = () => {
  const { user } = useAuth();
  const { currentEstablishment } = useCurrentEstablishment();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Conversation sélectionnée
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  // ============================================================================
  // EFFECTS - Subscriptions temps réel
  // ============================================================================

  // Écouter les conversations
  useEffect(() => {
    if (!currentEstablishment?.id || !user?.uid) return;

    setIsLoading(true);

    const unsubscribe = subscribeToConversations(
      currentEstablishment.id,
      user.uid,
      (convs) => {
        setConversations(convs);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentEstablishment?.id, user?.uid]);

  // Écouter les messages de la conversation sélectionnée
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(selectedConversationId, (msgs) => {
      setMessages(msgs);

      // Marquer les messages non lus comme lus
      if (user?.uid) {
        const unreadMessages = msgs.filter(
          (msg) => msg.senderId !== user.uid && !msg.readBy.includes(user.uid)
        );

        if (unreadMessages.length > 0) {
          markMessagesAsRead(
            unreadMessages.map((m) => m.id),
            user.uid
          );
          markConversationAsRead(selectedConversationId, user.uid);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedConversationId, user?.uid]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleSendMessage = async (data: SendMessageData) => {
    if (!selectedConversationId || !user?.uid) return;

    setIsSendingMessage(true);

    try {
      await sendMessage(
        selectedConversationId,
        user.uid,
        user.displayName || user.email || 'Utilisateur',
        data
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCreateConversation = async (data: CreateConversationData) => {
    if (!currentEstablishment?.id || !user?.uid) return;

    try {
      let conversationId: string;

      // Si c'est une conversation directe avec un seul participant
      if (data.type === 'direct' && data.participantIds.length === 1) {
        conversationId = await getOrCreateDirectConversation(
          currentEstablishment.id,
          user.uid,
          data.participantIds[0]
        );
      } else {
        conversationId = await createConversation(currentEstablishment.id, user.uid, data);
      }

      setSelectedConversationId(conversationId);
      setIsNewConversationOpen(false);
      toast.success('Conversation créée avec succès');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!user || !currentEstablishment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 border-r bg-white dark:bg-gray-950 flex flex-col">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId || undefined}
          onSelect={handleSelectConversation}
          onNewConversation={() => setIsNewConversationOpen(true)}
          currentUserId={user.uid}
          isLoading={isLoading}
        />
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
        {selectedConversation ? (
          <>
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              currentUserId={user.uid}
              onSendMessage={handleSendMessage}
              onLoadMore={() => {
                // TODO: Implémenter le chargement de plus de messages
              }}
              hasMore={false}
            />
            <MessageInput
              onSend={handleSendMessage}
              conversationId={selectedConversationId!}
              currentUserId={user.uid}
              disabled={isSendingMessage}
            />
          </>
        ) : (
          // État vide - Aucune conversation sélectionnée
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-4 text-6xl">💬</div>
              <h2 className="text-2xl font-bold mb-2">Messagerie GestiHôtel</h2>
              <p className="text-muted-foreground mb-6">
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
        users={[]} // TODO: Charger les utilisateurs de l'établissement
        currentUserId={user.uid}
      />
    </div>
  );
};
