/**
 * ============================================================================
 * IMPORT DIALOG COMPONENT
 * ============================================================================
 *
 * Composant réutilisable pour importer des données depuis Excel
 * - Upload de fichier
 * - Preview des données
 * - Affichage des erreurs
 * - Confirmation avant import
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
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  X,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ImportResult, ImportError } from '@/shared/services/importService';
import { downloadErrorReport } from '@/shared/services/importService';

// ============================================================================
// TYPES
// ============================================================================

export interface ImportDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  acceptedFileTypes?: string;
  maxFileSize?: number; // en MB
  templateDownloadFn?: () => void;
  onImport: (file: File) => Promise<ImportResult<T>>;
  onConfirm: (data: T[]) => Promise<void>;
  renderPreview?: (data: T[]) => React.ReactNode;
}

type Step = 'upload' | 'preview' | 'importing' | 'success';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ImportDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  acceptedFileTypes = '.xlsx,.xls',
  maxFileSize = 10,
  templateDownloadFn,
  onImport,
  onConfirm,
  renderPreview,
}: ImportDialogProps<T>) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult<T> | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Vérifier le type de fichier
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !acceptedFileTypes.includes(fileExtension)) {
      toast.error('Type de fichier invalide', {
        description: `Formats acceptés: ${acceptedFileTypes}`,
      });
      return;
    }

    // Vérifier la taille
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      toast.error('Fichier trop volumineux', {
        description: `Taille maximale: ${maxFileSize} MB`,
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setStep('preview');
    toast.loading('Analyse du fichier...');

    try {
      const result = await onImport(file);
      setImportResult(result);
      toast.dismiss();

      if (result.success) {
        toast.success('Fichier analysé avec succès', {
          description: `${result.stats.valid} ligne(s) valide(s)`,
        });
      } else {
        toast.warning('Fichier analysé avec des erreurs', {
          description: `${result.stats.valid} valide(s), ${result.stats.invalid} erreur(s)`,
        });
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur lors de l\'analyse du fichier');
      console.error(error);
      setStep('upload');
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult || importResult.data.length === 0) return;

    setStep('importing');

    try {
      await onConfirm(importResult.data);
      setStep('success');
      toast.success('Import réussi !', {
        description: `${importResult.data.length} élément(s) importé(s)`,
      });

      // Fermer après 2 secondes
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      toast.error('Erreur lors de l\'import');
      console.error(error);
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const handleDownloadErrors = () => {
    if (importResult?.errors) {
      downloadErrorReport(
        importResult.errors,
        `erreurs-import-${new Date().toISOString().split('T')[0]}.txt`
      );
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Template download */}
            {templateDownloadFn && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Téléchargez le template Excel pour voir le format attendu</span>
                  <Button variant="outline" size="sm" onClick={templateDownloadFn}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le template
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                </div>

                {file ? (
                  <div className="text-center">
                    <p className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-medium">Glissez-déposez votre fichier Excel ici</p>
                    <p className="text-sm text-muted-foreground mt-1">ou cliquez pour parcourir</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formats acceptés: {acceptedFileTypes} • Max {maxFileSize} MB
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept={acceptedFileTypes}
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {file && (
              <Button onClick={handleProcessFile} className="w-full" size="lg">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Analyser le fichier
              </Button>
            )}
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && importResult && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{importResult.stats.total}</div>
                <div className="text-sm text-muted-foreground">Lignes totales</div>
              </div>
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importResult.stats.valid}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Valides</div>
              </div>
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {importResult.stats.invalid}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">Erreurs</div>
              </div>
            </div>

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>{importResult.errors.length} erreur(s) détectée(s)</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadErrors}
                      className="ml-4"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger le rapport
                    </Button>
                  </div>
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="text-xs font-mono bg-red-100 dark:bg-red-950/30 p-2 rounded">
                        Ligne {error.row}: {error.field && `${error.field} - `}
                        {error.message}
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs italic">
                        ... et {importResult.errors.length - 5} autre(s) erreur(s)
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview des données valides */}
            {importResult.data.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Aperçu des données à importer</h4>
                  <Badge variant="secondary">
                    {importResult.data.length} élément{importResult.data.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                {renderPreview ? (
                  renderPreview(importResult.data)
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {importResult.data.length} ligne(s) prête(s) à être importée(s)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: IMPORTING */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="font-medium">Import en cours...</p>
            <p className="text-sm text-muted-foreground mt-1">Veuillez patienter</p>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-green-100 dark:bg-green-950/30 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-green-600 dark:text-green-400">Import réussi !</p>
            <p className="text-sm text-muted-foreground mt-1">Les données ont été importées</p>
          </div>
        )}

        {/* FOOTER */}
        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          )}

          {step === 'preview' && importResult && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setImportResult(null);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={importResult.data.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Importer {importResult.data.length} élément
                {importResult.data.length > 1 ? 's' : ''}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
