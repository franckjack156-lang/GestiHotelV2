/**
 * ============================================================================
 * DELETE ESTABLISHMENT DIALOG
 * ============================================================================
 *
 * Dialog pour supprimer un établissement avec protections maximales:
 * - Vérification des dépendances
 * - Affichage des avertissements/blockers
 * - Confirmation par saisie du nom
 * - Checkbox de confirmation supplémentaire
 * - Progression de suppression
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  AlertTriangle,
  Trash2,
  XCircle,
  Loader2,
  CheckCircle2,
  Shield,
  Database,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  checkEstablishmentDeletion,
  deleteEstablishmentPermanently,
  type DeletionCheck,
} from '../services/establishmentDeletionService';
import type { EstablishmentSummary } from '@/shared/types/establishment.types';

// ============================================================================
// TYPES
// ============================================================================

interface DeleteEstablishmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishment: EstablishmentSummary;
  userId: string;
  onSuccess?: () => void;
}

type Step = 'check' | 'confirm' | 'processing' | 'done' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

export const DeleteEstablishmentDialog: React.FC<DeleteEstablishmentDialogProps> = ({
  open,
  onOpenChange,
  establishment,
  userId,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('check');
  const [deletionCheck, setDeletionCheck] = useState<DeletionCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // État de confirmation
  const [confirmationName, setConfirmationName] = useState('');
  const [deleteRelatedData, setDeleteRelatedData] = useState(false);
  const [confirmUnderstood, setConfirmUnderstood] = useState(false);

  // Résultats
  const [error, setError] = useState<string | null>(null);
  const [deletedCollections, setDeletedCollections] = useState<string[]>([]);

  // Vérifier les dépendances à l'ouverture
  useEffect(() => {
    if (open) {
      performCheck();
    } else {
      // Reset au close
      setTimeout(() => {
        setStep('check');
        setDeletionCheck(null);
        setConfirmationName('');
        setDeleteRelatedData(false);
        setConfirmUnderstood(false);
        setError(null);
        setDeletedCollections([]);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, establishment.id]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const performCheck = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const check = await checkEstablishmentDeletion(establishment.id);
      setDeletionCheck(check);

      if (!check.canDelete) {
        setStep('error');
      } else {
        setStep('confirm');
      }
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async () => {
    if (!deletionCheck?.canDelete) return;
    if (confirmationName !== establishment.name) {
      setError('Le nom de confirmation ne correspond pas');
      return;
    }
    if (!confirmUnderstood) {
      setError('Vous devez confirmer que vous comprenez les conséquences');
      return;
    }

    setIsDeleting(true);
    setStep('processing');
    setError(null);

    try {
      const result = await deleteEstablishmentPermanently(establishment.id, {
        confirmationName,
        deleteRelatedData,
        userId,
      });

      if (result.success) {
        setDeletedCollections(result.deletedCollections);
        setStep('done');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setError(result.errors.join(', '));
        setStep('error');
      }
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderCheckStep = () => (
    <div className="space-y-4 py-4">
      {isChecking ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Vérification des dépendances...
          </p>
        </div>
      ) : (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Vérification en cours de la possibilité de suppression...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderConfirmStep = () => {
    if (!deletionCheck) return null;

    const nameMatches = confirmationName === establishment.name;

    return (
      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-6 py-4">
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Interventions</span>
              </div>
              <p className="text-2xl font-bold">{deletionCheck.stats.interventionsCount}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Utilisateurs</span>
              </div>
              <p className="text-2xl font-bold">{deletionCheck.stats.usersCount}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Documents</span>
              </div>
              <p className="text-2xl font-bold">{deletionCheck.stats.documentsCount}</p>
            </div>
          </div>

          {/* Avertissements */}
          {deletionCheck.warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Avertissements :</p>
                <ul className="list-disc list-inside space-y-1">
                  {deletionCheck.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">
                      {warning}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Option pour supprimer les données liées */}
          {deletionCheck.stats.interventionsCount > 0 && (
            <div className="flex items-start space-x-2 p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Checkbox
                id="delete-related"
                checked={deleteRelatedData}
                onCheckedChange={checked => setDeleteRelatedData(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="delete-related" className="cursor-pointer font-medium">
                  Supprimer également toutes les interventions
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {deletionCheck.stats.interventionsCount} intervention(s) seront définitivement
                  supprimées. Cette action est irréversible.
                </p>
              </div>
            </div>
          )}

          {/* Confirmation par nom */}
          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Tapez le nom de l'établissement pour confirmer :{' '}
              <strong className="text-destructive">{establishment.name}</strong>
            </Label>
            <Input
              id="confirm-name"
              type="text"
              value={confirmationName}
              onChange={e => setConfirmationName(e.target.value)}
              placeholder={establishment.name}
              className={nameMatches ? 'border-green-500' : ''}
              autoComplete="off"
            />
            {confirmationName && !nameMatches && (
              <p className="text-sm text-destructive">Le nom ne correspond pas</p>
            )}
            {nameMatches && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Nom confirmé
              </p>
            )}
          </div>

          {/* Confirmation de compréhension */}
          <div className="flex items-start space-x-2 p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <Checkbox
              id="confirm-understood"
              checked={confirmUnderstood}
              onCheckedChange={checked => setConfirmUnderstood(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="confirm-understood" className="cursor-pointer font-medium">
                Je comprends que cette action est irréversible
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Toutes les données de cet établissement seront définitivement supprimées et ne
                pourront pas être récupérées.
              </p>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </ScrollArea>
    );
  };

  const renderProcessingStep = () => (
    <div className="space-y-4 py-8">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-destructive" />
        <div className="text-center">
          <p className="text-lg font-semibold">Suppression en cours...</p>
          <p className="text-sm text-muted-foreground">
            Cette opération peut prendre quelques instants
          </p>
        </div>
      </div>
      <Progress value={undefined} className="w-full" />
    </div>
  );

  const renderDoneStep = () => (
    <div className="space-y-4 py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
        </div>
        <div>
          <p className="text-lg font-semibold">Établissement supprimé</p>
          <p className="text-sm text-muted-foreground">
            L'établissement <strong>{establishment.name}</strong> a été définitivement supprimé
          </p>
        </div>

        {deletedCollections.length > 0 && (
          <div className="w-full max-w-md">
            <p className="text-sm font-medium mb-2">Collections supprimées :</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {deletedCollections.map((collection, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {collection}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="space-y-4 py-4">
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Impossible de supprimer l'établissement</p>
          {deletionCheck?.blockers && deletionCheck.blockers.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mt-2">
              {deletionCheck.blockers.map((blocker, index) => (
                <li key={index} className="text-sm">
                  {blocker}
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-sm mt-2">{error}</p>}
        </AlertDescription>
      </Alert>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  const getDialogTitle = () => {
    switch (step) {
      case 'check':
        return 'Vérification';
      case 'confirm':
        return 'Confirmer la suppression';
      case 'processing':
        return 'Suppression en cours';
      case 'done':
        return 'Suppression terminée';
      case 'error':
        return 'Erreur';
      default:
        return 'Supprimer l\'établissement';
    }
  };

  const getDialogDescription = () => {
    if (step === 'confirm') {
      return `Vous êtes sur le point de supprimer définitivement l'établissement "${establishment.name}". Cette action est irréversible.`;
    }
    return undefined;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <DialogTitle className="text-destructive">{getDialogTitle()}</DialogTitle>
          </div>
          {getDialogDescription() && (
            <DialogDescription className="text-base">
              {getDialogDescription()}
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 'check' && renderCheckStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'done' && renderDoneStep()}
        {step === 'error' && renderErrorStep()}

        <DialogFooter>
          {step === 'confirm' && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!(confirmationName === establishment.name && confirmUnderstood) || isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer définitivement
              </Button>
            </>
          )}

          {step === 'error' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}

          {step === 'done' && (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEstablishmentDialog;
