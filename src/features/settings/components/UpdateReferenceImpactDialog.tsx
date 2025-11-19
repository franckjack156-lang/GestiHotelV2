/**
 * ============================================================================
 * UPDATE REFERENCE IMPACT DIALOG
 * ============================================================================
 *
 * Dialog pour confirmer la mise à jour d'une valeur de référence
 * et mettre à jour automatiquement les interventions qui l'utilisent
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
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { AlertTriangle, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { countInterventionsByReferenceValue } from '@/features/interventions/services/updateInterventionsByReference';
import type { ListKey } from '@/shared/types/reference-lists.types';

// ============================================================================
// TYPES
// ============================================================================

interface UpdateReferenceImpactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updateInterventions: boolean) => Promise<void>;
  establishmentId: string;
  listKey: ListKey;
  oldValue: string;
  newValue: string;
  itemLabel: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UpdateReferenceImpactDialog: React.FC<UpdateReferenceImpactDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  establishmentId,
  listKey,
  oldValue,
  newValue,
  itemLabel,
}) => {
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [interventionCount, setInterventionCount] = useState(0);
  const [updateInterventions, setUpdateInterventions] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le nombre d'interventions impactées
  useEffect(() => {
    const loadCount = async () => {
      if (!isOpen) {
        console.log('❌ Dialog not open, skipping count');
        return;
      }

      console.log('🔍 Loading intervention count:', {
        establishmentId,
        listKey,
        oldValue,
        newValue,
        itemLabel,
      });

      setIsLoadingCount(true);
      setError(null);

      try {
        const count = await countInterventionsByReferenceValue(establishmentId, listKey, oldValue);
        console.log('✅ Intervention count loaded:', count);
        setInterventionCount(count);
      } catch (err) {
        console.error('❌ Error loading intervention count:', err);
        setError("Impossible de charger le nombre d'interventions");
      } finally {
        setIsLoadingCount(false);
      }
    };

    loadCount();
  }, [isOpen, establishmentId, listKey, oldValue, newValue, itemLabel]);

  const handleConfirm = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      await onConfirm(updateInterventions);
      onClose();
    } catch (err) {
      console.error('Error updating reference:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Mettre à jour "{itemLabel}" ?
          </DialogTitle>
          <DialogDescription>
            Cette modification peut impacter des interventions existantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Affichage du changement */}
          <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Ancienne valeur</p>
                <p className="font-mono text-red-600 dark:text-red-400">{oldValue}</p>
              </div>
              <div className="text-gray-400">→</div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Nouvelle valeur</p>
                <p className="font-mono text-green-600 dark:text-green-400">{newValue}</p>
              </div>
            </div>
          </div>

          {/* Compteur d'interventions */}
          {isLoadingCount ? (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/10">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Analyse des interventions...
              </p>
            </div>
          ) : interventionCount > 0 ? (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900/30">
              <FileText className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 dark:text-orange-200">
                <span className="font-semibold">{interventionCount}</span> intervention
                {interventionCount > 1 ? 's' : ''} utilise
                {interventionCount > 1 ? 'nt' : ''} actuellement cette valeur.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-200">
                Aucune intervention n'utilise cette valeur.
              </AlertDescription>
            </Alert>
          )}

          {/* Option de mise à jour en cascade */}
          {interventionCount > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Checkbox
                id="updateInterventions"
                checked={updateInterventions}
                onCheckedChange={checked => setUpdateInterventions(checked as boolean)}
                disabled={isUpdating}
              />
              <div className="flex-1">
                <Label htmlFor="updateInterventions" className="text-sm font-medium cursor-pointer">
                  Mettre à jour automatiquement les interventions
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {updateInterventions ? (
                    <>
                      Les <span className="font-semibold text-foreground">{interventionCount}</span>{' '}
                      intervention{interventionCount > 1 ? 's' : ''} seront mises à jour avec la
                      nouvelle valeur.
                    </>
                  ) : (
                    <>
                      Seul l'élément de la liste sera modifié. Les interventions existantes
                      conserveront l'ancienne valeur.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isLoadingCount || isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour en cours...
              </>
            ) : (
              <>
                Confirmer
                {interventionCount > 0 && updateInterventions && (
                  <span className="ml-1 text-xs opacity-75">
                    ({interventionCount} intervention{interventionCount > 1 ? 's' : ''})
                  </span>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
