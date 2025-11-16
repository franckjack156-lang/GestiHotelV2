/**
 * ============================================================================
 * ASSIGN TECHNICIAN DIALOG
 * ============================================================================
 *
 * Dialogue pour assigner un technicien lors du changement de statut
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { TechnicianSelect } from '@/features/users/components/TechnicianSelect';
import { Loader2 } from 'lucide-react';

interface AssignTechnicianDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (technicianId: string) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
}

export const AssignTechnicianDialog = ({
  open,
  onClose,
  onAssign,
  onSkip,
  isLoading = false,
}: AssignTechnicianDialogProps) => {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedTechnicianId) return;

    setIsAssigning(true);
    try {
      await onAssign(selectedTechnicianId);
      setSelectedTechnicianId('');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSkip = () => {
    setSelectedTechnicianId('');
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner un technicien</DialogTitle>
          <DialogDescription>
            Voulez-vous assigner cette intervention à un technicien ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <TechnicianSelect
            value={selectedTechnicianId}
            onChange={value => setSelectedTechnicianId(value as string)}
            multiple={false}
            placeholder="Sélectionner un technicien..."
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={isAssigning || isLoading}>
            Passer
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTechnicianId || isAssigning || isLoading}
          >
            {isAssigning || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assignation...
              </>
            ) : (
              'Assigner'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
