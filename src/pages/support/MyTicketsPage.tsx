/**
 * MyTicketsPage - Page des demandes de support de l'utilisateur
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  subscribeToUserTickets,
  hasUnreadResponsesForUser,
} from '@/features/support/services/supportService';
import type { SupportRequest } from '@/features/support/types/support.types';
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  REQUEST_TYPE_COLORS,
} from '@/features/support/types/support.types';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { SupportDialog } from '@/shared/components/support';
import {
  Ticket,
  Plus,
  Clock,
  ArrowRight,
  Bug,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  Inbox,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_ICONS = {
  bug: Bug,
  question: HelpCircle,
  feature: Lightbulb,
  urgent: AlertTriangle,
  other: MessageSquare,
};

export const MyTicketsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToUserTickets(user.id, newTickets => {
      setTickets(newTickets);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-indigo-600" />
            Mes demandes
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Suivez vos demandes de support et les réponses de notre équipe
          </p>
        </div>
        <SupportDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Button>
        </SupportDialog>
      </div>

      {/* Liste des tickets */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Aucune demande</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Vous n'avez pas encore envoyé de demande de support.
            </p>
            <SupportDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Créer une demande
              </Button>
            </SupportDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => {
            const Icon = TYPE_ICONS[ticket.type];
            return (
              <Card
                key={ticket.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/app/support/${ticket.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative">
                        <div
                          className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${REQUEST_TYPE_COLORS[ticket.type]}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {/* Indicateur de nouvelle réponse */}
                        {hasUnreadResponsesForUser(ticket) && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          {hasUnreadResponsesForUser(ticket) && (
                            <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              Nouvelle réponse
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {REQUEST_TYPE_LABELS[ticket.type]}
                          </Badge>
                          <Badge className={`text-xs ${REQUEST_STATUS_COLORS[ticket.status]}`}>
                            {REQUEST_STATUS_LABELS[ticket.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {ticket.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(ticket.createdAt.toDate(), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                          {ticket.responseCount && ticket.responseCount > 0 && (
                            <>
                              <span>•</span>
                              <MessageSquare className="h-3 w-3" />
                              <span>{ticket.responseCount} réponse{ticket.responseCount > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
