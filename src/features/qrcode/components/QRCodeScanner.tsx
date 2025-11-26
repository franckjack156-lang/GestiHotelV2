/**
 * ============================================================================
 * QR CODE SCANNER COMPONENT
 * ============================================================================
 *
 * Composant pour scanner un QR code de chambre via la caméra
 * Utilise @zxing/library pour le scan
 */

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { parseRoomQRCode, type RoomQRCodeData } from '../services/qrcodeService';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

interface QRCodeScannerProps {
  onScan: (data: RoomQRCodeData) => void;
  trigger?: React.ReactNode;
}

export const QRCodeScanner = ({ onScan, trigger }: QRCodeScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  /**
   * Démarrer le scan
   */
  const startScanning = async () => {
    setError(null);
    setIsScanning(true);

    try {
      // Demander permission caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Caméra arrière si disponible
      });

      setHasPermission(true);

      // Initialiser le reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Démarrer le scan
      if (videoRef.current) {
        codeReader.decodeFromVideoDevice(
          null, // Utilise la caméra par défaut
          videoRef.current,
          (result, error) => {
            if (result) {
              // QR code détecté
              const qrData = parseRoomQRCode(result.getText());

              if (qrData) {
                // QR code valide
                toast.success('QR code scanné', {
                  description: `Chambre ${qrData.roomNumber} - ${qrData.establishmentName}`,
                });

                onScan(qrData);
                stopScanning();
                setIsOpen(false);
              } else {
                // QR code invalide
                setError('QR code invalide. Veuillez scanner un QR code de chambre.');
              }
            }

            if (error && !(error instanceof NotFoundException)) {
              logger.error('QR scan error:', error);
            }
          }
        );
      }

      // Assigner le stream au video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      logger.error('Camera access error:', err);
      setHasPermission(false);

      if (err.name === 'NotAllowedError') {
        setError("Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra.");
      } else if (err.name === 'NotFoundError') {
        setError('Aucune caméra détectée sur cet appareil.');
      } else {
        setError("Erreur lors de l'accès à la caméra.");
      }
    }
  };

  /**
   * Arrêter le scan
   */
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }

    // Arrêter tous les tracks vidéo
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  /**
   * Démarrer automatiquement quand le dialog s'ouvre
   */
  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Camera className="mr-2 h-4 w-4" />
      Scanner QR Code
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scanner un QR Code</DialogTitle>
          <DialogDescription>
            Pointez la caméra vers le QR code de la chambre pour l'identifier automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-black">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Overlay de visée */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 border-4 border-white/50 rounded-lg shadow-lg" />
                </div>

                {/* Instructions */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-center text-sm text-white">Centrez le QR code dans le cadre</p>
                </div>
              </>
            ) : hasPermission === false ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-white">
                <div>
                  <AlertCircle className="mx-auto h-12 w-12 mb-2 text-red-400" />
                  <p className="text-sm">Accès caméra refusé</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>

            {hasPermission === false && (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            )}
          </div>

          {/* Help */}
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
            <p className="font-medium">Conseils :</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Assurez-vous d'avoir un bon éclairage</li>
              <li>Tenez le téléphone bien stable</li>
              <li>Centrez le QR code dans le cadre</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
