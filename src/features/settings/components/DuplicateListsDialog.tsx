/**
 * ============================================================================
 * DUPLICATE LISTS DIALOG
 * ============================================================================
 *
 * Dialog pour dupliquer les listes de référence d'un établissement à un autre
 *
 * Fonctionnalités:
 * - Sélection établissement source
 * - Sélection des listes à copier
 * - Sélection établissement cible
 * - Preview des changements
 * - Options overwrite/merge
 *
 * Destination: src/features/settings/components/DuplicateListsDialog.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import {
  Copy,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  FileStack,
  AlertTriangle,
} from 'lucide-react';
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import referenceListsService from '@/shared/services/referenceListsService';
import type { ListKey } from '@/shared/types/reference-lists.types';
import type { EstablishmentSummary } from '@/shared/types/establishment.types';

// ============================================================================
// TYPES
// ============================================================================

interface DuplicateListsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEstablishmentId: string;
  establishments: EstablishmentSummary[];
  onSuccess?: () => void;
}

type Step = 'select-source' | 'select-lists' | 'select-target' | 'confirm' | 'processing' | 'done';

interface DuplicateConfig {
  sourceEstablishmentId: string;
  targetEstablishmentId: string;
  selectedListKeys: ListKey[];
  mode: 'overwrite' | 'merge';
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const DuplicateListsDialog: React.FC<DuplicateListsDialogProps> = ({
  open,
  onOpenChange,
  currentEstablishmentId,
  establishments,
  onSuccess,
}) => {
  // État
  const [step, setStep] = useState<Step>('select-source');
  const [config, setConfig] = useState<DuplicateConfig>({
    sourceEstablishmentId: currentEstablishmentId,
    targetEstablishmentId: '',
    selectedListKeys: [],
    mode: 'merge',
  });
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Charger les listes de l'établissement source
  const {
    data: sourceLists,
    isLoading: sourceLoading,
    error: sourceError,
  } = useAllReferenceLists({
    establishmentId: config.sourceEstablishmentId,
    autoLoad: !!config.sourceEstablishmentId,
  });

  // Charger les listes de l'établissement cible (si sélectionné)
  const { data: targetLists, isLoading: targetLoading } = useAllReferenceLists({
    establishmentId: config.targetEstablishmentId,
    autoLoad: !!config.targetEstablishmentId && step === 'confirm',
  });

  // Reset au changement d'établissement source
  useEffect(() => {
    if (step === 'select-source') {
      setConfig(prev => ({
        ...prev,
        selectedListKeys: [],
        targetEstablishmentId: '',
      }));
    }
  }, [config.sourceEstablishmentId, step]);

  // Reset quand dialog se ferme
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('select-source');
        setConfig({
          sourceEstablishmentId: currentEstablishmentId,
          targetEstablishmentId: '',
          selectedListKeys: [],
          mode: 'merge',
        });
        setError(null);
        setProgress(0);
      }, 300);
    }
  }, [open, currentEstablishmentId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNext = () => {
    setError(null);

    if (step === 'select-source') {
      if (!config.sourceEstablishmentId) {
        setError('Veuillez sélectionner un établissement source');
        return;
      }
      setStep('select-lists');
    } else if (step === 'select-lists') {
      if (config.selectedListKeys.length === 0) {
        setError('Veuillez sélectionner au moins une liste');
        return;
      }
      setStep('select-target');
    } else if (step === 'select-target') {
      if (!config.targetEstablishmentId) {
        setError('Veuillez sélectionner un établissement cible');
        return;
      }
      if (config.targetEstablishmentId === config.sourceEstablishmentId) {
        setError("L'établissement cible doit être différent de la source");
        return;
      }
      setStep('confirm');
    } else if (step === 'confirm') {
      handleDuplicate();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'select-lists') setStep('select-source');
    else if (step === 'select-target') setStep('select-lists');
    else if (step === 'confirm') setStep('select-target');
  };

  const handleDuplicate = async () => {
    try {
      setStep('processing');
      setProgress(0);

      // Simuler progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await referenceListsService.duplicateLists('current-user', {
        fromEstablishmentId: config.sourceEstablishmentId,
        toEstablishmentId: config.targetEstablishmentId,
        listKeys: config.selectedListKeys,
        overwrite: config.mode === 'overwrite',
      });

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setStep('done');
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la duplication');
      setStep('confirm');
      setProgress(0);
    }
  };

  const handleToggleList = (listKey: ListKey) => {
    setConfig(prev => ({
      ...prev,
      selectedListKeys: prev.selectedListKeys.includes(listKey)
        ? prev.selectedListKeys.filter(k => k !== listKey)
        : [...prev.selectedListKeys, listKey],
    }));
  };

  const handleSelectAll = () => {
    if (!sourceLists) return;

    const allKeys = Object.keys(sourceLists.lists) as ListKey[];
    setConfig(prev => ({
      ...prev,
      selectedListKeys: prev.selectedListKeys.length === allKeys.length ? [] : allKeys,
    }));
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getEstablishmentName = (id: string) => {
    return establishments.find(e => e.id === id)?.name || 'Inconnu';
  };

  const getConflictingLists = (): ListKey[] => {
    if (!targetLists || !sourceLists) return [];

    return config.selectedListKeys.filter(key => {
      return !!targetLists.lists[key];
    });
  };

  const canProceed = () => {
    if (step === 'select-source') return !!config.sourceEstablishmentId;
    if (step === 'select-lists') return config.selectedListKeys.length > 0;
    if (step === 'select-target') {
      return (
        !!config.targetEstablishmentId &&
        config.targetEstablishmentId !== config.sourceEstablishmentId
      );
    }
    if (step === 'confirm') return true;
    return false;
  };

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderStepContent = () => {
    switch (step) {
      case 'select-source':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="source-establishment">Établissement source</Label>
              <Select
                value={config.sourceEstablishmentId}
                onValueChange={value =>
                  setConfig(prev => ({ ...prev, sourceEstablishmentId: value }))
                }
              >
                <SelectTrigger id="source-establishment">
                  <SelectValue placeholder="Sélectionnez un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {establishments.map(establishment => (
                    <SelectItem key={establishment.id} value={establishment.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {establishment.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Choisissez l'établissement dont vous voulez copier les listes
              </p>
            </div>

            {sourceLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des listes...
              </div>
            )}

            {sourceError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{sourceError}</AlertDescription>
              </Alert>
            )}

            {sourceLists && (
              <Alert>
                <FileStack className="h-4 w-4" />
                <AlertDescription>
                  <strong>{Object.keys(sourceLists.lists).length}</strong> listes disponibles dans
                  cet établissement
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'select-lists':
        if (!sourceLists) return null;

        const allListKeys = Object.keys(sourceLists.lists) as ListKey[];

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Listes à dupliquer</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {config.selectedListKeys.length === allListKeys.length
                  ? 'Tout désélectionner'
                  : 'Tout sélectionner'}
              </Button>
            </div>

            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {allListKeys.map(listKey => {
                const list = sourceLists.lists[listKey];
                const isSelected = config.selectedListKeys.includes(listKey);

                return (
                  <div
                    key={listKey}
                    className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleToggleList(listKey)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleList(listKey)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{list.name}</div>
                      {list.description && (
                        <div className="text-sm text-muted-foreground">{list.description}</div>
                      )}
                    </div>
                    <Badge variant="outline">{list.items.length} items</Badge>
                    {list.isSystem && <Badge variant="secondary">Système</Badge>}
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-muted-foreground">
              {config.selectedListKeys.length} liste(s) sélectionnée(s)
            </p>
          </div>
        );

      case 'select-target':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-establishment">Établissement cible</Label>
              <Select
                value={config.targetEstablishmentId}
                onValueChange={value =>
                  setConfig(prev => ({ ...prev, targetEstablishmentId: value }))
                }
              >
                <SelectTrigger id="target-establishment">
                  <SelectValue placeholder="Sélectionnez un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {establishments
                    .filter(e => e.id !== config.sourceEstablishmentId)
                    .map(establishment => (
                      <SelectItem key={establishment.id} value={establishment.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {establishment.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Choisissez l'établissement qui recevra les listes
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Mode de duplication</Label>
              <RadioGroup
                value={config.mode}
                onValueChange={(value: 'overwrite' | 'merge') =>
                  setConfig(prev => ({ ...prev, mode: value }))
                }
              >
                <div className="flex items-start space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="merge" id="merge" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="merge" className="font-medium cursor-pointer">
                      Fusionner (recommandé)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Les nouvelles listes seront ajoutées. Les listes existantes seront conservées.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="overwrite" id="overwrite" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="overwrite" className="font-medium cursor-pointer">
                      Écraser
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Les listes existantes seront remplacées par celles de la source.
                    </p>
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Attention : Cette action est irréversible !
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 'confirm':
        const conflictingLists = getConflictingLists();

        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Confirmez la duplication des listes suivantes</AlertDescription>
            </Alert>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Source:</span>
                <span className="font-medium">
                  {getEstablishmentName(config.sourceEstablishmentId)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cible:</span>
                <span className="font-medium">
                  {getEstablishmentName(config.targetEstablishmentId)}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">
                Listes à copier ({config.selectedListKeys.length})
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.selectedListKeys.map(listKey => (
                  <Badge key={listKey} variant="secondary">
                    {sourceLists?.lists[listKey]?.name || listKey}
                  </Badge>
                ))}
              </div>
            </div>

            {conflictingLists.length > 0 && (
              <Alert variant={config.mode === 'overwrite' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{conflictingLists.length}</strong> liste(s) existent déjà dans
                  l'établissement cible:
                  <div className="mt-2 flex flex-wrap gap-1">
                    {conflictingLists.map(key => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {sourceLists?.lists[key]?.name || key}
                      </Badge>
                    ))}
                  </div>
                  {config.mode === 'overwrite' ? (
                    <p className="mt-2 font-medium">Ces listes seront écrasées !</p>
                  ) : (
                    <p className="mt-2">Ces listes seront conservées (mode fusion).</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium mb-1">
                Mode: {config.mode === 'merge' ? 'Fusion' : 'Écrasement'}
              </div>
              <div className="text-muted-foreground">
                {config.mode === 'merge'
                  ? "Les listes seront fusionnées avec l'existant"
                  : 'Les listes existantes seront remplacées'}
              </div>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <div className="font-medium">Duplication en cours...</div>
                <div className="text-sm text-muted-foreground">Veuillez patienter</div>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        );

      case 'done':
        return (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-medium">Duplication réussie !</div>
                <div className="text-sm text-muted-foreground">
                  {config.selectedListKeys.length} liste(s) ont été copiées vers{' '}
                  <strong>{getEstablishmentName(config.targetEstablishmentId)}</strong>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const getDialogTitle = () => {
    switch (step) {
      case 'select-source':
        return 'Sélectionner la source';
      case 'select-lists':
        return 'Choisir les listes';
      case 'select-target':
        return 'Sélectionner la destination';
      case 'confirm':
        return 'Confirmer la duplication';
      case 'processing':
        return 'Duplication en cours';
      case 'done':
        return 'Terminé';
      default:
        return 'Dupliquer des listes';
    }
  };

  const getDialogDescription = () => {
    switch (step) {
      case 'select-source':
        return "Choisissez l'établissement dont vous voulez copier les listes de référence";
      case 'select-lists':
        return 'Sélectionnez les listes que vous souhaitez dupliquer';
      case 'select-target':
        return "Choisissez l'établissement qui recevra les listes";
      case 'confirm':
        return 'Vérifiez les paramètres avant de lancer la duplication';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </div>
          {getDialogDescription() && (
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}
        </div>

        {step !== 'processing' && step !== 'done' && (
          <DialogFooter className="gap-2">
            {step !== 'select-source' && (
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
            )}
            <Button
              onClick={step === 'done' ? () => onOpenChange(false) : handleNext}
              disabled={!canProceed() || sourceLoading}
            >
              {step === 'confirm' ? 'Dupliquer' : step === 'done' ? 'Fermer' : 'Suivant'}
            </Button>
          </DialogFooter>
        )}

        {step === 'done' && (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateListsDialog;
