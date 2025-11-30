/**
 * AdminTicketDetailPage - Détail d'un ticket pour l'admin
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getTicketById,
  subscribeToTicketResponses,
  addTicketResponse,
  updateTicketStatus,
  markTicketAsReadByAdmin,
} from '@/features/support/services/supportService';
import type {
  SupportRequest,
  SupportResponse,
  SupportRequestStatus,
} from '@/features/support/types/support.types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  Bug,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  User,
  Shield,
  Mail,
  Building,
  Globe,
  Monitor,
  CheckCircle,
  XCircle,
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

export const AdminTicketDetailPage = () => {
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
        navigate('/app/admin/support');
        return;
      }
      setTicket(ticketData);
      setIsLoading(false);

      // Marquer le ticket comme lu par l'admin
      try {
        await markTicketAsReadByAdmin(id);
      } catch (error) {
        console.error('Erreur marquage lecture:', error);
      }
    };

    loadTicket();

    const unsubscribe = subscribeToTicketResponses(id, setResponses);
    return () => unsubscribe();
  }, [id, navigate]);

  useEffect(() => {
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
        authorName: user.displayName || 'Support',
        authorEmail: user.email || '',
        isAdmin: true,
      });
      setNewMessage('');
      toast.success('Réponse envoyée');
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: SupportRequestStatus) => {
    if (!ticket) return;
    try {
      await updateTicketStatus(ticket.id, newStatus);
      setTicket({ ...ticket, status: newStatus });
      toast.success('Statut mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const Icon = TYPE_ICONS[ticket.type];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/admin/support')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <Badge variant="secondary">{REQUEST_TYPE_LABELS[ticket.type]}</Badge>
          </div>
          <p className="text-sm text-gray-500">Ticket #{ticket.id.slice(0, 8)}</p>
        </div>
        <Select
          value={ticket.status}
          onValueChange={v => handleStatusChange(v as SupportRequestStatus)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message original */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ticket.userName}</span>
                    <span className="text-sm text-gray-500">{ticket.userEmail}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(ticket.createdAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
                <Badge className={REQUEST_STATUS_COLORS[ticket.status]}>
                  {REQUEST_STATUS_LABELS[ticket.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.message}
              </p>
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
                <CardContent className="py-8 text-center text-gray-500">
                  Aucune réponse. Répondez à ce ticket ci-dessous.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {responses.map(response => (
                  <Card
                    key={response.id}
                    className={
                      response.isAdmin
                        ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10'
                        : ''
                    }
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
                              {format(response.createdAt.toDate(), 'dd/MM/yyyy HH:mm', {
                                locale: fr,
                              })}
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
            <Card className="border-indigo-200 dark:border-indigo-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  Répondre en tant que support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Écrivez votre réponse..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={4}
                  className="mb-3"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    L'utilisateur recevra un email de notification
                  </p>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Infos utilisateur */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations utilisateur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{ticket.userName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${ticket.userEmail}`} className="text-indigo-600 hover:underline">
                  {ticket.userEmail}
                </a>
              </div>
              {ticket.establishmentName && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{ticket.establishmentName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails ticket */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Détails du ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Type</span>
                <div className={`flex items-center gap-1 ${REQUEST_TYPE_COLORS[ticket.type]}`}>
                  <Icon className="h-4 w-4" />
                  <span>{REQUEST_TYPE_LABELS[ticket.type]}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Statut</span>
                <Badge className={REQUEST_STATUS_COLORS[ticket.status]}>
                  {REQUEST_STATUS_LABELS[ticket.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Créé le</span>
                <span>{format(ticket.createdAt.toDate(), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
              {ticket.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Mis à jour</span>
                  <span>{format(ticket.updatedAt.toDate(), 'dd/MM/yyyy', { locale: fr })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Infos techniques */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {ticket.url && (
                <div>
                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <Globe className="h-3 w-3" />
                    <span>Page</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 break-all">{ticket.url}</p>
                </div>
              )}
              {ticket.userAgent && (
                <div>
                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <Monitor className="h-3 w-3" />
                    <span>Navigateur</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 break-all line-clamp-2">
                    {ticket.userAgent}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleStatusChange('in_progress')}
                disabled={ticket.status === 'in_progress'}
              >
                <Clock className="mr-2 h-4 w-4" />
                Marquer en cours
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-green-600"
                onClick={() => handleStatusChange('resolved')}
                disabled={ticket.status === 'resolved'}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marquer résolu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-500"
                onClick={() => handleStatusChange('closed')}
                disabled={ticket.status === 'closed'}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Fermer le ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminTicketDetailPage;
