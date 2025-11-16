/**
 * ============================================================================
 * TEMPLATE CARD COMPONENT
 * ============================================================================
 *
 * Carte d'affichage d'un modèle d'intervention
 */

import { FileText, MoreVertical, Copy, Edit, Trash2, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { PRIORITY_LABELS } from '@/shared/types/status.types';
import type { InterventionTemplate } from '../types/template.types';

interface TemplateCardProps {
  template: InterventionTemplate;
  onUse: (template: InterventionTemplate) => void;
  onEdit?: (template: InterventionTemplate) => void;
  onDuplicate?: (template: InterventionTemplate) => void;
  onDelete?: (template: InterventionTemplate) => void;
}

export const TemplateCard = ({
  template,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplateCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3 flex-1" onClick={() => onUse(template)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {template.name}
            </CardTitle>
            {template.category && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {template.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onUse(template)}>
              <Check className="mr-2 h-4 w-4" />
              Utiliser
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(template)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent onClick={() => onUse(template)}>
        {/* Description */}
        {template.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Template Data Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Titre intervention:</span>
            <span className="font-medium text-gray-900 dark:text-white truncate ml-2">
              {template.templateData.title}
            </span>
          </div>

          {template.templateData.priority && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Priorité:</span>
              <Badge variant="outline">
                {PRIORITY_LABELS[template.templateData.priority] || template.templateData.priority}
              </Badge>
            </div>
          )}

          {template.templateData.estimatedDuration && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Durée estimée:</span>
              <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{template.templateData.estimatedDuration} min</span>
              </div>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="mt-3 pt-3 border-t dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Utilisé {template.usageCount} fois</span>
            {!template.isActive && (
              <Badge variant="outline" className="text-xs">
                Inactif
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
