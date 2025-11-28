/**
 * TicketDetailPage - Détail d'un ticket avec conversation
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getTicketById,
  subscribeToTicketResponses,
  addTicketResponse,
  markTicketAsReadByUser,
} from '@/features/support/services/supportService';
import type { SupportRequest, SupportResponse } from '@/features/support/types/support.types';
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  REQUEST_TYPE_COLORS,
} from '@/features/support/types/support.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import {
  ArrowLeft,
  Send,
  Loader2,
  Bug,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  User,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const TYPE_ICONS = {
  bug: Bug,
  question: HelpCircle,
  feature: Lightbulb,
  urgent: AlertTriangle,
  other: MessageSquare,
};

export const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<SupportRequest | null>(null);
  const [responses, setResponses] = useState<SupportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadTicket = async () => {
      const ticketData = await getTicketById(id);
      if (!ticketData) {
        toast.error('Ticket non trouvé');
        navigate('/app/support');
        return;
      }
      setTicket(ticketData);
      setIsLoading(false);

      // Marquer le ticket comme lu par l'utilisateur
      try {
        await markTicketAsReadByUser(id);
      } catch (error) {
        console.error('Erreur marquage lecture:', error);
      }
    };

    loadTicket();

    // Écouter les réponses en temps réel
    const unsubscribe = subscribeToTicketResponses(id, setResponses);

    return () => unsubscribe();
  }, [id, navigate]);

  useEffect(() => {
    // Scroll vers le bas quand de nouveaux messages arrivent
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responses]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket || !user) return;

    setIsSending(true);
    try {
      await addTicketResponse(ticket.id, {
        requestId: ticket.id,
        message: newMessage.trim(),
        authorId: user.id,
        authorName: user.displayName || 'Utilisateur',
        authorEmail: user.email || '',
        isAdmin: false,
      });
      setNewMessage('');
      toast.success('Message envoyé');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!ticket) return null;

  const Icon = TYPE_ICONS[ticket.type];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/support')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <Badge variant="secondary" className="text-xs">
              {REQUEST_TYPE_LABELS[ticket.type]}
            </Badge>
            <Badge className={`text-xs ${REQUEST_STATUS_COLORS[ticket.status]}`}>
              {REQUEST_STATUS_LABELS[ticket.status]}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Créé le {format(ticket.createdAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
      </div>

      {/* Message original */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${REQUEST_TYPE_COLORS[ticket.type]}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Message original</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {ticket.userName} • {ticket.userEmail}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.message}</p>
        </CardContent>
      </Card>

      {/* Conversation */}
      <div className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation ({responses.length})
        </h2>

        {responses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              Aucune réponse pour le moment. Notre équipe vous répondra bientôt.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {responses.map(response => (
              <Card
                key={response.id}
                className={response.isAdmin ? 'border-indigo-200 dark:border-indigo-800' : ''}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={
                          response.isAdmin
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                            : ''
                        }
                      >
                        {response.isAdmin ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{response.authorName}</span>
                        {response.isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            Support
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {format(response.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                        {response.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulaire de réponse */}
      {ticket.status !== 'closed' && (
        <Card>
          <CardContent className="py-4">
            <Textarea
              placeholder="Écrivez votre message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <div className="flex justify-end">
              <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ticket.status === 'closed' && (
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <CardContent className="py-4 text-center text-gray-500 dark:text-gray-400">
            Ce ticket est fermé. Vous ne pouvez plus y répondre.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TicketDetailPage;
