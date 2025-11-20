/**
 * Onglet Détails - Informations de base de l'intervention
 * VERSION TECHNICIEN - Avec édition rapide des notes
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { MapPin, User, Calendar, FileText, Tag as TagIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReferenceDisplay } from '@/shared/components/ReferenceDisplay';
import { useInterventionActions } from '../../hooks/useInterventionActions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { QuickNotesEditor, TechnicianActions } from '../quick-edit';
import type { Intervention } from '../../types/intervention.types';

interface DetailsTabProps {
  intervention: Intervention;
}

export const DetailsTab = ({ intervention }: DetailsTabProps) => {
  const { user } = useAuth();
  const { updateIntervention, changeStatus, isUpdating } = useInterventionActions();

  // Permissions
  const canEdit =
    user?.role === 'admin' || user?.role === 'super_admin' || user?.id === intervention.createdBy;
  const isTechnician = user?.id === intervention.assignedTo || user?.role === 'technician';
  const canStartWork = intervention.status === 'pending' || intervention.status === 'assigned';
  const canPause = intervention.status === 'in_progress';
  const canComplete = intervention.status === 'in_progress';

  // Handlers pour les notes
  const handleSaveInternalNotes = async (value: string): Promise<boolean> => {
    return await updateIntervention(intervention.id, { internalNotes: value });
  };

  const handleSaveResolutionNotes = async (value: string): Promise<boolean> => {
    return await updateIntervention(intervention.id, { resolutionNotes: value });
  };

  const handleStatusChange = async (newStatus: string): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await changeStatus(intervention.id, { newStatus: newStatus as any });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Colonne gauche - 2/3 */}
      <div className="lg:col-span-2 space-y-6">
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {intervention.description || 'Aucune description fournie'}
            </p>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lieu</p>
              <p className="font-medium">{intervention.location}</p>
            </div>
            {intervention.roomNumber && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chambre</p>
                <p className="font-medium">{intervention.roomNumber}</p>
              </div>
            )}
            {intervention.floor !== undefined && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Étage</p>
                <p className="font-medium">{intervention.floor}</p>
              </div>
            )}
            {intervention.building && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bâtiment</p>
                <p className="font-medium">
                  <ReferenceDisplay listKey="buildings" value={intervention.building} />
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes internes - Édition rapide */}
        <QuickNotesEditor
          interventionId={intervention.id}
          noteType="internal"
          currentValue={intervention.internalNotes}
          status={intervention.status}
          onSave={handleSaveInternalNotes}
          canEdit={canEdit || isTechnician}
        />

        {/* Notes de résolution - Édition rapide */}
        <QuickNotesEditor
          interventionId={intervention.id}
          noteType="resolution"
          currentValue={intervention.resolutionNotes}
          status={intervention.status}
          onSave={handleSaveResolutionNotes}
          canEdit={canEdit || isTechnician}
        />
      </div>

      {/* Colonne droite - 1/3 */}
      <div className="space-y-6">
        {/* Actions Technicien */}
        {isTechnician && (
          <TechnicianActions
            intervention={intervention}
            onStatusChange={handleStatusChange}
            canStartWork={canStartWork}
            canPause={canPause}
            canComplete={canComplete}
            isUpdating={isUpdating}
          />
        )}

        {/* Assignation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Assignation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Créé par</p>
              <p className="font-medium">{intervention.createdByName || 'Inconnu'}</p>
            </div>
            {intervention.assignedToName && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assigné à</p>
                <p className="font-medium">{intervention.assignedToName}</p>
                {intervention.assignedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Le{' '}
                    {format(intervention.assignedAt.toDate(), 'dd MMM yyyy à HH:mm', {
                      locale: fr,
                    })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates et durées */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates et durées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Créée le</p>
              <p className="font-medium">
                {intervention.createdAt &&
                  format(intervention.createdAt.toDate(), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
            {intervention.scheduledAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prévue pour le</p>
                <p className="font-medium">
                  {format(intervention.scheduledAt.toDate(), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            )}
            {intervention.startedAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Démarrée le</p>
                <p className="font-medium">
                  {format(intervention.startedAt.toDate(), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            )}
            {intervention.completedAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Terminée le</p>
                <p className="font-medium">
                  {format(intervention.completedAt.toDate(), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            )}
            {intervention.estimatedDuration && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Durée estimée</p>
                <p className="font-medium">{intervention.estimatedDuration} minutes</p>
              </div>
            )}
            {intervention.actualDuration && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Durée réelle</p>
                <p className="font-medium">{intervention.actualDuration} minutes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {intervention.tags && intervention.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TagIcon className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {intervention.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Références */}
        {(intervention.reference || intervention.externalReference) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Références</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intervention.reference && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Référence interne</p>
                  <p className="font-mono text-sm">{intervention.reference}</p>
                </div>
              )}
              {intervention.externalReference && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Référence externe</p>
                  <p className="font-mono text-sm">{intervention.externalReference}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Métadonnées */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
              Informations système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ID</span>
              <span className="font-mono text-xs">{intervention.id.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Vues</span>
              <span>{intervention.viewsCount || 0}</span>
            </div>
            {intervention.updatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Dernière modification</span>
                <span className="text-xs">
                  {format(intervention.updatedAt.toDate(), 'dd/MM/yy HH:mm', { locale: fr })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
