/**
 * AdminTicketsPage - Interface admin pour gérer les tickets
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToAllTickets,
  updateTicketStatus,
  hasUnreadResponsesForAdmin,
} from '@/features/support/services/supportService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  SupportRequest,
  SupportRequestStatus,
  SupportRequestDestination,
} from '@/features/support/types/support.types';
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  REQUEST_TYPE_COLORS,
  REQUEST_DESTINATION_COLORS,
} from '@/features/support/types/support.types';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Ticket,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Bug,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  Inbox,
  Filter,
  Building2,
  Code2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const TYPE_ICONS = {
  bug: Bug,
  question: HelpCircle,
  feature: Lightbulb,
  urgent: AlertTriangle,
  other: MessageSquare,
};

export const AdminTicketsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditor = user?.role === 'editor';

  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportRequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<SupportRequestDestination | 'all'>(
    isEditor ? 'all' : 'internal'
  );

  useEffect(() => {
    const unsubscribe = subscribeToAllTickets(newTickets => {
      // Filtrer côté client selon le rôle
      // Super_admin ne voit que les tickets internes, editor voit tout
      const filteredByRole = isEditor
        ? newTickets
        : newTickets.filter(t => t.destination === 'internal');
      setTickets(filteredByRole);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isEditor]);

  const handleStatusChange = async (ticketId: string, newStatus: SupportRequestStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast.success('Statut mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Filtrage
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesType = typeFilter === 'all' || ticket.type === typeFilter;
    const matchesDestination =
      destinationFilter === 'all' || ticket.destination === destinationFilter;
    return matchesSearch && matchesStatus && matchesType && matchesDestination;
  });

  // Stats
  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="h-6 w-6 text-indigo-600" />
          Gestion des tickets
          {isEditor && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Mode Éditeur
            </Badge>
          )}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isEditor
            ? 'Gérez toutes les demandes de support (internes et externes)'
            : 'Gérez les demandes de support internes de votre établissement'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Nouveaux</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
              </div>
              <Inbox className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">En cours</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.inProgress}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Résolus</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.resolved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par sujet, email, nom..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {isEditor && (
              <Select
                value={destinationFilter}
                onValueChange={v => setDestinationFilter(v as SupportRequestDestination | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes destinations</SelectItem>
                  <SelectItem value="internal">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      Interne
                    </div>
                  </SelectItem>
                  <SelectItem value="external">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-indigo-500" />
                      Externe
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as SupportRequestStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouveaux</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolus</SelectItem>
                <SelectItem value="closed">Fermés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="feature">Suggestion</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des tickets */}
      <Card>
        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Aucun ticket trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isEditor && <TableHead>Destination</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Établissement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => {
                  const Icon = TYPE_ICONS[ticket.type];
                  return (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => navigate(`/app/admin/support/${ticket.id}`)}
                    >
                      {isEditor && (
                        <TableCell>
                          <Badge
                            className={`text-xs ${REQUEST_DESTINATION_COLORS[ticket.destination || 'internal']}`}
                          >
                            {ticket.destination === 'external' ? (
                              <Code2 className="h-3 w-3 mr-1" />
                            ) : (
                              <Building2 className="h-3 w-3 mr-1" />
                            )}
                            {ticket.destination === 'external' ? 'Externe' : 'Interne'}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className={`flex items-center gap-2 ${REQUEST_TYPE_COLORS[ticket.type]}`}>
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{REQUEST_TYPE_LABELS[ticket.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{ticket.subject}</p>
                            {user?.id && hasUnreadResponsesForAdmin(ticket, user.id) && (
                              <Badge className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-1.5 py-0">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{ticket.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{ticket.userName}</p>
                          <p className="text-xs text-gray-500">{ticket.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {ticket.establishmentName || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${REQUEST_STATUS_COLORS[ticket.status]}`}>
                          {REQUEST_STATUS_LABELS[ticket.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(ticket.createdAt.toDate(), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </div>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/app/admin/support/${ticket.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Marquer en cours
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(ticket.id, 'resolved')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marquer résolu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(ticket.id, 'closed')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Fermer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTicketsPage;
