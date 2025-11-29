/**
 * Onglet Historique - Log complet des modifications
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  History,
  Edit,
  UserPlus,
  Clock,
  CheckCircle,
  FileText,
  Image,
  Package,
  ArrowRight,
  Loader2,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '../../types/intervention.types';
import type { HistoryEventType } from '../../types/subcollections.types';
import { cn } from '@/shared/lib/utils';
import { useHistory } from '../../hooks/useHistory';

interface HistoryTabProps {
  intervention: Intervention;
}

const EVENT_CONFIG: Record<
  HistoryEventType,
  { icon: LucideIcon; color: string; bgColor: string; label: string }
> = {
  created: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Création',
  },
  status_change: {
    icon: ArrowRight,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Statut',
  },
  assigned: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Assignation',
  },
  updated: {
    icon: Edit,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Modification',
  },
  comment_added: {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Commentaire',
  },
  photo_added: {
    icon: Image,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    label: 'Photo',
  },
  part_added: {
    icon: Package,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pièce',
  },
  part_status_changed: {
    icon: Package,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Pièce',
  },
  time_added: {
    icon: Clock,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    label: 'Temps',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Complété',
  },
  validated: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Validé',
  },
  email_sent: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Email',
  },
};

/**
 * Convertir les rôles techniques en labels lisibles
 */
const formatUserRole = (role: string | undefined): string => {
  if (!role) return '';

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrateur',
    manager: 'Responsable',
    technician: 'Technicien',
    viewer: 'Lecteur',
  };

  return roleLabels[role] || role;
};

export const HistoryTab = ({ intervention }: HistoryTabProps) => {
  const { events: history, isLoading } = useHistory(intervention.id);

  const getEventIcon = (type: HistoryEventType) => {
    return EVENT_CONFIG[type]?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total événements</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
              <History className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Changements statut</p>
                <p className="text-2xl font-bold">
                  {history.filter(e => e.type === 'status_change').length}
                </p>
              </div>
              <ArrowRight className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Photos ajoutées</p>
                <p className="text-2xl font-bold">
                  {history.filter(e => e.type === 'photo_added').length}
                </p>
              </div>
              <Image className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pièces ajoutées</p>
                <p className="text-2xl font-bold">
                  {history.filter(e => e.type === 'part_added').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Chronologie complète
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Chargement de l'historique...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucun historique</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((event, index) => {
                const config = EVENT_CONFIG[event.type];
                const Icon = getEventIcon(event.type);

                return (
                  <div key={event.id} className="relative">
                    {/* Ligne verticale */}
                    {index < history.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    )}

                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="relative z-10 flex-shrink-0">
                        <div
                          className={cn(
                            'h-12 w-12 rounded-full flex items-center justify-center',
                            config.bgColor
                          )}
                        >
                          <Icon className={cn('h-5 w-5', config.color)} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            {event.createdAt && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {format(event.createdAt.toDate(), 'dd MMM yyyy à HH:mm', {
                                  locale: fr,
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {event.description}
                          </p>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">par</span>
                            <span className="font-medium">{event.userName}</span>
                            {event.userRole && (
                              <Badge variant="outline" className="text-xs">
                                {formatUserRole(event.userRole)}
                              </Badge>
                            )}
                          </div>

                          {/* Changement de valeur */}
                          {event.oldValue && event.newValue && (
                            <div className="flex items-center gap-2 text-sm mt-2">
                              <Badge variant="outline" className="bg-red-50 dark:bg-red-950">
                                {event.oldValue}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                                {event.newValue}
                              </Badge>
                            </div>
                          )}

                          {/* Nouvelle valeur uniquement */}
                          {!event.oldValue && event.newValue && (
                            <div className="text-sm mt-2">
                              <Badge variant="outline">{event.newValue}</Badge>
                            </div>
                          )}

                          {/* Détails supplémentaires */}
                          {event.details && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-2">
                              {event.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations système</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Créée le</span>
            <span>
              {intervention.createdAt &&
                format(intervention.createdAt.toDate(), 'PPP à HH:mm', { locale: fr })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Dernière modification</span>
            <span>
              {intervention.updatedAt
                ? format(intervention.updatedAt.toDate(), 'PPP à HH:mm', { locale: fr })
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Nombre de vues</span>
            <span>{intervention.viewsCount || 0}</span>
          </div>
          {intervention.lastViewedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dernière vue</span>
              <span>
                {format(intervention.lastViewedAt.toDate(), 'PPP à HH:mm', { locale: fr })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
