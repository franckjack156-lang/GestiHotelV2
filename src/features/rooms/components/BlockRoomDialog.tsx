/**
 * ============================================================================
 * BLOCK ROOM DIALOG
 * ============================================================================
 *
 * Dialog pour bloquer une chambre avec raison
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Lock, AlertCircle, Wrench } from 'lucide-react';
import { useRoomInterventions } from '@/features/interventions/hooks/useRoomInterventions';
import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';

interface BlockRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  roomNumber: string;
  establishmentId?: string;
  isLoading?: boolean;
}

export const BlockRoomDialog: React.FC<BlockRoomDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  roomNumber,
  establishmentId,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');

  // Charger les interventions liées à cette chambre
  const { interventions: roomInterventions } = useRoomInterventions(establishmentId, roomNumber);

  const handleConfirm = () => {
    if (!reason.trim()) {
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            Bloquer la chambre {roomNumber}
          </DialogTitle>
          <DialogDescription>
            Cette action bloquera la chambre pour toutes les interventions futures. Veuillez
            indiquer la raison du blocage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Interventions en cours */}
          {roomInterventions.filter(i => i.status !== 'completed' && i.status !== 'cancelled')
            .length > 0 && (
            <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30">
              <div className="flex items-start gap-2 mb-2">
                <Wrench className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Interventions en cours (
                    {
                      roomInterventions.filter(
                        i => i.status !== 'completed' && i.status !== 'cancelled'
                      ).length
                    }
                    )
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Ces interventions sont actuellement actives sur cette chambre
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {roomInterventions
                  .filter(i => i.status !== 'completed' && i.status !== 'cancelled')
                  .map(intervention => (
                    <div
                      key={intervention.id}
                      className="flex items-start gap-2 p-2 rounded bg-white dark:bg-gray-800 border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{intervention.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={intervention.status} />
                          <PriorityBadge priority={intervention.priority} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="blockReason">
              Raison du blocage <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="blockReason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Fuite d'eau, travaux de rénovation, problème électrique..."
              rows={4}
              className="resize-none"
              disabled={isLoading}
            />
          </div>

          {!reason.trim() && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                La raison du blocage est obligatoire pour informer les autres utilisateurs.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>Blocage en cours...</>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Bloquer la chambre
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockRoomDialog;
