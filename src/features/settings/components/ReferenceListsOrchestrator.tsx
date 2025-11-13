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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
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
  Upload,
  Settings,
  BarChart3,
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
import { ReferenceListsManager } from './ReferenceListsManager';
import { DuplicateListsDialog } from './DuplicateListsDialog';

// Hooks
import { useAllReferenceLists, useImportExport } from '@/shared/hooks/useReferenceLists';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';

// Services
import { getAvailableTemplates, applyTemplate } from '@/shared/services/listTemplatesService';
import type { ListTemplate } from '@/shared/services/listTemplatesService';
import type { ListKey } from '@/shared/types/reference-lists.types';

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
    } catch (error) {
      console.error('Erreur export:', error);
      toast.dismiss();
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  }, [currentEstablishment, exportToExcel]);

  const handleApplyTemplate = useCallback(
    async (templateId: string) => {
      if (!currentEstablishment?.id || !currentEstablishment?.createdBy) return;

      try {
        toast.loading('Application du template...');

        await applyTemplate(currentEstablishment.id, currentEstablishment.createdBy, templateId);
        await reload();

        toast.dismiss();
        toast.success('Template appliqué avec succès !');
        setIsTemplateDialogOpen(false);
      } catch (error) {
        console.error('Erreur application template:', error);
        toast.dismiss();
        toast.error("Erreur lors de l'application du template");
      }
    },
    [currentEstablishment, reload]
  );

  // ============================================================================
  // TEMPLATES DISPONIBLES
  // ============================================================================

  const availableTemplates = React.useMemo(() => {
    if (!currentEstablishment?.type) return [];
    return getAvailableTemplates(currentEstablishment.type);
  }, [currentEstablishment?.type]);

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
    <div className="space-y-6">
      {/* ========================================================================
          MODERN HEADER WITH GRADIENT
          ======================================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Listes de Référence</h1>
              </div>
              <p className="text-blue-100 text-base max-w-2xl">
                Gérez les listes déroulantes pour {currentEstablishment.name}
              </p>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white shadow-lg"
                  disabled={isLoading}
                >
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
                <DropdownMenuItem
                  onClick={() => setIsTemplateDialogOpen(true)}
                  disabled={isLoading}
                >
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

          {/* Compact Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-100">Listes</span>
                <Sparkles className="h-3.5 w-3.5 text-blue-200" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalLists}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-100">Items</span>
                <BarChart3 className="h-3.5 w-3.5 text-blue-200" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-100">Actifs</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-300" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stats.activeItems}</span>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  {stats.totalItems > 0
                    ? Math.round((stats.activeItems / stats.totalItems) * 100)
                    : 0}%
                </Badge>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-100">Modifié</span>
                <Settings className="h-3.5 w-3.5 text-blue-200" />
              </div>
              <div className="text-lg font-bold text-white">
                {stats.lastModified
                  ? new Date(stats.lastModified).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================
          TABS PRINCIPALES
          ======================================================================== */}
      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">
            <Settings className="mr-2 h-4 w-4" />
            Gérer
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Tab Gestion */}
        <TabsContent value="manage" className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <ReferenceListsManager />
          )}
        </TabsContent>

        {/* Tab Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisation des Listes</CardTitle>
              <CardDescription>
                Statistiques d'utilisation des items dans l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fonctionnalité disponible prochainement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================
          DIALOGS
          ======================================================================== */}

      {/* Dialog Duplication */}
      <DuplicateListsDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        currentEstablishmentId={currentEstablishment.id}
        establishments={establishments || []}
        onSuccess={() => {
          toast.success('Listes dupliquées avec succès !');
          reload();
        }}
      />

      {/* Dialog Templates */}
      <TemplateSelectionDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={availableTemplates}
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
    } catch (error) {
      console.error('Erreur application template:', error);
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

export default ReferenceListsOrchestrator;
