/**
 * ============================================================================
 * QR CODE GENERATOR COMPONENT
 * ============================================================================
 *
 * Composant pour générer et afficher un QR code pour une chambre
 */

import { useEffect } from 'react';
import { Download, QrCode, Loader2 } from 'lucide-react';
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
import { useQRCode } from '../hooks/useQRCode';
import type { RoomQRCodeData } from '../services/qrcodeService';

interface QRCodeGeneratorProps {
  roomData: RoomQRCodeData;
  trigger?: React.ReactNode;
  size?: number;
}

export const QRCodeGenerator = ({ roomData, trigger, size = 300 }: QRCodeGeneratorProps) => {
  const { qrCodeUrl, isGenerating, generateQRCode, download } = useQRCode({ size });

  // Générer automatiquement le QR code au montage
  useEffect(() => {
    if (roomData) {
      generateQRCode(roomData);
    }
  }, [roomData, generateQRCode]);

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <QrCode className="mr-2 h-4 w-4" />
      QR Code
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - Chambre {roomData.roomNumber}</DialogTitle>
          <DialogDescription>
            Scannez ce QR code pour identifier rapidement cette chambre lors de la création d'une
            intervention.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              {isGenerating ? (
                <div
                  className="flex items-center justify-center bg-gray-50 dark:bg-gray-800"
                  style={{ width: size, height: size }}
                >
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR Code - Chambre ${roomData.roomNumber}`}
                  className="rounded-lg border shadow-sm"
                  style={{ width: size, height: size }}
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-gray-50 text-gray-400 dark:bg-gray-800"
                  style={{ width: size, height: size }}
                >
                  Erreur de génération
                </div>
              )}

              {/* Info */}
              <div className="text-center">
                <p className="font-medium text-gray-900 dark:text-white">
                  Chambre {roomData.roomNumber}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {roomData.establishmentName}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => download(`qr-chambre-${roomData.roomNumber}`)}
                  disabled={!qrCodeUrl || isGenerating}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PNG
                </Button>
              </div>

              {/* Instructions */}
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
                <p className="font-medium">Comment utiliser ?</p>
                <ol className="mt-2 space-y-1 text-xs">
                  <li>1. Téléchargez et imprimez ce QR code</li>
                  <li>2. Collez-le sur la porte de la chambre</li>
                  <li>3. Scannez-le lors de la création d'intervention</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
