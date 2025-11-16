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
import { Lock, AlertCircle } from 'lucide-react';

interface BlockRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  roomNumber: string;
  isLoading?: boolean;
}

export const BlockRoomDialog: React.FC<BlockRoomDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  roomNumber,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');

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
