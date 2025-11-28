/**
 * Dialog de progression d'import avec gestion d'erreurs
 */

import { useCallback } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Download,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import type { BatchProgress, BatchError } from '@/shared/services/import/batchProcessor';

type ImportState = 'idle' | 'parsing' | 'validating' | 'importing' | 'completed' | 'error' | 'paused';

interface ImportProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  state: ImportState;
  progress?: BatchProgress;
  errors?: BatchError<unknown>[];
  warnings?: string[];
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onDownloadReport?: () => void;
}

/**
 * Formater le temps en format lisible
 */
const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

/**
 * État label
 */
const STATE_LABELS: Record<ImportState, string> = {
  idle: 'Prêt',
  parsing: 'Lecture du fichier...',
  validating: 'Validation des données...',
  importing: 'Import en cours...',
  completed: 'Import terminé',
  error: 'Erreur',
  paused: 'En pause',
};

export const ImportProgressDialog = ({
  isOpen,
  onClose,
  title = 'Import de données',
  description = 'Progression de l\'import en cours',
  state,
  progress,
  errors = [],
  warnings = [],
  onRetry,
  onPause,
  onResume,
  onCancel,
  onDownloadReport,
}: ImportProgressDialogProps) => {
  const isInProgress = state === 'parsing' || state === 'validating' || state === 'importing' || state === 'paused';
  const isCompleted = state === 'completed';
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  const handleClose = useCallback(() => {
    if (!isInProgress) {
      onClose();
    }
  }, [isInProgress, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {state === 'importing' && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
            {state === 'completed' && !hasErrors && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {state === 'completed' && hasErrors && (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
            {state === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {state === 'paused' && <Pause className="h-5 w-5 text-yellow-500" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* État actuel */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{STATE_LABELS[state]}</span>
            {progress && (
              <Badge variant={isCompleted ? 'default' : 'secondary'}>
                {progress.percentage}%
              </Badge>
            )}
          </div>

          {/* Barre de progression */}
          {progress && (
            <div className="space-y-2">
              <Progress value={progress.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {progress.processed} / {progress.total} éléments
                </span>
                {progress.estimatedTimeRemaining && isInProgress && (
                  <span>~{formatTime(progress.estimatedTimeRemaining)} restant</span>
                )}
                {isCompleted && <span>Terminé en {formatTime(progress.elapsedTime)}</span>}
              </div>
            </div>
          )}

          {/* Statistiques */}
          {progress && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {progress.total}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {progress.succeeded}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Réussis</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {progress.failed}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">Échoués</div>
              </div>
            </div>
          )}

          {/* Erreurs et avertissements */}
          {(hasErrors || hasWarnings) && (
            <Accordion type="single" collapsible className="w-full">
              {hasErrors && (
                <AccordionItem value="errors">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      {errors.length} erreur{errors.length > 1 ? 's' : ''}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {errors.slice(0, 20).map((error, i) => (
                          <div
                            key={i}
                            className="p-2 text-xs bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                          >
                            <div className="font-medium text-red-700 dark:text-red-400">
                              Ligne {error.index + 1}
                            </div>
                            <div className="text-red-600 dark:text-red-300">{error.error}</div>
                          </div>
                        ))}
                        {errors.length > 20 && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            +{errors.length - 20} autres erreurs
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasWarnings && (
                <AccordionItem value="warnings">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      {warnings.length} avertissement{warnings.length > 1 ? 's' : ''}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {warnings.map((warning, i) => (
                          <div
                            key={i}
                            className="p-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 rounded"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Actions pendant l'import */}
          {isInProgress && (
            <>
              {state === 'paused' && onResume && (
                <Button onClick={onResume} variant="outline" className="gap-2">
                  <Play size={16} />
                  Reprendre
                </Button>
              )}
              {state !== 'paused' && onPause && (
                <Button onClick={onPause} variant="outline" className="gap-2">
                  <Pause size={16} />
                  Pause
                </Button>
              )}
              {onCancel && (
                <Button onClick={onCancel} variant="destructive" className="gap-2">
                  <X size={16} />
                  Annuler
                </Button>
              )}
            </>
          )}

          {/* Actions après l'import */}
          {(isCompleted || state === 'error') && (
            <>
              {hasErrors && onDownloadReport && (
                <Button onClick={onDownloadReport} variant="outline" className="gap-2">
                  <Download size={16} />
                  Télécharger rapport
                </Button>
              )}
              {onRetry && (
                <Button onClick={onRetry} variant="outline" className="gap-2">
                  <RotateCcw size={16} />
                  Réessayer
                </Button>
              )}
              <Button onClick={handleClose}>Fermer</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
