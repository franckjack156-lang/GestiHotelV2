/**
 * ============================================================================
 * REFERENCE LISTS - ORCHESTRATOR
 * ============================================================================
 *
 * Fichier unique qui orchestre toutes les fonctionnalités des listes de référence
 * Point d'entrée centralisé pour simplifier l'intégration
 *
 * Utilisation:
 * ```tsx
 * import { ReferenceListsOrchestrator } from './ReferenceListsOrchestrator';
 *
 * // Dans votre Settings page
 * <ReferenceListsOrchestrator />
 * ```
 *
 * Destination: src/features/settings/components/ReferenceListsOrchestrator.tsx
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  Copy,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Composants existants
import { ReferenceListsManagerV2 } from './ReferenceListsManagerV2';
import { DuplicateListsDialog } from './DuplicateListsDialog';

// Hooks
import { useAllReferenceLists, useImportExport } from '@/shared/hooks/useReferenceLists';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';

// Services
import { getAvailableTemplates, applyTemplate } from '@/shared/services/listTemplatesService';
import { addMissingLists } from '@/features/establishments/services/establishmentInitService';
import type { ListTemplate } from '@/shared/types/reference-lists.types';

// ============================================================================
// TYPES
// ============================================================================

interface OrchestratStats {
  totalLists: number;
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  lastModified?: Date;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const ReferenceListsOrchestrator: React.FC = () => {
  const { currentEstablishment } = useCurrentEstablishment();
  const { establishments } = useEstablishments();
  const { data, isLoading, error, reload } = useAllReferenceLists({
    realtime: true,
    autoLoad: true,
  });
  const { exportToExcel } = useImportExport();

  // États
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats: OrchestratStats = React.useMemo(() => {
    if (!data?.lists) {
      return {
        totalLists: 0,
        totalItems: 0,
        activeItems: 0,
        inactiveItems: 0,
      };
    }

    const lists = Object.values(data.lists);
    const allItems = lists.flatMap(list => list.items || []);

    return {
      totalLists: lists.length,
      totalItems: allItems.length,
      activeItems: allItems.filter(item => item.isActive).length,
      inactiveItems: allItems.filter(item => !item.isActive).length,
      lastModified: data.lastModified,
    };
  }, [data]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExportAll = useCallback(async () => {
    if (!currentEstablishment?.id) return;

    try {
      setIsExporting(true);
      toast.loading('Export en cours...');

      const blob = await exportToExcel({
        format: 'xlsx',
        includeInactive: true,
        includeMetadata: true,
      });

      // Télécharger le fichier
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listes-reference-${currentEstablishment.name}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Export réussi !');
    } catch (error: unknown) {
      logger.error('Erreur export:', error);
      toast.dismiss();
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  }, [currentEstablishment, exportToExcel]);

  const handleApplyTemplate = useCallback(
    async (templateId: string) => {
      if (!currentEstablishment?.id || !currentEstablishment?.ownerId) return;

      try {
        toast.loading('Application du template...');

        await applyTemplate(currentEstablishment.id, currentEstablishment.ownerId, templateId);
        await reload();

        toast.dismiss();
        toast.success('Template appliqué avec succès !');
        setIsTemplateDialogOpen(false);
      } catch (error: unknown) {
        logger.error('Erreur application template:', error);
        toast.dismiss();
        toast.error("Erreur lors de l'application du template");
      }
    },
    [currentEstablishment, reload]
  );

  const handleSyncMissingLists = useCallback(async () => {
    logger.debug('🔵 handleSyncMissingLists appelé');
    logger.debug('🔵 currentEstablishment:', currentEstablishment);

    if (!currentEstablishment?.id || !currentEstablishment?.ownerId) {
      logger.warn('⚠️ Establishment ID ou ownerId manquant');
      logger.debug('⚠️ ID:', currentEstablishment?.id);
      logger.debug('⚠️ ownerId:', currentEstablishment?.ownerId);
      return;
    }

    try {
      logger.debug('🟢 Démarrage de la synchronisation');
      setIsSyncing(true);
      toast.loading('Synchronisation des listes...');

      logger.debug('🟢 Appel addMissingLists avec:', {
        establishmentId: currentEstablishment.id,
        userId: currentEstablishment.ownerId,
      });

      await addMissingLists(currentEstablishment.id, currentEstablishment.ownerId);

      logger.debug('🟢 addMissingLists terminé, rechargement...');
      await reload();

      toast.dismiss();
      toast.success('Listes synchronisées avec succès !');
      logger.debug('✅ Synchronisation réussie');
    } catch (error: unknown) {
      logger.error('❌ Erreur synchronisation:', error);
      toast.dismiss();
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
      logger.debug('🔵 handleSyncMissingLists terminé');
    }
  }, [currentEstablishment, reload]);

  // ============================================================================
  // TEMPLATES DISPONIBLES
  // ============================================================================

  const availableTemplates = React.useMemo(() => {
    return getAvailableTemplates();
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!currentEstablishment) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Veuillez sélectionner un établissement pour gérer les listes de référence.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header compact avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Listes de Référence</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {stats.totalLists} listes · {stats.activeItems}/{stats.totalItems} items actifs
          </p>
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <MoreVertical className="h-4 w-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={e => {
                logger.debug('🟡 DropdownMenuItem onClick déclenché', e);
                handleSyncMissingLists();
              }}
              disabled={isSyncing || isLoading}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Synchroniser les listes
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportAll} disabled={isExporting || isLoading}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter en Excel
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)} disabled={isLoading}>
              <FileText className="mr-2 h-4 w-4" />
              Appliquer un template
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDuplicateDialogOpen(true)}
              disabled={isLoading || !establishments || establishments.length < 2}
            >
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer vers...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contenu principal */}
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ReferenceListsManagerV2 />
      )}

      {/* ========================================================================
          DIALOGS
          ======================================================================== */}

      {/* Dialog Duplication */}
      <DuplicateListsDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        currentEstablishmentId={currentEstablishment.id}
        establishments={(establishments || []).map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          category: e.category,
          logoUrl: e.logoUrl,
          isActive: e.isActive,
          totalRooms: e.totalRooms,
          city: e.address?.city || '',
        }))}
        onSuccess={() => {
          toast.success('Listes dupliquées avec succès !');
          reload();
        }}
      />

      {/* Dialog Templates */}
      <TemplateSelectionDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={availableTemplates as any}
        onApply={handleApplyTemplate}
      />
    </div>
  );
};

// ============================================================================
// DIALOG SÉLECTION TEMPLATE
// ============================================================================

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ListTemplate[];
  onApply: (templateId: string) => Promise<void>;
}

const TemplateSelectionDialog: React.FC<TemplateSelectionDialogProps> = ({
  open,
  onOpenChange,
  templates,
  onApply,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!selectedTemplateId) return;

    setIsApplying(true);
    try {
      await onApply(selectedTemplateId);
      onOpenChange(false);
    } catch (error: unknown) {
      logger.error('Erreur application template:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Appliquer un Template</DialogTitle>
          <DialogDescription>
            Sélectionnez un template pour remplacer les listes actuelles. Cette action écrasera
            toutes les listes existantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention :</strong> Cette action remplacera toutes vos listes actuelles par
              celles du template sélectionné. Pensez à exporter vos listes avant si vous souhaitez
              les conserver.
            </AlertDescription>
          </Alert>

          {/* Liste des templates */}
          <div className="grid gap-3">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun template disponible pour ce type d'établissement.
              </p>
            ) : (
              templates.map(template => (
                <Card
                  key={template.id}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary',
                    selectedTemplateId === template.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      {selectedTemplateId === template.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(template.lists).map(listKey => (
                        <Badge key={listKey} variant="secondary" className="text-xs">
                          {listKey}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Annuler
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplateId || isApplying}>
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Application...
              </>
            ) : (
              'Appliquer le Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Imports manquants pour le Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/utils/cn';
import { logger } from '@/core/utils/logger';

export default ReferenceListsOrchestrator;
