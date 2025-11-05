/**
 * SummaryStep Component
 *
 * Étape 6 : Récapitulatif final de l'intervention
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  Clock,
  Image as ImageIcon,
  Tag,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { TypeBadge } from '@/features/interventions/components/badges/TypeBadge';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import {
  InterventionStatus,
  InterventionType,
  InterventionPriority,
  CATEGORY_LABELS,
} from '@/shared/types/status.types';
import type { WizardData } from '@/features/interventions/hooks/useInterventionWizard';

interface SummaryStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

export const SummaryStep = ({ data }: SummaryStepProps) => {
  return (
    <div className="space-y-6">
      {/* Message de confirmation */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
              Intervention prête à être créée
            </h4>
            <p className="text-sm text-green-800 dark:text-green-400">
              Vérifiez les informations ci-dessous avant de valider
            </p>
          </div>
        </div>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations principales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {data.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {data.type && <TypeBadge type={data.type as InterventionType} />}
              {data.priority && <PriorityBadge priority={data.priority as InterventionPriority} />}
              <StatusBadge status={InterventionStatus.PENDING} />
            </div>
          </div>

          {data.category && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Catégorie</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {CATEGORY_LABELS[data.category as any]}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {data.description}
            </p>
          </div>

          {data.tags && data.tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {data.tags.map(tag => (
                  <Badge key={tag.id} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(data.isUrgent || data.isBlocking) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {data.isUrgent && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Intervention urgente
                </Badge>
              )}
              {data.isBlocking && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  Chambre bloquée
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Localisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Type de zone</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.roomType === 'chambre'
                ? 'Chambre'
                : data.roomType === 'commun'
                  ? 'Espace commun'
                  : 'Extérieur'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Localisation principale</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.location}</p>
          </div>

          {data.roomNumber && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chambre</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {data.roomNumber}
              </p>
            </div>
          )}

          {data.locations && data.locations.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Chambres additionnelles ({data.locations.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {data.locations.map((location, index) => (
                  <Badge key={index} variant="outline">
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.floor !== undefined && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Étage</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.floor}</p>
            </div>
          )}

          {data.building && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bâtiment</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {data.building}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planning */}
      {(data.scheduledAt || data.estimatedDuration) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.scheduledAt && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Planifiée pour le</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {format(data.scheduledAt, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            )}

            {data.estimatedDuration && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Durée estimée</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {Math.floor(data.estimatedDuration / 60) > 0 &&
                    `${Math.floor(data.estimatedDuration / 60)}h `}
                  {data.estimatedDuration % 60 > 0 && `${data.estimatedDuration % 60}min`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignation */}
      {data.assignedTo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assignation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Cette intervention sera assignée à un technicien
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes internes */}
      {data.internalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes internes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {data.internalNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {data.photos && data.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Photos ({data.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                {data.photos.length} photo{data.photos.length > 1 ? 's' : ''} prête
                {data.photos.length > 1 ? 's' : ''} à être uploadée
                {data.photos.length > 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations supplémentaires */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          ℹ️ Après la création
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Un QR code sera généré automatiquement</li>
          <li>• Les techniciens assignés recevront une notification</li>
          <li>• Vous pourrez suivre l'intervention en temps réel</li>
          <li>• Vous pourrez modifier ces informations à tout moment</li>
        </ul>
      </div>
    </div>
  );
};
