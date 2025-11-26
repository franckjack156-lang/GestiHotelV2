/**
 * ============================================================================
 * STATUS BADGE DROPDOWN COMPONENT
 * ============================================================================
 *
 * Badge cliquable avec menu déroulant pour changer le statut d'une intervention
 * - Affiche le statut actuel avec couleur et icône
 * - Menu déroulant avec toutes les transitions autorisées
 * - Indicateurs visuels pour transitions avant/arrière
 * - Confirmations pour transitions sensibles
 * - Proposition d'assigner un technicien au passage à "assigned"
 * - Intégration automatique avec l'historique
 */

import { useState } from 'react';
import { ChevronDown, ArrowRight, ArrowLeft, MoveHorizontal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { AssignTechnicianDialog } from './AssignTechnicianDialog';
import { useInterventionActions } from '../hooks/useInterventionActions';
import type { StatusValue } from '../constants/statusConfig';
import {
  STATUS_CONFIG,
  getAvailableTransitions,
  getTransitionDirection,
  getTransitionConfirmation,
} from '../constants/statusConfig';
import { cn } from '@/shared/lib/utils';
import { logger } from '@/core/utils/logger';

interface StatusBadgeDropdownProps {
  currentStatus: StatusValue;
  interventionId: string;
  assignedTo?: string | null;
  onStatusChange: (newStatus: StatusValue) => Promise<boolean>;
  disabled?: boolean;
}

export const StatusBadgeDropdown = ({
  currentStatus,
  interventionId,
  assignedTo,
  onStatusChange,
  disabled = false,
}: StatusBadgeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    targetStatus: StatusValue | null;
    message: string;
  }>({
    open: false,
    targetStatus: null,
    message: '',
  });
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    targetStatus: StatusValue | null;
  }>({
    open: false,
    targetStatus: null,
  });
  const [isChanging, setIsChanging] = useState(false);

  const { assignIntervention } = useInterventionActions();
  const currentStatusInfo = STATUS_CONFIG[currentStatus];
  const availableTransitions = getAvailableTransitions(currentStatus);

  const handleStatusSelect = (newStatus: StatusValue) => {
    setIsOpen(false);

    // Si on passe à "assigned" et qu'aucun technicien n'est assigné, proposer d'en assigner un
    if (newStatus === 'assigned' && !assignedTo) {
      setAssignDialog({
        open: true,
        targetStatus: newStatus,
      });
      return;
    }

    // Vérifier si confirmation nécessaire
    const confirmationMessage = getTransitionConfirmation(currentStatus, newStatus);

    if (confirmationMessage) {
      setConfirmDialog({
        open: true,
        targetStatus: newStatus,
        message: confirmationMessage,
      });
    } else {
      executeStatusChange(newStatus);
    }
  };

  const handleConfirmChange = () => {
    if (confirmDialog.targetStatus) {
      executeStatusChange(confirmDialog.targetStatus);
    }
    setConfirmDialog({ open: false, targetStatus: null, message: '' });
  };

  const handleCancelChange = () => {
    setConfirmDialog({ open: false, targetStatus: null, message: '' });
  };

  const handleAssignTechnician = async (technicianId: string) => {
    const targetStatus = assignDialog.targetStatus;
    if (!targetStatus) return;

    try {
      // Assigner le technicien
      const success = await assignIntervention(interventionId, { technicianId });

      if (success) {
        // Fermer le dialogue et exécuter le changement de statut
        setAssignDialog({ open: false, targetStatus: null });
        toast.success('Technicien assigné');

        // Le statut "assigned" est déjà défini par assignIntervention
        // Pas besoin de le changer à nouveau
        const direction = getTransitionDirection(currentStatus, targetStatus);
        const directionEmoji =
          direction === 'forward' ? '➡️' : direction === 'backward' ? '⬅️' : '↔️';
        toast.success(`${directionEmoji} Statut changé : ${STATUS_CONFIG[targetStatus].label}`);
      }
    } catch (error) {
      toast.error("Erreur lors de l'assignation");
      logger.error(error);
    }
  };

  const handleSkipAssignment = () => {
    const targetStatus = assignDialog.targetStatus;
    setAssignDialog({ open: false, targetStatus: null });

    if (targetStatus) {
      executeStatusChange(targetStatus);
    }
  };

  const executeStatusChange = async (newStatus: StatusValue) => {
    setIsChanging(true);
    try {
      const success = await onStatusChange(newStatus);

      if (success) {
        const direction = getTransitionDirection(currentStatus, newStatus);
        const directionEmoji =
          direction === 'forward' ? '➡️' : direction === 'backward' ? '⬅️' : '↔️';
        toast.success(`${directionEmoji} Statut changé : ${STATUS_CONFIG[newStatus].label}`);
      } else {
        toast.error('Impossible de changer le statut');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
      logger.error(error);
    } finally {
      setIsChanging(false);
    }
  };

  const getTransitionIcon = (targetStatus: StatusValue) => {
    const direction = getTransitionDirection(currentStatus, targetStatus);
    switch (direction) {
      case 'forward':
        return <ArrowRight className="h-4 w-4 text-green-600" />;
      case 'backward':
        return <ArrowLeft className="h-4 w-4 text-orange-600" />;
      default:
        return <MoveHorizontal className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isChanging}
            className={cn('h-auto py-1 px-3 font-semibold border-2', currentStatusInfo.color)}
          >
            <span className="text-base mr-2">{currentStatusInfo.icon}</span>
            {currentStatusInfo.label}
            {isChanging ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {availableTransitions.length === 0 ? (
            <DropdownMenuItem disabled>Aucune transition disponible</DropdownMenuItem>
          ) : (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Changer le statut
              </div>
              <DropdownMenuSeparator />
              {availableTransitions.map(status => {
                const statusInfo = STATUS_CONFIG[status];
                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    className="py-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-0.5">{getTransitionIcon(status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-base">{statusInfo.icon}</span>
                          <span className="font-semibold text-sm">{statusInfo.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {statusInfo.description}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogue de confirmation standard */}
      <AlertDialog open={confirmDialog.open} onOpenChange={open => !open && handleCancelChange()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChange}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogue d'assignation de technicien */}
      <AssignTechnicianDialog
        open={assignDialog.open}
        onClose={() => setAssignDialog({ open: false, targetStatus: null })}
        onAssign={handleAssignTechnician}
        onSkip={handleSkipAssignment}
        isLoading={isChanging}
      />
    </>
  );
};
