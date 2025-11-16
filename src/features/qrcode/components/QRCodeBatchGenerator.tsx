/**
 * ============================================================================
 * QR CODE BATCH GENERATOR COMPONENT
 * ============================================================================
 *
 * Composant pour générer plusieurs QR codes en une seule fois
 * Utile pour imprimer tous les QR codes d'un établissement
 */

import { useState } from 'react';
import { Download, Printer, QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { generateBatchQRCodes, downloadQRCode } from '../services/qrcodeService';
import { toast } from 'sonner';

interface Room {
  id: string;
  number: string;
}

interface QRCodeBatchGeneratorProps {
  rooms: Room[];
  establishmentId: string;
  establishmentName: string;
  trigger?: React.ReactNode;
}

export const QRCodeBatchGenerator = ({
  rooms,
  establishmentId,
  establishmentName,
  trigger,
}: QRCodeBatchGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedQRCodes, setGeneratedQRCodes] = useState<
    Array<{ roomId: string; roomNumber: string; dataUrl: string }>
  >([]);

  /**
   * Générer tous les QR codes
   */
  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedQRCodes([]);

    try {
      const roomsData = rooms.map(room => ({
        id: room.id,
        number: room.number,
        establishmentId,
        establishmentName,
      }));

      // Simuler progression
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const qrCodes = await generateBatchQRCodes(roomsData, { size: 300 });

      clearInterval(interval);
      setProgress(100);
      setGeneratedQRCodes(qrCodes);

      toast.success('QR codes générés', {
        description: `${qrCodes.length} QR codes créés avec succès`,
      });
    } catch (error: any) {
      console.error('Error generating batch QR codes:', error);
      toast.error('Erreur de génération', {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Télécharger tous les QR codes
   */
  const handleDownloadAll = () => {
    generatedQRCodes.forEach(qr => {
      downloadQRCode(qr.dataUrl, `qr-chambre-${qr.roomNumber}`);
    });

    toast.success('Téléchargements lancés', {
      description: `${generatedQRCodes.length} fichiers en cours de téléchargement`,
    });
  };

  /**
   * Imprimer tous les QR codes
   */
  const handlePrint = () => {
    // Créer une fenêtre d'impression avec tous les QR codes
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - ${establishmentName}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: Arial, sans-serif; }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 2cm;
              padding: 1cm;
            }
            .qr-item {
              text-align: center;
              page-break-inside: avoid;
              border: 1px solid #e5e7eb;
              padding: 1cm;
              border-radius: 8px;
            }
            .qr-item img {
              width: 200px;
              height: 200px;
              margin: 0 auto;
            }
            .qr-title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 1cm;
            }
            .qr-subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-top: 0.3cm;
            }
            .qr-instructions {
              font-size: 10px;
              color: #9ca3af;
              margin-top: 0.5cm;
              border-top: 1px solid #e5e7eb;
              padding-top: 0.3cm;
            }
            @media print {
              .qr-item {
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-grid">
            ${generatedQRCodes
              .map(
                qr => `
              <div class="qr-item">
                <img src="${qr.dataUrl}" alt="QR Code Chambre ${qr.roomNumber}" />
                <div class="qr-title">Chambre ${qr.roomNumber}</div>
                <div class="qr-subtitle">${establishmentName}</div>
                <div class="qr-instructions">
                  Scannez ce QR code lors de la création d'une intervention
                </div>
              </div>
            `
              )
              .join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const defaultTrigger = (
    <Button variant="outline">
      <QrCode className="mr-2 h-4 w-4" />
      Générer tous les QR codes
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Génération en masse de QR codes</DialogTitle>
          <DialogDescription>
            Générez et imprimez les QR codes pour toutes les {rooms.length} chambres de
            l'établissement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {rooms.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Chambres à traiter</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{generatedQRCodes.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">QR codes générés</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Génération en cours...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Success */}
          {generatedQRCodes.length > 0 && !isGenerating && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  {generatedQRCodes.length} QR codes prêts à être imprimés
                </span>
              </div>
            </div>
          )}

          {/* Preview Grid */}
          {generatedQRCodes.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-lg border p-4 dark:border-gray-700">
              <div className="grid grid-cols-4 gap-4">
                {generatedQRCodes.slice(0, 12).map(qr => (
                  <div key={qr.roomId} className="text-center" title={`Chambre ${qr.roomNumber}`}>
                    <img
                      src={qr.dataUrl}
                      alt={`QR ${qr.roomNumber}`}
                      className="w-full rounded border shadow-sm"
                    />
                    <p className="mt-1 text-xs font-medium">{qr.roomNumber}</p>
                  </div>
                ))}
              </div>
              {generatedQRCodes.length > 12 && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  Et {generatedQRCodes.length - 12} autres...
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {generatedQRCodes.length === 0 ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || rooms.length === 0}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Générer {rooms.length} QR codes
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button onClick={handleDownloadAll} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger tout
                </Button>
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer tout
                </Button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
            <p className="font-medium">Recommandations d'impression :</p>
            <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
              <li>Format recommandé : A4 (2 QR codes par page)</li>
              <li>Qualité : Haute résolution pour un meilleur scan</li>
              <li>Papier : Plastifié pour une meilleure durabilité</li>
              <li>Emplacement : À hauteur de scan (1,5m du sol)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
